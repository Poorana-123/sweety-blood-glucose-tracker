
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [readings, setReadings] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [dailyReport, setDailyReport] = useState(null);
    const [mtdReport, setMtdReport] = useState(null);
    const [previousMonthReport, setPreviousMonthReport] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const [selectedDate, setSelectedDate] = useState("");
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

    // Fetch dashboard data
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

    // Month names
    const getMonthName = () => {
        return new Date().toLocaleString("en-IN", {
            month: "long"
        });
    };

    const getPreviousMonthName = () => {
        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - 1);

        return date.toLocaleString("en-IN", {
            month: "long"
        });
    };

    // Add reading
const handleAddReading = (timeSlot = "Morning (fasting)") => {
    // Prevent a React event from being stored as time_slot
    const selectedTimeSlot =
        typeof timeSlot === "string" &&
        timeSlots.includes(timeSlot)
            ? timeSlot
            : "Morning (fasting)";

    setEditingId(null);

    setFormData({
        reading_date: getLocalDate(),
        time_slot: selectedTimeSlot,
        glucose_value: ""
    });

    setError("");
    setSuccess("");
    setShowForm(true);
};

    // Edit reading
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

    // Input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Create / Update
   const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Submit event:", e);
    console.log("Form data:", formData);

    const payload = {
        reading_date: formData.reading_date,
        time_slot: formData.time_slot,
        glucose_value: Number(formData.glucose_value)
    };

    console.log("Payload:", payload);
    console.log("Payload JSON:", JSON.stringify(payload));

    try {
        setSaving(true);
        setError("");
        setSuccess("");

        if (editingId) {
            console.log("Updating reading:", editingId);

            await API.put(`/readings/${editingId}`, payload);

            setSuccess("Reading updated successfully!");
        } else {
            console.log("Adding reading");

            await API.post("/readings", payload);

            setSuccess("Reading added successfully!");
        }

        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);

        await fetchDashboardData(false);

    } catch (err) {
        console.error("Save reading error:", err);

        console.error("Error response:", err.response?.data);

        setError(
            err.response?.data?.message ||
            "Unable to save reading. Please try again."
        );
    } finally {
        setSaving(false);
    }
};

    // Delete
    const handleDeleteReading = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this glucose reading?"
        );

        if (!confirmDelete) return;

        try {
            setError("");
            setSuccess("");

            await API.delete(`/readings/${id}`);

            setSuccess("Reading deleted successfully!");

            await fetchDashboardData(false);

        } catch (err) {
            console.error("Delete reading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to delete reading."
            );
        }
    };

    // Format reading date
    const formatReadingDate = (dateValue) => {
        if (!dateValue) return "";

        return String(dateValue).slice(0, 10);
    };

    // Filter readings
    const filteredReadings = readings.filter((reading) => {
        if (!selectedDate) return true;

        return formatReadingDate(reading.reading_date) === selectedDate;
    });

    // Pagination
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReadings.length / readingsPerPage)
    );

    const indexOfLastReading = currentPage * readingsPerPage;
    const indexOfFirstReading = indexOfLastReading - readingsPerPage;

    const paginatedReadings = filteredReadings.slice(
        indexOfFirstReading,
        indexOfLastReading
    );

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const handleDateFilter = (date) => {
        setSelectedDate(date);
        setCurrentPage(1);
    };

    const handleClearDateFilter = () => {
        setSelectedDate("");
        setCurrentPage(1);
    };

    // Time slots
    const timeSlots = [
        "Morning (fasting)",
        "After breakfast",
        "After lunch",
        "After dinner"
    ];

    const sessionIcons = ["☀", "◒", "◉", "☾"];

    // Today's readings
    const getTodayDate = () => getLocalDate();

    const normalizeDate = (dateValue) => {
        const dateString = String(dateValue);

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        const date = new Date(dateString);

        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}-${String(
            date.getDate()
        ).padStart(2, "0")}`;
    };

    const todayReadings = readings.filter(
        (reading) =>
            normalizeDate(reading.reading_date) === getTodayDate()
    );

    const completedSlots = timeSlots.filter((slot) =>
        todayReadings.some(
            (reading) => reading.time_slot === slot
        )
    ).length;

    const progressPercentage = (completedSlots / 4) * 100;

    // Cancel form
    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        setError("");
    };

    // Loading
    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Preparing your health dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* Sidebar */}
            <aside className={`dashboard-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

                <div className="sidebar-brand">
                    <div className="brand-icon">♥</div>
                    <span>Sweety</span>
                </div>

                <div className="sidebar-label">
                    WORKSPACE
                </div>

                <button className="sidebar-link active">
                    <span className="sidebar-link-icon">▦</span>
                    Dashboard
                </button>

                <button
                    className="sidebar-link"
                    onClick={() => navigate("/reports")}
                >
                    <span className="sidebar-link-icon">◫</span>
                    Reports
                </button>

                <div className="sidebar-bottom">
                    <div className="sidebar-profile">
                        <div className="profile-avatar">
                            {(user?.name || "U").charAt(0).toUpperCase()}
                        </div>

                        <div className="profile-info">
                            <strong>{user?.name || "User"}</strong>
                            <small>Personal account</small>
                        </div>
                    </div>

                    <button
                        className="sidebar-logout"
                        onClick={handleLogout}
                    >
                        ↪ Logout
                    </button>
                </div>

            </aside>

            {/* Main Content */}
            <main className="dashboard-main">

                <button
    type="button"
    className="mobile-sidebar-toggle"
    onClick={() => setSidebarOpen((prev) => !prev)}
    aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
>
    {sidebarOpen ? "✕" : "☰"}
</button>

                {/* Topbar */}
                <header className="dashboard-topbar">

                    <div className="topbar-breadcrumb">
                        Workspace <span>/</span> Dashboard
                    </div>

                    <div className="topbar-right">
                        <span className="topbar-status">
                            <span className="status-dot"></span>
                            Tracker Active
                        </span>
                    </div>

                </header>

                {/* Welcome */}
                <section className="dashboard-welcome">

                    <div className="welcome-content">
                        <span className="welcome-tag">
                            YOUR HEALTH OVERVIEW
                        </span>

                        <h1>
                            Welcome back, {user?.name || "User"}
                        </h1>

                        <p>
                            Stay consistent. Your health journey matters.
                        </p>
                    </div>

                    <div className="welcome-actions">

                        <div className="welcome-date">
                            <span>Today</span>

                            <strong>
                                {new Date().toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                })}
                            </strong>
                        </div>

                        <button
    type="button"
    className="add-reading-button"
    onClick={() => handleAddReading("Morning (fasting)")}
>
    + Add Reading
</button>

                    </div>

                </section>

                {/* Messages */}
                {success && (
                    <div className="dashboard-success">
                        <span>✓</span> {success}
                    </div>
                )}

                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* Daily Monitoring */}
                <section className="tracking-section">

                    <div className="section-heading">

                        <div>
                            <span className="section-eyebrow">
                                DAILY MONITORING
                            </span>

                            <h2>Today's Sessions</h2>

                            <p>
                                Your four scheduled glucose check-ins.
                            </p>
                        </div>

                        <div className="tracking-summary">
                            <strong>{completedSlots}<span>/4</span></strong>
                            <small>Completed</small>
                        </div>

                    </div>

                    <div className="tracking-progress">
                        <div
                            className="tracking-progress-fill"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>

                    <div className="session-grid">

                        {timeSlots.map((slot, index) => {
                            const reading = todayReadings.find(
                                (item) => item.time_slot === slot
                            );

                            const isCompleted = Boolean(reading);

                            return (
                                <article
                                    key={slot}
                                    className={`session-card ${
                                        isCompleted ? "completed" : "pending"
                                    }`}
                                >

                                    <div className="session-card-header">

                                        <div className={`session-icon session-icon-${index}`}>
                                            {sessionIcons[index]}
                                        </div>

                                        <span className={`session-badge ${
                                            isCompleted ? "completed-badge" : "pending-badge"
                                        }`}>
                                            {isCompleted ? "Completed" : "Pending"}
                                        </span>

                                    </div>

                                    <div className="session-card-body">

                                        <span className="session-number">
                                            SESSION 0{index + 1}
                                        </span>

                                        <h3>{slot}</h3>

                                        <div className="session-value">
                                            {isCompleted ? (
                                                <>
                                                    <strong>{reading.glucose_value}</strong>
                                                    <span>mg/dL</span>
                                                </>
                                            ) : (
                                                <>
                                                    <strong className="empty-value">--</strong>
                                                    <span>mg/dL</span>
                                                </>
                                            )}
                                        </div>

                                    </div>

                                    <div className="session-card-footer">

                                        {isCompleted ? (
                                            <>
                                                <button
                                                    className="session-edit"
                                                    onClick={() => handleEditReading(reading)}
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="session-delete"
                                                    onClick={() => handleDeleteReading(reading.id)}
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                className="session-add"
                                                onClick={() => handleAddReading(slot)}
                                            >
                                                + Record Reading
                                            </button>
                                        )}

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                </section>

                {/* Report Summary */}
                <section className="report-section">

                    <div className="section-heading report-heading">

                        <div>
                            <span className="section-eyebrow">
                                ANALYTICS OVERVIEW
                            </span>

                            <h2>Glucose Report Summary</h2>

                            <p>
                                Compare your readings across different periods.
                            </p>
                        </div>

                        <button
                            className="view-report-button"
                            onClick={() => navigate("/reports")}
                        >
                            Detailed Reports →
                        </button>

                    </div>

                    <div className="report-table-wrapper">

                        <table className="report-table">

                            <thead>
                                <tr>
                                    <th>Report Period</th>
                                    <th>Total Readings</th>
                                    <th>Average</th>
                                    <th>Minimum</th>
                                    <th>Maximum</th>
                                </tr>
                            </thead>

                            <tbody>

                                <tr>
                                    <td>
                                        <div className="report-period">
                                            <span className="report-dot today-dot"></span>

                                            <div>
                                                <strong>Today</strong>
                                                <small>Daily summary</small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{dailyReport?.report?.total_readings ?? 0}</td>

                                    <td>
                                        {dailyReport?.report?.average_glucose ?? "--"}
                                        <small> mg/dL</small>
                                    </td>

                                    <td>{dailyReport?.report?.minimum_glucose ?? "--"}</td>

                                    <td>{dailyReport?.report?.maximum_glucose ?? "--"}</td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="report-period">
                                            <span className="report-dot month-dot"></span>

                                            <div>
                                                <strong>{getMonthName()}</strong>
                                                <small>Month to date</small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{mtdReport?.report?.total_readings ?? 0}</td>

                                    <td>
                                        {mtdReport?.report?.average_glucose ?? "--"}
                                        <small> mg/dL</small>
                                    </td>

                                    <td>{mtdReport?.report?.minimum_glucose ?? "--"}</td>

                                    <td>{mtdReport?.report?.maximum_glucose ?? "--"}</td>
                                </tr>

                                <tr>
                                    <td>
                                        <div className="report-period">
                                            <span className="report-dot previous-dot"></span>

                                            <div>
                                                <strong>{getPreviousMonthName()}</strong>
                                                <small>Previous month</small>
                                            </div>
                                        </div>
                                    </td>

                                    <td>{previousMonthReport?.report?.total_readings ?? 0}</td>

                                    <td>
                                        {previousMonthReport?.report?.average_glucose ?? "--"}
                                        <small> mg/dL</small>
                                    </td>

                                    <td>{previousMonthReport?.report?.minimum_glucose ?? "--"}</td>

                                    <td>{previousMonthReport?.report?.maximum_glucose ?? "--"}</td>
                                </tr>

                            </tbody>

                        </table>

                    </div>

                </section>

                {/* Reading History */}
                <section className="history-section">

                    <div className="section-heading history-heading">

                        <div>
                            <span className="section-eyebrow">
                                GLUCOSE RECORDS
                            </span>

                            <h2>Reading History</h2>

                            <p>
                                Manage and review your saved readings.
                            </p>
                        </div>

                        <div className="history-filter">

                            <label htmlFor="reading-date">
                                Date
                            </label>

                            <input
                                type="date"
                                id="reading-date"
                                value={selectedDate}
                                max={getLocalDate()}
                                onChange={(e) => handleDateFilter(e.target.value)}
                            />

                            {selectedDate && (
                                <button
                                    className="clear-filter"
                                    onClick={handleClearDateFilter}
                                >
                                    Clear
                                </button>
                            )}

                        </div>

                    </div>

                    <div className="history-table-wrapper">

                        <table className="history-table">

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
                                                {formatReadingDate(reading.reading_date)}
                                            </td>

                                            <td>{reading.time_slot}</td>

                                            <td>
                                                <span className="history-glucose">
                                                    {reading.glucose_value}
                                                    <small> mg/dL</small>
                                                </span>
                                            </td>

                                            <td>
                                                <span className="history-status">
                                                    <span></span>
                                                    Recorded
                                                </span>
                                            </td>

                                            <td>
                                                <div className="history-actions">

                                                    <button
                                                        className="history-edit"
                                                        onClick={() => handleEditReading(reading)}
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="history-delete"
                                                        onClick={() => handleDeleteReading(reading.id)}
                                                    >
                                                        Delete
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="empty-history">
                                            <div className="empty-history-content">
                                                <span>◷</span>
                                                <strong>No readings found</strong>
                                                <p>
                                                    Try another date or add a new reading.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* Pagination */}
                    <div className="history-pagination">

                        <span className="pagination-info">
                            Showing{" "}
                            {filteredReadings.length === 0
                                ? 0
                                : indexOfFirstReading + 1}
                            {" - "}
                            {Math.min(indexOfLastReading, filteredReadings.length)}
                            {" of "}
                            {filteredReadings.length} readings
                        </span>

                        <div className="pagination-controls">

                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                            >
                                ← Previous
                            </button>

                            <span>
                                {currentPage} / {totalPages}
                            </span>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                            >
                                Next →
                            </button>

                        </div>

                    </div>

                </section>

            </main>

            {/* Add / Edit Modal */}
            {showForm && (

                <div className="reading-modal-overlay">

                    <div className="reading-modal">

                        <div className="modal-header">

                            <div>
                                <span className="section-eyebrow">
                                    GLUCOSE TRACKER
                                </span>

                                <h2>
                                    {editingId
                                        ? "Edit Reading"
                                        : "Add New Reading"}
                                </h2>

                                <p>
                                    Enter your glucose measurement details.
                                </p>
                            </div>

                            <button
                                className="modal-close"
                                type="button"
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                ×
                            </button>

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div className="form-group">

                                <label htmlFor="reading_date">
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
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="time_slot">
                                    Time Slot
                                </label>

                                <select
                                    id="time_slot"
                                    name="time_slot"
                                    value={formData.time_slot}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {timeSlots.map((slot) => (
                                        <option key={slot} value={slot}>
                                            {slot}
                                        </option>
                                    ))}
                                </select>

                            </div>

                            <div className="form-group">

                                <label htmlFor="glucose_value">
                                    Glucose Value <span>(mg/dL)</span>
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
                                />

                                <small className="input-hint">
                                    Allowed range: 40–600 mg/dL
                                </small>

                            </div>

                            <div className="modal-actions">

                                <button
                                    type="button"
                                    className="modal-cancel"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="modal-submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Reading"
                                            : "Save Reading"}
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
