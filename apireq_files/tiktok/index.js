

const axios = require("axios");
const creator = "imeshsan2008";
const { decode } = require("html-entities");
module.exports = getFbVideoInfo = async (videoUrl, cookie, useragent) => {
    return new Promise((resolve, reject) => {
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
            cookie: cookie || "sb=Rn8BYQvCEb2fpMQZjsd6L382; datr=Rn8BYbyhXgw9RlOvmsosmVNT; c_user=100003164630629; _fbp=fb.1.1629876126997.444699739; wd=1920x939; spin=r.1004812505_b.trunk_t.1638730393_s.1_v.2_; xs=28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8; fr=0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw",
        };

		const parseString = (string) => decode(string);

        const formatTitle = (rawString) => {
            return rawString
                .replace(/#/g, "") // Remove all hashtags
                .replace(/\n/g, " ") // Replace line breaks with spaces
                .replace(/\s+/g, " ") // Remove extra spaces
                .trim(); // Trim leading and trailing spaces
        };
       
        axios
            .get(videoUrl, { headers })
            .then(({ data }) => {
                data = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
                
                const sdMatch = data.match(/"browser_native_sd_url":"(.*?)"/) || 
                                data.match(/"playable_url":"(.*?)"/) || 
                                data.match(/sd_src\s*:\s*"([^"]*)"/);
                const hdMatch = data.match(/"browser_native_hd_url":"(.*?)"/) || 
                                data.match(/"playable_url_quality_hd":"(.*?)"/) || 
                                data.match(/hd_src\s*:\s*"([^"]*)"/);

                let titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/) || 
                                 data.match(/<meta\sproperty="og:title"\scontent="(.*?)"/) || 
                                 data.match(/"message":{"text":"(.*?)"/);

                let title = titleMatch && titleMatch[1] ? parseString(titleMatch[1]) : "No title available";

                const formattedTitle = formatTitle(title);
                title = formattedTitle;
                
                if (title.toLowerCase().includes("facebook")) {
                    title = "No title available";
                }

                const thumbMatch = data.match(/"preferred_thumbnail":{"image":{"uri":"(.*?)"/);
                const durationMatch = data.match(/"playable_duration_in_ms":(\d+)/);

                let durationMs = durationMatch ? parseInt(durationMatch[1]) : null;
                durationMinutes =   (durationMs / 60000).toFixed(2);

                if (sdMatch && sdMatch[1]) {
                    resolve({
                        status: "success",
                        creator: creator,
                        title: title,
                        duration_minutes: durationMinutes || 0,
                        thumbnail: thumbMatch && thumbMatch[1] ? parseString(thumbMatch[1]) : "",
                        sd: parseString(sdMatch[1]),
                        hd: hdMatch && hdMatch[1] ? parseString(hdMatch[1]) : "",
                    });
                } else {
                    reject({
                        status: "error",
                        message: "Unable to fetch video information. Please try again.",
                    });
                }
            })
            .catch((err) => {
                const errorResponse = {
                    status: "error",
                    message: "Unable to fetch video information. Please try again.",
                    error: err.message || "Unknown error",
                };
                console.log(err);
                reject(errorResponse);
            });
    });
};