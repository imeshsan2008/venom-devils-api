const express = require("express");
const { getFbVideoInfo } = require("./index");

const app = express();
const PORT = process.env.PORT || 8000;

// -------------------------
// MIDDLEWARE (optional but useful)
// -------------------------
app.use(express.json());

// -------------------------
// BASIC URL VALIDATOR
// -------------------------
function isValidUrl(url) {
    try {
        return Boolean(new URL(url));
    } catch {
        return false;
    }
}

// -------------------------
// API ROUTE
// -------------------------
app.get("/fb", async (req, res) => {
    const { url, cookie, useragent } = req.query;

    // Validate URL
    if (!url) {
        return res.status(400).json({
            status: "error",
            message: "Missing 'url' query parameter",
        });
    }

    if (!isValidUrl(url)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid URL format",
        });
    }

    try {
        const data = await getFbVideoInfo(
            url,
            cookie || "",
            useragent || ""
        );

        return res.status(200).json({
            ...data,
            api: "fb-video-extractor",
            timestamp: Date.now(),
        });

    } catch (err) {
        console.error("FB API ERROR:", err);

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: err?.message || "Unknown error",
        });
    }
});

// -------------------------
// HEALTH CHECK ROUTE
// -------------------------
app.get("/", (req, res) => {
    res.json({
        status: "running",
        service: "Facebook Video API",
        endpoint: "/fb?url=",
    });
});

// -------------------------
// SERVER START
// -------------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});