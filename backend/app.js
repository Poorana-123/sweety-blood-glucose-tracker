const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Keep your existing routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/readings", require("./routes/readingsRoutes"));

module.exports = app;