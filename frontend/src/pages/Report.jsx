import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "../styles/Report.css";

function Report() {
    const [readings, setReadings] = useState([]);

    const [reportType, setReportType] = useState("date");

    const [selectedDate, setSelectedDate] = useState(
        getLocalDate()
    );

    const [selectedMonth, setSelectedMonth] = useState(
        getLocalMonth()
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Get local date
    function getLocalDate() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // Get local month
    function getLocalMonth() {
        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");

        return `${year}-${month}`;
    }

    // Normalize PostgreSQL DATE
    const formatDate = (dateValue) => {
        if (!dateValue) return "";

        return String(dateValue).slice(0, 10);
    };

    // Fetch all readings
    const fetchReadings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get("/readings");

            setReadings(response.data.readings || []);

        } catch (error) {
            console.error("Report loading error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load reports"
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReadings();
    }, []);

    // Get previous month
    const getPreviousMonth = (monthValue) => {
        const [year, month] = monthValue.split("-").map(Number);

        const previousMonthDate = new Date(
            year,
            month - 2,
            1
        );

        const previousYear = previousMonthDate.getFullYear();

        const previousMonth = String(
            previousMonthDate.getMonth() + 1
        ).padStart(2, "0");

        return `${previousYear}-${previousMonth}`;
    };

    // Filter readings based on report type
    const filteredReadings = useMemo(() => {
        if (reportType === "date") {
            return readings.filter(
                (reading) =>
                    formatDate(reading.reading_date) === selectedDate
            );
        }

        if (reportType === "month") {
            return readings.filter(
                (reading) =>
                    formatDate(reading.reading_date).slice(0, 7) ===
                    selectedMonth
            );
        }

        if (reportType === "previousMonth") {
            const previousMonth = getPreviousMonth(selectedMonth);

            return readings.filter(
                (reading) =>
                    formatDate(reading.reading_date).slice(0, 7) ===
                    previousMonth
            );
        }

        return [];
    }, [
        readings,
        reportType,
        selectedDate,
        selectedMonth
    ]);

    // Generate report table data
    const reportData = useMemo(() => {

        if (reportType === "date") {
            return filteredReadings
                .sort((a, b) =>
                    a.time_slot.localeCompare(b.time_slot)
                )
                .map((reading) => ({
                    date: formatDate(reading.reading_date),
                    timeSlot: reading.time_slot,
                    glucose: Number(reading.glucose_value),
                    average: Number(reading.glucose_value)
                }));
        }

        // Group readings by date
        const groupedData = {};

        filteredReadings.forEach((reading) => {
            const date = formatDate(reading.reading_date);

            if (!groupedData[date]) {
                groupedData[date] = [];
            }

            groupedData[date].push(
                Number(reading.glucose_value)
            );
        });

        return Object.keys(groupedData)
            .sort()
            .map((date) => {
                const values = groupedData[date];

                const average =
                    values.reduce((sum, value) => sum + value, 0) /
                    values.length;

                return {
                    date,
                    timeSlot: "Daily Average",
                    glucose: Math.round(average),
                    average: Math.round(average),
                    totalReadings: values.length,
                    minimum: Math.min(...values),
                    maximum: Math.max(...values)
                };
            });

    }, [filteredReadings, reportType]);

    // Calculate report statistics
    const totalReadings = filteredReadings.length;

    const averageGlucose =
        totalReadings > 0
            ? Math.round(
                filteredReadings.reduce(
                    (sum, reading) =>
                        sum + Number(reading.glucose_value),
                    0
                ) / totalReadings
            )
            : 0;

    const minimumGlucose =
        totalReadings > 0
            ? Math.min(
                ...filteredReadings.map(
                    (reading) => Number(reading.glucose_value)
                )
            )
            : 0;

    const maximumGlucose =
        totalReadings > 0
            ? Math.max(
                ...filteredReadings.map(
                    (reading) => Number(reading.glucose_value)
                )
            )
            : 0;

    // Download PDF
    const downloadPDF = () => {
        const doc = new jsPDF();

        let reportTitle = "Date-wise Glucose Report";

        if (reportType === "month") {
            reportTitle = "Month-wise Glucose Report";
        }

        if (reportType === "previousMonth") {
            reportTitle = "Previous Month Glucose Report";
        }

        doc.setFontSize(20);

        doc.setTextColor(13, 148, 136);

        doc.text("Sweety Blood Glucose Tracker", 14, 20);

        doc.setFontSize(15);

        doc.setTextColor(40, 40, 40);

        doc.text(reportTitle, 14, 32);

        doc.setFontSize(10);

        doc.text(
            `Generated Date: ${getLocalDate()}`,
            14,
            40
        );

        doc.text(
            `Total Readings: ${totalReadings}`,
            14,
            47
        );

        doc.text(
            `Average Glucose: ${averageGlucose} mg/dL`,
            14,
            54
        );

        doc.text(
            `Minimum: ${minimumGlucose} mg/dL`,
            14,
            61
        );

        doc.text(
            `Maximum: ${maximumGlucose} mg/dL`,
            14,
            68
        );

        let tableHead = [];

        let tableBody = [];

        if (reportType === "date") {
            tableHead = [
                ["Date", "Time Slot", "Glucose Value (mg/dL)"]
            ];

            tableBody = reportData.map((item) => [
                item.date,
                item.timeSlot,
                item.glucose
            ]);

        } else {
            tableHead = [
                [
                    "Date",
                    "Total Readings",
                    "Average (mg/dL)",
                    "Minimum",
                    "Maximum"
                ]
            ];

            tableBody = reportData.map((item) => [
                item.date,
                item.totalReadings,
                item.average,
                item.minimum,
                item.maximum
            ]);
        }

        autoTable(doc, {
            startY: 78,
            head: tableHead,
            body: tableBody,

            theme: "grid",

            headStyles: {
                fillColor: [13, 148, 136],
                textColor: 255
            },

            alternateRowStyles: {
                fillColor: [240, 253, 250]
            },

            styles: {
                fontSize: 9,
                cellPadding: 4
            }
        });

        doc.save(
            `glucose-report-${reportType}-${getLocalDate()}.pdf`
        );
    };

    return (
        <div className="report-page">

            {/* Header */}
            <div className="report-header">

                <div>
                    <span className="report-subtitle">
                        HEALTH ANALYTICS
                    </span>

                    <h1>Glucose Reports</h1>

                    <p>
                        Analyze and download your glucose tracking history.
                    </p>
                </div>

                <button
                    className="report-download-btn"
                    onClick={downloadPDF}
                    disabled={reportData.length === 0}
                >
                    ↓ Download PDF
                </button>

            </div>

            {/* Report Type Selection */}
            <div className="report-tabs">

                <button
                    className={
                        reportType === "date"
                            ? "report-tab active"
                            : "report-tab"
                    }
                    onClick={() => setReportType("date")}
                >
                    Date-wise
                </button>

                <button
                    className={
                        reportType === "month"
                            ? "report-tab active"
                            : "report-tab"
                    }
                    onClick={() => setReportType("month")}
                >
                    Month-wise
                </button>

                <button
                    className={
                        reportType === "previousMonth"
                            ? "report-tab active"
                            : "report-tab"
                    }
                    onClick={() => setReportType("previousMonth")}
                >
                    Previous Month
                </button>

            </div>

            {/* Filters */}
            <div className="report-filter-card">

                {reportType === "date" && (

                    <div className="report-filter-item">

                        <label>Select Date</label>

                        <input
                            type="date"
                            value={selectedDate}
                            max={getLocalDate()}
                            onChange={(e) =>
                                setSelectedDate(e.target.value)
                            }
                        />

                    </div>

                )}

                {reportType !== "date" && (

                    <div className="report-filter-item">

                        <label>
                            {reportType === "month"
                                ? "Select Month"
                                : "Select Month (to view its previous month)"}
                        </label>

                        <input
                            type="month"
                            value={selectedMonth}
                            max={getLocalMonth()}
                            onChange={(e) =>
                                setSelectedMonth(e.target.value)
                            }
                        />

                        {reportType === "previousMonth" && (
                            <span className="previous-month-note">
                                Showing: {getPreviousMonth(selectedMonth)}
                            </span>
                        )}

                    </div>

                )}

            </div>

            {/* Loading */}
            {loading && (
                <div className="report-loading">
                    Loading glucose reports...
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="report-error">
                    {error}
                </div>
            )}

            {!loading && !error && (

                <>
                    {/* Summary Cards */}
                    <div className="report-summary-grid">

                        <div className="report-summary-card">
                            <span>Total Readings</span>
                            <h2>{totalReadings}</h2>
                            <small>Recorded entries</small>
                        </div>

                        <div className="report-summary-card">
                            <span>Average Glucose</span>
                            <h2>{averageGlucose}</h2>
                            <small>mg/dL</small>
                        </div>

                        <div className="report-summary-card">
                            <span>Minimum Glucose</span>
                            <h2>{minimumGlucose}</h2>
                            <small>mg/dL</small>
                        </div>

                        <div className="report-summary-card">
                            <span>Maximum Glucose</span>
                            <h2>{maximumGlucose}</h2>
                            <small>mg/dL</small>
                        </div>

                    </div>

                    
{/* Graph */}
<div className="report-chart-card">

    <div className="report-section-heading">
        <div>
            <h2>
                {reportType === "date"
                    ? "Daily Glucose Overview"
                    : reportType === "month"
                        ? "Monthly Glucose Overview"
                        : "Previous Month Glucose Trend"}
            </h2>

            <p>
                {reportType === "date"
                    ? "Track glucose changes throughout the day."
                    : reportType === "month"
                        ? "Compare daily average glucose values."
                        : "Review your previous month's glucose patterns."}
            </p>
        </div>

        <span className="report-chart-badge">
            {reportType === "date"
                ? "Daily"
                : reportType === "month"
                    ? "Monthly"
                    : "History"}
        </span>
    </div>

    {reportData.length > 0 ? (

        <ResponsiveContainer width="100%" height={350}>

            {reportType === "date" ? (

                /* DATE-WISE AREA CHART */

                <AreaChart
                    data={reportData}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 10,
                        bottom: 10
                    }}
                >

                    <defs>
                        <linearGradient
                            id="glucoseAreaGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#0d9488"
                                stopOpacity={0.35}
                            />

                            <stop
                                offset="95%"
                                stopColor="#99f6e4"
                                stopOpacity={0.03}
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e8eef3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="timeSlot"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            boxShadow: "0 8px 25px rgba(15,23,42,0.08)"
                        }}
                        formatter={(value) => [
                            `${value} mg/dL`,
                            "Glucose"
                        ]}
                    />

                    <Area
                        type="monotone"
                        dataKey="glucose"
                        stroke="#0d9488"
                        strokeWidth={3}
                        fill="url(#glucoseAreaGradient)"
                        dot={{
                            r: 5,
                            fill: "#0d9488",
                            stroke: "#ffffff",
                            strokeWidth: 2
                        }}
                        activeDot={{
                            r: 8,
                            fill: "#0f766e",
                            stroke: "#ffffff",
                            strokeWidth: 3
                        }}
                        animationDuration={1000}
                    />

                </AreaChart>

            ) : reportType === "month" ? (

                /* MONTH-WISE BAR CHART */

                <BarChart
                    data={reportData}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 10,
                        bottom: 10
                    }}
                >

                    <defs>
                        <linearGradient
                            id="glucoseBarGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#14b8a6"
                            />

                            <stop
                                offset="100%"
                                stopColor="#0f766e"
                            />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e8eef3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        cursor={{ fill: "#f0fdfa" }}
                        contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            boxShadow: "0 8px 25px rgba(15,23,42,0.08)"
                        }}
                        formatter={(value) => [
                            `${value} mg/dL`,
                            "Daily Average"
                        ]}
                    />

                    <Bar
                        dataKey="average"
                        name="Daily Average"
                        fill="url(#glucoseBarGradient)"
                        radius={[8, 8, 0, 0]}
                        maxBarSize={45}
                        animationDuration={1000}
                    />

                </BarChart>

            ) : (

                /* PREVIOUS MONTH LINE CHART */

                <LineChart
                    data={reportData}
                    margin={{
                        top: 20,
                        right: 20,
                        left: 10,
                        bottom: 10
                    }}
                >

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e8eef3"
                        vertical={false}
                    />

                    <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <YAxis
                        domain={["auto", "auto"]}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        contentStyle={{
                            background: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            boxShadow: "0 8px 25px rgba(15,23,42,0.08)"
                        }}
                        formatter={(value) => [
                            `${value} mg/dL`,
                            "Daily Average"
                        ]}
                    />

                    <Legend />

                    <Line
                        type="monotone"
                        dataKey="average"
                        name="Daily Average"
                        stroke="#6366f1"
                        strokeWidth={3}
                        dot={{
                            r: 4,
                            fill: "#6366f1",
                            stroke: "#ffffff",
                            strokeWidth: 2
                        }}
                        activeDot={{
                            r: 8,
                            fill: "#4f46e5",
                            stroke: "#ffffff",
                            strokeWidth: 3
                        }}
                        animationDuration={1000}
                    />

                </LineChart>

            )}

        </ResponsiveContainer>

    ) : (

        <div className="report-empty">
            No readings available for this report.
        </div>

    )}

</div>


                    {/* Report Table */}
                    <div className="report-table-card">

                        <div className="report-section-heading">
                            <div>
                                <h2>Report Details</h2>

                                <p>
                                    Detailed glucose reading summary.
                                </p>
                            </div>
                        </div>

                        <div className="report-table-wrapper">

                            <table className="report-table">

                                <thead>

                                    {reportType === "date" ? (

                                        <tr>
                                            <th>Date</th>
                                            <th>Time Slot</th>
                                            <th>Glucose Value</th>
                                        </tr>

                                    ) : (

                                        <tr>
                                            <th>Date</th>
                                            <th>Total Readings</th>
                                            <th>Average</th>
                                            <th>Minimum</th>
                                            <th>Maximum</th>
                                        </tr>

                                    )}

                                </thead>

                                <tbody>

                                    {reportData.length > 0 ? (

                                        reportData.map((item, index) => (

                                            <tr key={`${item.date}-${index}`}>

                                                <td>{item.date}</td>

                                                {reportType === "date" ? (

                                                    <>
                                                        <td>
                                                            {item.timeSlot}
                                                        </td>

                                                        <td>
                                                            <span className="report-glucose-value">
                                                                {item.glucose} mg/dL
                                                            </span>
                                                        </td>
                                                    </>

                                                ) : (

                                                    <>
                                                        <td>
                                                            {item.totalReadings}
                                                        </td>

                                                        <td>
                                                            <span className="report-glucose-value">
                                                                {item.average} mg/dL
                                                            </span>
                                                        </td>

                                                        <td>
                                                            {item.minimum} mg/dL
                                                        </td>

                                                        <td>
                                                            {item.maximum} mg/dL
                                                        </td>
                                                    </>

                                                )}

                                            </tr>

                                        ))

                                    ) : (

                                        <tr>
                                            <td
                                                colSpan={
                                                    reportType === "date"
                                                        ? 3
                                                        : 5
                                                }
                                                className="report-empty"
                                            >
                                                No report data found.
                                            </td>
                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

        </div>
    );
}

export default Report;