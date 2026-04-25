
const axios = require("axios");
const creator =  "MOHAMMAD NAYAN";
const { decode } = require("html-entities");

exports.getFbVideoInfo = function (videoUrl) {
    return new Promise((resolve, reject) => {

        const url = `https://nayan-video-downloader.vercel.app/fbdown2?url=${encodeURIComponent(videoUrl)}&key=nayan`;

        axios.get(url)
            .then(res => {
                const data = res.data;

                // Check for errors from API
                if (data.status === "error" || data.status === 0) {
                    reject({
                        status: "error",
                        message: data.message || "Unknown error from API",
                        provider: "nayan"
                    });
                    return;
                }

              
console.log(data);

                resolve({
                    status: "success",
                    creator: creator,
                    title: data.media.title || "Unknown Title",
                    duration: data.media.duration || "Unknown Duration",
                    sd: data.media.sd,
                    hd: data.media.hd
                });
            })
            .catch(err => {
                reject({
                    status: "error",
                    message: "Failed to fetch from Nayans API",
                    error: err.message,
                    provider: "nayan"
                });
            });
    });
};