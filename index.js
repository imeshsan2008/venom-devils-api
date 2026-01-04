
const axios = require("axios");
const creator = "VENOM DEVIL";
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
            authority: "www.instargram.com",
            "upgrade-insecure-requests": "1",
            "accept-language": "en-GB,en;q=0.9",
            "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "user-agent": useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            cookie: cookie || "your_default_cookie_here",
        };

        const parseString = (string) => decode(string);

        const formatTitle = (rawString) => {
            return rawString
                .replace(/#/g, "") // Remove all hashtags
                .replace(/\n/g, " ") // Replace line breaks with spaces
                .replace(/\s+/g, " ") // Remove extra spaces
                .trim(); // Trim leading and trailing spaces
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

                              
                const titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/);

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
                        sd: sdfinallink,
                        hd: hdfinallink
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



exports.getTiktokVideoInfo = function (videoUrl, cookie, useragent) {
    return new Promise((resolve, reject) => {
        const headers = {
            "sec-fetch-user": "?1",
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-site": "none",
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "cache-control": "max-age=0",
            authority: "www.tiktok.com",
            "upgrade-insecure-requests": "1",
            "accept-language": "en-GB,en;q=0.9",
            "sec-ch-ua": '"Google Chrome";v="89", "Chromium";v="89", ";Not A Brand";v="99"',
            "user-agent": useragent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            cookie: cookie || "sb=Rn8BYQvCEb2fpMQZjsd6L382; datr=Rn8BYbyhXgw9RlOvmsosmVNT; c_user=100003164630629; _fbp=fb.1.1629876126997.444699739; wd=1920x939; spin=r.1004812505_b.trunk_t.1638730393_s.1_v.2_; xs=28%3A8ROnP0aeVF8XcQ%3A2%3A1627488145%3A-1%3A4916%3A%3AAcWIuSjPy2mlTPuZAeA2wWzHzEDuumXI89jH8a_QIV8; fr=0jQw7hcrFdas2ZeyT.AWVpRNl_4noCEs_hb8kaZahs-jA.BhrQqa.3E.AAA.0.0.BhrQqa.AWUu879ZtCw",
        };

       
        axios
            .get(videoUrl, { headers })
            .then(({ data }) => {
                // data = data.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
                
                // const sdMatch = data.match(/"browser_native_sd_url":"(.*?)"/) || 
                //                 data.match(/"playable_url":"(.*?)"/) || 
                //                 data.match(/sd_src\s*:\s*"([^"]*)"/);
                // const hdMatch = data.match(/"browser_native_hd_url":"(.*?)"/) || 
                //                 data.match(/"playable_url_quality_hd":"(.*?)"/) || 
                //                 data.match(/hd_src\s*:\s*"([^"]*)"/);

                // let titleMatch = data.match(/<meta\sname="description"\scontent="(.*?)"/) || 
                //                  data.match(/<meta\sproperty="og:title"\scontent="(.*?)"/) || 
                //                  data.match(/"message":{"text":"(.*?)"/);

                // let title = titleMatch && titleMatch[1] ? parseString(titleMatch[1]) : "No title available";

                // const formattedTitle = formatTitle(title);
                // title = formattedTitle;
                
                // if (title.toLowerCase().includes("facebook")) {
                //     title = "No title available";
                // }
                // const thumbMatch = data.match(/"thumbnail":{"uri":"(.*?)"/);
                //     const thumbnailUri = thumbMatch[1];

                // if (thumbMatch) {
                //     const thumbnailUri = thumbMatch[1];
                //     console.log("Thumbnail URL:", thumbnailUri);
                // } else {
                //     console.log("Thumbnail not found in the data.");
                // }
                
                // const durationMatch = data.match(/"playable_duration_in_ms":(\d+)/);
                // Function to format counts with K (thousands) and M (millions)
function formatCount(count) {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M'; // Format for millions (1,000,000 -> 1M)
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K'; // Format for thousands (1,000 -> 1K)
    }
    return count; // Return the original count if it's less than 1000
}
function decodeUrl(encodedUrl) {
    return decodeURIComponent(encodedUrl.replace(/\\u002F/g, '/'));
}


// Regular expression to match all zoomCover URLs
const zoomCoverRegex = /"(\d+)":\s?"([^"]+)"/g;

let match;
const zoomCovers = {};

// Use regex to find all matches
while ((match = zoomCoverRegex.exec(data)) !== null) {
    const resolution = match[1]; // The resolution (240, 480, 720, 960)
    const url = decodeURIComponent(match[2]); // The URL (decoded)
    zoomCovers[resolution] = url; // Store in an object
  }
  const duration = data.match(/"duration":(\d+)/);

const shareCount = data.match(/"shareCount":(\d+)/);
const commentCount = data.match(/"commentCount":(\d+)/);
const playCount = data.match(/"playCount":(\d+)/);
const repostCount = data.match(/"collectCount":"(\d+)"/);
const likeCount = data.match(/"diggCount":"(\d+)"/);
const desc = data.match(/"desc":"([^"]+)"/);  // Extract the desc field
const tumb = decodeUrl(zoomCovers[960]);
const music = data.match(/"music":\s*(\{[^}]*\})/);  // Match the "music" object, even if it's empty
const playurlMatch = music ? music[1].match(/"playUrl":"([^"]+)"/) : null;  // Extract the "playurl" value
const audioplayurl =decodeUrl(playurlMatch[1]);

// Safely access the data with optional chaining
const qualityTypeMatch = data.match(/"QualityType":\s*(\d+)/);
let downurl;
let qualityType = null;
if (qualityTypeMatch) {
    qualityType = parseInt(qualityTypeMatch[1], 10);  // Extracts the value of QualityType
}
console.log(qualityType ? `QualityType: ${qualityType}` : "QualityType not found.");

// Check if the QualityType is 28
if (qualityType) {
    // Safely access the UrlList
    const playAddrMatch = data.match(/"UrlList":\s*\[(.*?)\]/);
    
    let urlList = null;
    if (playAddrMatch) {
        urlList = JSON.parse(`[${playAddrMatch[1]}]`); // Convert to an array
    }

    // Log the UrlList
    if (urlList && Array.isArray(urlList)) {
downurl = urlList[2];
    } 
} 


// Format the extracted counts
const formattedShareCount = shareCount ? formatCount(parseInt(shareCount[1])) : '0';
const formattedCommentCount = commentCount ? formatCount(parseInt(commentCount[1])) : '0';
const formattedPlayCount = playCount ? formatCount(parseInt(playCount[1])) : '0';
const formattedRepostCount = repostCount ? formatCount(parseInt(repostCount[1])) : '0';
const formattedlikeCount = repostCount ? formatCount(parseInt(likeCount[1])) : '0';

// Output the formatted counts https://youtu.be/8G3A-l_v5zo


//                 const description = data.match(/"description":(.*?)"/);
   
// console.log(description);

                //    const repost =  repostCount[1];

         // let durationMs = durationMatch ? parseInt(durationMatch[1]) : null;
                // durationMinutes =   (durationMs / 60000).toFixed(2);

                if (formattedShareCount) {
                    resolve({
                        status: "success",
                        desc:desc[1] || 'null',
                        share: formattedShareCount || 0,
                        comment: formattedCommentCount || 0,
                        videoplays : formattedPlayCount || 0,
                        repost : formattedRepostCount || 0,
                        like : formattedlikeCount || 0,
                        cover: tumb || 'Error',
                        video: downurl || 'Error',
                        duration: duration || 'Error',

                        sound: audioplayurl || 'Error',

                    
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