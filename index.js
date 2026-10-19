require("dotenv").config();

const { Pool } = require("pg");
const express = require("express");
const cors = require("cors");

const app = express();
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