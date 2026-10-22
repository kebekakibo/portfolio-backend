require("dotenv").config();

const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

app.use(express.json({ limit: "10kb" }));
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
    const cleanName = typeof name === "string" ? name.trim() : "";
const cleanEmail = typeof email === "string" ? email.trim() : "";
const cleanMessage = typeof message === "string" ? message.trim() : "";
// Ignore submissions that fill in the honeypot field.
if (typeof website === "string" && website.trim() !== "") {
    return res.status(200).json({
        message: "Your message was received successfully."
    });
}
    // Check that all fields were provided.
   if (!cleanName || !cleanEmail || !cleanMessage) {
        return res.status(400).json({
            error: "Name, email, and message are required."
        });
    }

    // Check reasonable length limits.
   if (
    cleanName.length > 100 ||
    cleanEmail.length > 255 ||
    cleanMessage.length > 5000
) {
        return res.status(400).json({
            error: "One or more fields are too long."
        });
    }

    // Basic email-format check.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
        return res.status(400).json({
            error: "Please enter a valid email address."
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO contacts (name, email, message)
             VALUES ($1, $2, $3)
             RETURNING id, created_at`,
                [cleanName, cleanEmail, cleanMessage]
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

app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            error: "Request body is too large. Please reduce the size of your message."
        });
    }

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON request body."
        });
    }

    console.error("Unexpected server error:", err.message);

    res.status(500).json({
        error: "Something went wrong on the server."
    });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});