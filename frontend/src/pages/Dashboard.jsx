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

    // Fetch dashboard data from backend
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError("");

            // Get today's local date
            const today = new Date();

            const localDate = [
                today.getFullYear(),
                String(today.getMonth() + 1).padStart(2, "0"),
                String(today.getDate()).padStart(2, "0")
            ].join("-");

            // Fetch all dashboard APIs
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

            // Store readings
            setReadings(
                readingsResponse.data.readings ||
                readingsResponse.data
            );

            // Store reports
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
            setLoading(false);
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

        date.setMonth(date.getMonth() - 1);

        return date.toLocaleString("en-IN", {
            month: "long"
        });
    };

    // Report card component
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
                        onClick={() => navigate("/readings")}
                    >
                        + Add Reading
                    </button>

                </section>

                {/* Error Message */}
                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

                {/* Today's Report */}
                <section className="report-section">

                    <h2>
                        Today's Report
                    </h2>

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

                {/* Recent Readings Table */}
                <section className="readings-section">

                    <div className="readings-heading">

                        <h2>
                            Recent Glucose Readings
                        </h2>

                        <button
                            onClick={() => navigate("/readings")}
                        >
                            View All
                        </button>

                    </div>

                    <div className="table-wrapper">

                        <table>

                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time Slot</th>
                                    <th>Glucose Value</th>
                                </tr>
                            </thead>

                            <tbody>

                                {readings.length > 0 ? (

                                    readings.slice(0, 5).map((reading) => (

                                        <tr key={reading.id}>

                                            <td>
                                                {String(
                                                    reading.reading_date
                                                ).slice(0, 10)}
                                            </td>

                                            <td>
                                                {reading.time_slot}
                                            </td>

                                            <td>
                                                {reading.glucose_value} mg/dL
                                            </td>

                                        </tr>

                                    ))

                                ) : (

                                    <tr>
                                        <td colSpan="3">
                                            No glucose readings found.
                                        </td>
                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

            </main>

        </div>
    );
}

export default Dashboard;