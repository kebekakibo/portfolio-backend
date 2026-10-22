require("dotenv").config();

const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

app.use(express.json());
const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: "Too many messages. Please try again in 15 minutes."
    }
});

app.get("/api/health/config", (req, res) => {
    res.json({
        databaseUrlExists: Boolean(process.env.DATABASE_URL),
        databaseHostConfigured: Boolean(
            process.env.DATABASE_URL &&
            !process.env.DATABASE_URL.includes("localhost") &&
            !process.env.DATABASE_URL.includes("127.0.0.1")
        )
    });
});
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
app.use(cors({
    origin: [
        "https://kebekakibo.github.io",
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
}));
app.get("/", (req, res) => {
    res.send("My portfolio backend is running!");
});
app.get("/api/health/db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            connected: true,
            databaseTime: result.rows[0].now
        });
    } catch (error) {
        console.error("Database connection failed:", error);

        res.status(500).json({
            connected: false,
            message: "Database connection failed"
        });
    }
});

app.post("/api/contacts", contactLimiter, async (req, res) => {
    const { name, email, message, website } = req.body;
// Ignore submissions that fill in the honeypot field.
if (typeof website === "string" && website.trim() !== "") {
    return res.status(200).json({
        message: "Your message was received successfully."
    });
}
    // Check that all fields were provided.
    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof message !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "Name, email, and message are required."
        });
    }

    // Check reasonable length limits.
    if (
        name.trim().length > 100 ||
        email.trim().length > 255 ||
        message.trim().length > 5000
    ) {
        return res.status(400).json({
            error: "One or more fields are too long."
        });
    }

    // Basic email-format check.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
            error: "Please enter a valid email address."
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO contacts (name, email, message)
             VALUES ($1, $2, $3)
             RETURNING id, created_at`,
            [name.trim(), email.trim(), message.trim()]
        );

        res.status(201).json({
            message: "Your message was received successfully.",
            contactId: result.rows[0].id,
            receivedAt: result.rows[0].created_at
        });
    } catch (error) {
        console.error("Failed to save contact message:", error.message);

        res.status(500).json({
            error: "Unable to send your message right now."
        });
    }
});


app.get("/api/projects", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, icon, status, name, description, tags, actions FROM projects ORDER BY id"
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Failed to fetch projects:", error.message);

        res.status(500).json({
            error: "Failed to load projects"
        });
    }
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});