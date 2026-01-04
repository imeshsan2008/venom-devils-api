
const axios = require("axios");
const creator = process.env.creator || "Dark Venom";
let thumbnail;
let username;
let comment;
let like;
let videourl;
let title;
exports.getInstagramVideoInfo = function (videoUrl, cookie, useragent) {
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
            authority: "www.instagram.com",
            "upgrade-insecure-requests": "1",
            "accept-language": "en-GB,en;q=0.9",
            "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "user-agent": useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            cookie: cookie || "your_default_cookie_here",
        };



const formatText = (rawString) => {
    // Normalize double-escaped slashes
    let text = rawString.replace(/\\\\/g, "\\");

    // Fix invalid escape sequences
    text = text.replace(/\\(?!["\\/bfnrtu])/g, "");

    // Decode valid unicode
    text = text.replace(/\\u([0-9A-Fa-f]{4})/g, (match, grp) =>
        String.fromCharCode(parseInt(grp, 16))
    );

    // Clean text
    text = text
        .replace(/\\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .replace('&#064;', "@")
        .replace("\\'", "")
        .trim();

    text = text.replace(/\\\//g, "/");

    return text;
};






        function toMSS(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }


        axios
            .get(videoUrl, { headers })
            .then(({ data }) => {
                data = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

                // Decode Unicode escapes
                let cleaned = data
                    .replace(/\\u003C/g, "<")
                    .replace(/\\u003E/g, ">")
                    .replace(/\\\\\//g, "/")
                    .replace(/\\\//g, "/")
                    .replace(/\\u([\dA-Fa-f]{4})/g, (_, g) => String.fromCharCode(parseInt(g, 16)))
                    .replace(/\\"/g, '"');

                const durationMatch = cleaned.match(/<Period[^>]*duration="PT([\d.]+)S"/);
                const likeMatch = data.match(/"like_count":(\d+)/);
                const commentMatch = data.match(/"comment_count":(\d+)/);
                const titleMatch = data.match(/"caption":{"text":"(.*?)"/);
                const videourlMatch = cleaned.match(/<BaseURL>(.*?)<\/BaseURL>/);
                const thumbMatch = data.match(/"height":960[^}]*"url":"([^"]*)"/) || data.match(/"height":2000[^}]*"url":"([^"]*)"/) || data.match(/"height":1136[^}]*"url":"([^"]*)"/) || data.match(/"image_versions2":\{"candidates":\[\{"height":960,"url":"([^"]*)"/)|| data.match(/"image_versions2":\{"candidates":\[\{"height":360,"url":"([^"]*)"/) || data.match(/"image_versions2":\{"candidates":\[\{"url":"([^"]*)"/);
                const usernameMatch = data.match(/<meta\sname="twitter:title"\scontent="(.*?)"/);
                const rawTitle = titleMatch ? titleMatch[1] : "No Title";

console.log(likeMatch[1]);

                thumbnail = thumbMatch[1].replace(/\\\//g, '/');
                username = usernameMatch ? (usernameMatch[1].split("(")[1] || "").split(")")[0].trim() : null;
                like = likeMatch ? likeMatch[1] : null;
                comment = commentMatch ? commentMatch[1] : null;
                duration = toMSS(durationMatch[1]);
                videourl = videourlMatch ? videourlMatch[1] : null;
                username = formatText(username || "Unknown");
                title = formatText(rawTitle);

                return resolve({
                    status: "success",
                    creator: creator,
                    title: title,
                    username: username,
                    duration: duration ? duration : "Unknown",
                    likes: likeMatch[1],
                    comments: commentMatch[1],
                    thumbnail: thumbnail,
                    video: 'https://venom-devils-api.koyeb.app/download/mp4?url='+encodeURIComponent(videourl),

                });

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


