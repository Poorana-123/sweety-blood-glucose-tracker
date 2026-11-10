import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [readings, setReadings] = useState([]);

    const [dailyReport, setDailyReport] = useState(null);
    const [mtdReport, setMtdReport] = useState(null);
    const [previousMonthReport, setPreviousMonthReport] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // CRUD form states
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    // Date filter
const [selectedDate, setSelectedDate] = useState("");

// Pagination
const [currentPage, setCurrentPage] = useState(1);

const readingsPerPage = 5;



    const getLocalDate = () => {
        const today = new Date();

        return [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");
    };

    const initialFormData = {
        reading_date: getLocalDate(),
        time_slot: "Morning (fasting)",
        glucose_value: ""
    };

    const [formData, setFormData] = useState(initialFormData);

    // Load user and dashboard data
    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error("User data parsing error:", err);
            }
        }

        fetchDashboardData();
    }, []);

    // Fetch all dashboard data
    const fetchDashboardData = async (showLoader = true) => {
        try {
            if (showLoader) {
                setLoading(true);
            }

            setError("");

            const localDate = getLocalDate();

            const [
                readingsResponse,
                dailyResponse,
                mtdResponse,
                previousMonthResponse
            ] = await Promise.all([
                API.get("/readings"),
                API.get(`/readings/daily-report?date=${localDate}`),
                API.get("/readings/mtd-report"),
                API.get("/readings/previous-month-report")
            ]);

            setReadings(
                readingsResponse.data.readings ||
                readingsResponse.data
            );

            setDailyReport(dailyResponse.data);
            setMtdReport(mtdResponse.data);
            setPreviousMonthReport(previousMonthResponse.data);

        } catch (err) {
            console.error("Dashboard loading error:", err);

            if (
                err.response?.status === 401 ||
                err.response?.status === 403
            ) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                navigate("/login");
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard data"
                );
            }
        } finally {
            if (showLoader) {
                setLoading(false);
            }
        }
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
    };

    // Current month name
    const getMonthName = () => {
        return new Date().toLocaleString("en-IN", {
            month: "long"
        });
    };

    // Previous month name
    const getPreviousMonthName = () => {
        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - 1);

        return date.toLocaleString("en-IN", {
            month: "long"
        });
    };

    // Open Add Reading form
    const handleAddReading = (timeSlot = "Morning (fasting)") => {
    setEditingId(null);

    setFormData({
        ...initialFormData,
        reading_date: getLocalDate(),
        time_slot: timeSlot
    });

    setError("");
    setSuccess("");
    setShowForm(true);
};

    // Open Edit Reading form
    const handleEditReading = (reading) => {
        setEditingId(reading.id);

        setFormData({
            reading_date: String(reading.reading_date).slice(0, 10),
            time_slot: reading.time_slot,
            glucose_value: reading.glucose_value
        });

        setError("");
        setSuccess("");
        setShowForm(true);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // CREATE and UPDATE reading
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                reading_date: formData.reading_date,
                time_slot: formData.time_slot,
                glucose_value: Number(formData.glucose_value)
            };

            if (editingId) {
                // UPDATE - PUT
                await API.put(`/readings/${editingId}`, payload);

                setSuccess("Reading updated successfully!");
            } else {
                // CREATE - POST
                await API.post("/readings", payload);

                setSuccess("Reading added successfully!");
            }

            setShowForm(false);
            setEditingId(null);
            setFormData(initialFormData);

            // Refresh readings and reports
            await fetchDashboardData(false);

        } catch (err) {
            console.error("Save reading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to save reading. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // DELETE reading
    const handleDeleteReading = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this glucose reading?"
        );

        if (!confirmDelete) {
            return;
        }

        try {
            setError("");
            setSuccess("");

            await API.delete(`/readings/${id}`);

            setSuccess("Reading deleted successfully!");

            // Refresh readings and reports
            await fetchDashboardData(false);

        } catch (err) {
            console.error("Delete reading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete reading."
            );
        }
    };

    // Convert reading date to YYYY-MM-DD
const formatReadingDate = (dateValue) => {
    if (!dateValue) return "";

    return String(dateValue).slice(0, 10);
};

// Filter readings based on selected date
const filteredReadings = readings.filter((reading) => {
    if (!selectedDate) {
        return true;
    }

    return formatReadingDate(reading.reading_date) === selectedDate;
});

// Total pages
const totalPages = Math.max(
    1,
    Math.ceil(filteredReadings.length / readingsPerPage)
);

// Current page readings
const indexOfLastReading = currentPage * readingsPerPage;

const indexOfFirstReading =
    indexOfLastReading - readingsPerPage;

const paginatedReadings = filteredReadings.slice(
    indexOfFirstReading,
    indexOfLastReading
);

// Previous page
const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
};

// Next page
const handleNextPage = () => {
    setCurrentPage((prev) =>
        Math.min(prev + 1, totalPages)
    );
};

// Date filter change
const handleDateFilter = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
};

// Clear date filter
const handleClearDateFilter = () => {
    setSelectedDate("");
    setCurrentPage(1);
};

    const timeSlots = [
    "Morning (fasting)",
    "After breakfast",
    "After lunch",
    "After dinner"
];

// Get today's date in local YYYY-MM-DD format
const getTodayDate = () => {
    const today = new Date();

    return `${today.getFullYear()}-${String(
        today.getMonth() + 1
    ).padStart(2, "0")}-${String(
        today.getDate()
    ).padStart(2, "0")}`;
};

// Normalize API date to YYYY-MM-DD
const normalizeDate = (dateValue) => {
    const dateString = String(dateValue);

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }

    // Handles timestamps such as 2026-11-09T18:30:00.000Z
    const date = new Date(dateString);

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}-${String(
        date.getDate()
    ).padStart(2, "0")}`;
};

// Find today's readings
const todayReadings = readings.filter(
    (reading) =>
        normalizeDate(reading.reading_date) === getTodayDate()
);

// Calculate completion
const completedSlots = timeSlots.filter((slot) =>
    todayReadings.some(
        (reading) => reading.time_slot === slot
    )
).length;

const progressPercentage = (completedSlots / 4) * 100;

    // Close form
    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        setError("");
    };

    // Report Card component
    const ReportCard = ({ title, value, unit = "" }) => {
        return (
            <div className="report-card">
                <p>{title}</p>

                <h3>
                    {value ?? "--"} {unit}
                </h3>
            </div>
        );
    };

    // Loading screen
    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* Navbar */}
            <nav className="dashboard-navbar">

                <div className="dashboard-logo">
                    <span>♥</span> Sweety
                </div>

                <div className="dashboard-user">

                    <span>
                        Welcome, {user?.name || "User"}
                    </span>

                    <button onClick={handleLogout}>
                        Logout
                    </button>

                </div>

            </nav>

            {/* Main Content */}
            <main className="dashboard-main">

                {/* Dashboard Heading */}
                <section className="dashboard-heading">

                    <div>

                        <p className="dashboard-label">
                            BLOOD GLUCOSE TRACKER
                        </p>

                        <h1>
                            Your Health Dashboard
                        </h1>

                        <p>
                            Keep track of your glucose readings and reports.
                        </p>

                    </div>

                    <button
                        className="add-reading-button"
                        onClick={handleAddReading}
                    >
                        + Add Reading
                    </button>

                </section>

                {/* Today's Glucose Tracking */}
<section className="today-tracking-section">

    <div className="tracking-heading">
        <div>
            <span className="tracking-label">
                DAILY MONITORING
            </span>

            <h2>Today's Glucose Tracking</h2>

            <p>
                Keep track of your four daily glucose sessions.
            </p>
        </div>

        <div className="tracking-progress">
            <span className="progress-count">
                {completedSlots}/4
            </span>

            <span className="progress-text">
                Sessions Completed
            </span>
        </div>
    </div>

    {/* Progress Bar */}
    <div className="tracking-progress-bar">
        <div
            className="tracking-progress-fill"
            style={{
                width: `${progressPercentage}%`
            }}
        />
    </div>

    {/* Session Cards */}
    <div className="session-cards">

        {timeSlots.map((slot, index) => {

            const reading = todayReadings.find(
                (item) => item.time_slot === slot
            );

            const isCompleted = Boolean(reading);

            return (
                <div
                    key={slot}
                    className={`session-card ${
                        isCompleted
                            ? "session-completed"
                            : "session-pending"
                    }`}
                >

                    <div className="session-card-top">

                        <div className="session-icon">
                            {["☀️", "🍳", "🌤️", "🌙"][index]}
                        </div>

                        <span
                            className={`session-status ${
                                isCompleted
                                    ? "status-completed"
                                    : "status-pending"
                            }`}
                        >
                            {isCompleted
                                ? "✓ Completed"
                                : "● Pending"}
                        </span>

                    </div>

                    <div className="session-card-content">

                        <span className="session-number">
                            SESSION 0{index + 1}
                        </span>

                        <h3>{slot}</h3>

                        {isCompleted ? (

                            <div className="session-reading">

                                <h2>
                                    {reading.glucose_value}
                                    <span> mg/dL</span>
                                </h2>

                                <p>
                                    Reading recorded successfully
                                </p>

                            </div>

                        ) : (

                            <div className="session-reading pending-reading">

                                <h2>--</h2>

                                <p>
                                    No reading recorded yet
                                </p>

                            </div>

                        )}

                    </div>

                    <div className="session-card-actions">

                        {isCompleted ? (

                            <>

                                <button
                                    className="session-edit-button"
                                    onClick={() =>
                                        handleEditReading(reading)
                                    }
                                >
                                    ✏️ Edit Reading
                                </button>

                                <button
                                    className="session-delete-button"
                                    onClick={() =>
                                        handleDeleteReading(reading.id)
                                    }
                                >
                                    Delete
                                </button>

                            </>

                        ) : (

                            <button
                                className="session-add-button"
                                onClick={() =>
                                    handleAddReading(slot)
                                }
                            >
                                + Add Reading
                            </button>

                        )}

                    </div>

                </div>
            );

        })}

    </div>

</section>

                {/* Success Message */}
                {success && (
                    <div
                        style={{
                            background: "#e6f9ef",
                            color: "#15803d",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            marginBottom: "20px"
                        }}
                    >
                        {success}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* Today's Report */}
                <section className="report-section">

                    <h2>Today's Report</h2>

                    <div className="report-cards">

                        <ReportCard
                            title="Total Readings"
                            value={
                                dailyReport?.report?.total_readings ?? 0
                            }
                        />

                        <ReportCard
                            title="Average Glucose"
                            value={
                                dailyReport?.report?.average_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Minimum Glucose"
                            value={
                                dailyReport?.report?.minimum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Maximum Glucose"
                            value={
                                dailyReport?.report?.maximum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                    </div>

                </section>

                {/* Month-to-Date Report */}
                <section className="report-section">

                    <h2>
                        {getMonthName()} — Month to Date
                    </h2>

                    <div className="report-cards">

                        <ReportCard
                            title="Total Readings"
                            value={
                                mtdReport?.report?.total_readings ?? 0
                            }
                        />

                        <ReportCard
                            title="Average Glucose"
                            value={
                                mtdReport?.report?.average_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Minimum Glucose"
                            value={
                                mtdReport?.report?.minimum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Maximum Glucose"
                            value={
                                mtdReport?.report?.maximum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                    </div>

                </section>

                {/* Previous Month Report */}
                <section className="report-section">

                    <h2>
                        {getPreviousMonthName()} Report
                    </h2>

                    <div className="report-cards">

                        <ReportCard
                            title="Total Readings"
                            value={
                                previousMonthReport?.report?.total_readings ?? 0
                            }
                        />

                        <ReportCard
                            title="Average Glucose"
                            value={
                                previousMonthReport?.report?.average_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Minimum Glucose"
                            value={
                                previousMonthReport?.report?.minimum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                        <ReportCard
                            title="Maximum Glucose"
                            value={
                                previousMonthReport?.report?.maximum_glucose ?? "--"
                            }
                            unit="mg/dL"
                        />

                    </div>

                </section>

                {/* Readings History */}
<section className="readings-history">

    <div className="readings-header">

        <div>
            <span className="history-label">
                GLUCOSE RECORDS
            </span>

            <h2>Reading History</h2>

            <p>
                View and manage your glucose readings.
            </p>
        </div>

        {/* Date Filter */}
        <div className="date-filter">

            <label htmlFor="reading-date">
                Filter by Date
            </label>

            <input
                type="date"
                id="reading-date"
                value={selectedDate}
                max={getLocalDate()}
                onChange={(e) =>
                    handleDateFilter(e.target.value)
                }
            />

            {selectedDate && (
                <button
                    className="clear-filter-btn"
                    onClick={handleClearDateFilter}
                >
                    Clear
                </button>
            )}

        </div>

    </div>

    {/* Readings Table */}
    <div className="readings-table-container">

        <table className="readings-table">

            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time Slot</th>
                    <th>Glucose Value</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>

            <tbody>

                {paginatedReadings.length > 0 ? (

                    paginatedReadings.map((reading) => (

                        <tr key={reading.id}>

                            <td>
                                {formatReadingDate(
                                    reading.reading_date
                                )}
                            </td>

                            <td>
                                {reading.time_slot}
                            </td>

                            <td>
                                <span className="glucose-value">
                                    {reading.glucose_value} mg/dL
                                </span>
                            </td>

                            <td>
                                <span className="record-status">
                                    Recorded
                                </span>
                            </td>

                            <td>
                                <div className="table-actions">

                                    <button
                                        className="edit-btn"
                                        onClick={() =>
                                            handleEditReading(reading)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDeleteReading(reading.id)
                                        }
                                    >
                                        Delete
                                    </button>

                                </div>
                            </td>

                        </tr>

                    ))

                ) : (

                    <tr>
                        <td colSpan="5" className="no-readings">
                            No readings found for this date.
                        </td>
                    </tr>

                )}

            </tbody>

        </table>

    </div>

    {/* Pagination */}
    <div className="pagination-container">

        <div className="pagination-info">

            Showing{" "}
            {filteredReadings.length === 0
                ? 0
                : indexOfFirstReading + 1}
            {" - "}
            {Math.min(
                indexOfLastReading,
                filteredReadings.length
            )}
            {" of "}
            {filteredReadings.length} readings

        </div>

        <div className="pagination-buttons">

            <button
                className="pagination-btn"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
            >
                ← Previous
            </button>

            <span className="page-number">
                Page {currentPage} of {totalPages}
            </span>

            <button
                className="pagination-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
            >
                Next →
            </button>

        </div>

    </div>

</section>

            </main>

            {/* Add / Edit Reading Modal */}
            {showForm && (

                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(15, 23, 42, 0.55)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 2000,
                        padding: "20px"
                    }}
                >

                    <div
                        style={{
                            background: "#ffffff",
                            width: "100%",
                            maxWidth: "450px",
                            borderRadius: "16px",
                            padding: "28px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)"
                        }}
                    >

                        <h2 style={{ marginBottom: "8px" }}>
                            {editingId
                                ? "Edit Glucose Reading"
                                : "Add Glucose Reading"}
                        </h2>

                        <p
                            style={{
                                color: "#64748b",
                                marginBottom: "24px"
                            }}
                        >
                            Enter your glucose reading details.
                        </p>

                        <form onSubmit={handleSubmit}>

                            {/* Reading Date */}
                            <div style={{ marginBottom: "18px" }}>

                                <label
                                    htmlFor="reading_date"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Reading Date
                                </label>

                                <input
                                    type="date"
                                    id="reading_date"
                                    name="reading_date"
                                    value={formData.reading_date}
                                    onChange={handleInputChange}
                                    required
                                    max={getLocalDate()}
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        boxSizing: "border-box"
                                    }}
                                />

                            </div>

                            {/* Time Slot */}
                            <div style={{ marginBottom: "18px" }}>

                                <label
                                    htmlFor="time_slot"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Time Slot
                                </label>

                                <select
                                    id="time_slot"
                                    name="time_slot"
                                    value={formData.time_slot}
                                    onChange={handleInputChange}
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        boxSizing: "border-box"
                                    }}
                                >

                                    <option value="Morning (fasting)">
                                        Morning (fasting)
                                    </option>

                                    <option value="After breakfast">
                                        After breakfast
                                    </option>

                                    <option value="After lunch">
                                        After lunch
                                    </option>

                                    <option value="After dinner">
                                        After dinner
                                    </option>

                                </select>

                            </div>

                            {/* Glucose Value */}
                            <div style={{ marginBottom: "24px" }}>

                                <label
                                    htmlFor="glucose_value"
                                    style={{
                                        display: "block",
                                        marginBottom: "8px",
                                        fontWeight: "600"
                                    }}
                                >
                                    Glucose Value (mg/dL)
                                </label>

                                <input
                                    type="number"
                                    id="glucose_value"
                                    name="glucose_value"
                                    value={formData.glucose_value}
                                    onChange={handleInputChange}
                                    required
                                    min="40"
                                    max="600"
                                    step="1"
                                    placeholder="Enter glucose value"
                                    style={{
                                        width: "100%",
                                        padding: "12px",
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "8px",
                                        boxSizing: "border-box"
                                    }}
                                />

                            </div>

                            {/* Form Buttons */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px"
                                }}
                            >

                                <button
                                    type="submit"
                                    disabled={saving}
                                    style={{
                                        flex: 1,
                                        background: "#0f766e",
                                        color: "#ffffff",
                                        padding: "12px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Reading"
                                            : "Save Reading"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                    style={{
                                        flex: 1,
                                        background: "#f1f5f9",
                                        color: "#334155",
                                        padding: "12px",
                                        border: "none",
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        fontWeight: "600"
                                    }}
                                >
                                    Cancel
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Dashboard;