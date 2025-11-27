const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

app.get("/download", async (req, res) => {
    const url = "https://www.tiktok.com/aweme/v1/play/?faid=1988&file_id=bd3bf7f07f54472b89a5d20328e2ec49&is_play_url=1&item_id=7452476231724911879&line=0&ply_type=2&signaturev3=dmlkZW9faWQ7ZmlsZV9pZDtpdGVtX2lkLjljOTc0ZWEyOGU5MGMzY2FjOGNmMjRiMzYyM2EyZjJj&tk=tt_chain_token&urlt=1&video_id=v14044g50000ctm86p7og65oi48hqn80";
    
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
                "referer": "https://www.tiktok.com/"
            }
        });

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Content-Disposition", "attachment; filename=tiktok_video.mp4");
        res.send(response.data);

    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to download video");
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
