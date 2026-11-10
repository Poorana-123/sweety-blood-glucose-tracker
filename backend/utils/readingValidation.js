
const VALID_TIME_SLOTS = [
    "Morning (fasting)",
    "After breakfast",
    "After lunch",
    "After dinner"
];



const validateReading = (reading_date, time_slot, glucose_value) => {

    // Check required fields
    if (
        !reading_date ||
        !time_slot ||
        glucose_value === undefined ||
        glucose_value === null
    ) {
        return "All fields are required";
    }
    // Reject future reading dates
const today = new Date();

const todayString =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

if (reading_date > todayString) {
    return "Future reading dates are not allowed";
}

    // Validate date format and actual calendar date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reading_date)) {
        return "Date must be in YYYY-MM-DD format";
    }

    const [year, month, day] = reading_date.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "Invalid reading date";
    }

    // Validate time slot
    if (!VALID_TIME_SLOTS.includes(time_slot)) {
        return "Invalid time slot. Choose one of the four valid slots";
    }

    // Validate glucose value
    const glucose = Number(glucose_value);

    if (!Number.isInteger(glucose) || glucose < 40 || glucose > 600) {
        return "Glucose value must be an integer between 40 and 600";
    }

    return null;
};

module.exports = {
    validateReading,
    VALID_TIME_SLOTS
};
