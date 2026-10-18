
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "https://kebekakibo.github.io"
}));
app.get("/", (req, res) => {
    res.send("My portfolio backend is running!");
});

app.get("/api/projects", (req, res) => {
    res.json([
        {
            id: 1,
            icon: "📊",
            status: "PERSONAL PROJECT",
            name: "Trading Lot Size Calculator",
            description: "A forex risk-management tool that estimates position size based on account balance, risk percentage, and stop-loss distance.",
            tags: ["HTML", "CSS", "JavaScript"],
            actions: [
                {
                    text: "Demo Coming Soon",
                    href: "#projects",
                    className: "project-link primary",
                    ariaLabel: "Lot Size Calculator demo coming soon"
                },
                {
                    text: "View Code ↗",
                    href: "https://github.com/kebekakibo/lot-size-calculator",
                    className: "project-link secondary",
                    target: "_blank"
                }
            ]
        },
        {
            id: 2,
            icon: "✓",
            name: "To-Do List",
            description: "A simple task manager for organizing daily tasks and tracking completed work.",
            tags: ["HTML", "CSS", "JavaScript"],
            actions: [
                {
                    text: "View Project →",
                    href: "#contact",
                    className: "project-link"
                }
            ]
        },
        {
            id: 3,
            icon: "💻",
            name: "Personal Portfolio",
            description: "My personal website to introduce myself and showcase my web development projects.",
            tags: ["HTML", "CSS"],
            actions: [
                {
                    text: "View Project →",
                    href: "#home",
                    className: "project-link"
                }
            ]
        }
    ]);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});