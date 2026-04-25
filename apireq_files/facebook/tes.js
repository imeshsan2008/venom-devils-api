const express = require("express");
const FbScraper = require("./index"); // assuming default export

const app = express();
const PORT = 8000;

const fb = new FbScraper({
    retries: 3,
    timeout: 15000,
    creator: "Dark Venom",
});

// -------------------------
// API ROUTE
// -------------------------
app.get("/fb", async (req, res) => {
    const { url, cookie, useragent } = req.query;

    if (!url) {
        return res.status(400).json({
            status: "error",
            message: "Missing 'url' query parameter",
        });
    }

    try {
        const data = await fb.getFbVideoInfo(
            url,
            cookie || "",
            useragent || ""
        );

        return res.json(data);
    } catch (err) {
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
            error: err.message || err,
        });
    }
});

// -------------------------
// SERVER START
// -------------------------
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});