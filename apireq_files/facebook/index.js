
const axios = require("axios");
const creator = process.env.creator || "Dark Venom";
const { decode } = require("html-entities");

exports.getFbVideoInfo = function (videoUrl, cookie, useragent) {
    return new Promise((resolve, reject) => {
        if (!videoUrl || !videoUrl.startsWith("http")) {
            return reject({
                status: "error",
                message: "Invalid video URL. Please provide a valid URL.",
            });
        }

        const headers = {
            "sec-fetch-user": "?1",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-site": "none",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "cache-control": "max-age=0",
            authority: "www.facebook.com",
            "upgrade-insecure-requests": "1",
            "accept-language": "en-GB,en;q=0.9",
            "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "user-agent": useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            cookie: cookie || "your_default_cookie_here",
        };

        const parseString = (string) => decode(string);


      const formatTitle = (rawString) => {
    // Step 1: Replace double backslashes with single ones
    const unicodeString = rawString.replace(/\\\\/g, "\\");
    
    // Step 2: Decode Unicode sequences
    const decoded = JSON.parse(`"${unicodeString}"`);

    // Step 3: Clean up extra spaces and line breaks
    return decoded
        .replace(/\n/g, " ") // Replace line breaks with spaces
        .replace(/\s+/g, " ") // Remove extra spaces
        .trim();              // Trim leading and trailing spaces
};


        const formatDuration = (ms) => {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${minutes}:${seconds.padStart(2, "0")}`;
        };

        axios
            .get(videoUrl, { headers })
            .then(({ data }) => {
                data = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

// Replace all escaped slashes with normal slashes

const sdMatch = data.match(/"browser_native_sd_url":"(.*?)"/) || 
                data.match(/"playable_url":"(.*?)"/) || 
                                data.match(/base_url\s*:\s*"([^"]*)"/)||

                data.match(/sd_src\s*:\s*"([^"]*)"/);
let sdfinallink;
let hdfinallink;
let thumbfinallink;

  const hdMatch = data.match(/"browser_native_hd_url":"(.*?)"/) || 
                                data.match(/"playable_url_quality_hd":"(.*?)"/) || 
                                data.match(/hd_src\s*:\s*"([^"]*)"/);
                const thumbMatch = data.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);


if (sdMatch && hdMatch && thumbMatch) {
    hdfinallink = hdMatch[1].replace(/\\\//g, '/');
        sdfinallink = hdMatch[1].replace(/\\\//g, '/');
        thumbfinallink = thumbMatch[1].replace(/\\\//g, '/');

    
} else {
    console.error("No match found for SD URL.");
}

                              
                const titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/) || 
                                   data.match(/<meta\sproperty="og:title"\scontent="(.*?)"/) || 
                                   data.match(/"message":{"text":"(.*?)"/);

                const durationMatch = data.match(/"playable_duration_in_ms":(\d+)/);

                const title = titleMatch && titleMatch[1] ? formatTitle(parseString(titleMatch[1])) : "No title available";
                const durationMs = durationMatch ? parseInt(durationMatch[1]) : null;

                if (sdMatch && sdMatch[1]) {
                    resolve({
                        status: "success",
                        creator: creator,
                        title: title,
                        duration: durationMs ? formatDuration(durationMs) : "Unknown",
                        thumbnail: thumbfinallink,
                        sd: 'https://venom-devils-api.koyeb.app/download/mp4?url='+encodeURIComponent(sdfinallink) +'&web=fb' ,
                        hd: 'https://venom-devils-api.koyeb.app/download/mp4?url='+encodeURIComponent(hdfinallink) +'&web=fb'
                    });
                } else {
                    reject({
                        status: "error",
                        message: "Unable to fetch video information. Please try again.",
                    });
                }
            })
            .catch((err) => {
                console.error(err);
                reject({
                    status: "error",
                    message: "Unable to fetch video information. Please try again.",
                    error: err.message || "Unknown error",
                });
            });
    });
};
