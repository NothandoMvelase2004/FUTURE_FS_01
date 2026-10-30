const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const followUpRoutes = require("./routes/followUpRoutes");

dotenv.config();

const db = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(helmet());

app.use(cors({
    origin: "http://localhost:5173"
}));

app.use(express.urlencoded({
    extended: true
}));

const apiLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false

});

app.use("/api", apiLimiter);


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.json({

        message: "Welcome to ThandoLeads API",

        application: "Client Lead Management System",

        status: "Running",

        version: "1.0.0"

    });

});


// ==========================================
// DATABASE TEST ROUTE
// ==========================================

app.get("/api/test-db", async (req, res) => {

    try {

        const [rows] = await db.query("SELECT 1 AS connected");

        res.status(200).json({

            success: true,

            message: "MySQL Database Connected Successfully!",

            database: process.env.DB_NAME,

            result: rows[0]

        });

    } catch (error) {

        console.error("Database Test Error:", error.message);

        res.status(500).json({

            success: false,

            message: "Database connection failed"

        });

    }

});


// ==========================================
// API ROUTES
// ==========================================

// Authentication and lead routes will be
// Authentication routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

const leadRoutes = require("./routes/leadRoutes");
app.use("/api/leads", leadRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

app.use("/api/follow-ups", followUpRoutes);

// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Route not found"

    });

});

// GLOBAL ERROR HANDLER

app.use((err, req, res, next) => {

    console.error("Server Error:", err.message);

    res.status(500).json({

        success: false,

        message: "Internal server error"

    });

});


// START SERVER

app.listen(PORT, () => {

    console.log("==================================");

    console.log("🚀 THANDOLEADS SERVER STARTED");

    console.log(`🌐 Server: http://localhost:${PORT}`);

    console.log(`🗄️ Database: ${process.env.DB_NAME}`);

    console.log("==================================");

});


