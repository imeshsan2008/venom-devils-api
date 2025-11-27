
const info = await getTiktokVideoInfo(tiktokLink);


async function downloadTikTok(url, file) {
    const headers = {
        "user-agent": 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "referer": "https://www.tiktok.com/",
        "accept": "*/*"
    };

    const response = await axios.get(url, {
        headers,
        responseType: "arraybuffer" // IMPORTANT
    });

    fs.writeFileSync(file, response.data);
    return file;
}
await downloadTikTok(info.hd || info.sd, "video.mp4");
