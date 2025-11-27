// optimized-youtube-scraper.js
const axios = require("axios");
const yts = require("yt-search");
const { createDecipheriv } = require("crypto");

// --------- config ----------
const audioQualities = [92, 128, 256, 320];
const videoQualities = [144, 360, 480, 720, 1080];
const SECRET_KEY_HEX = "C5D58EF67A7584E4A29F6C35BBC4EB12";
const AXIOS_TIMEOUT = 20000; // ms
// ---------------------------

const http = axios.create({
  timeout: AXIOS_TIMEOUT,
  headers: {
    "User-Agent": "Mozilla/5.0"
  }
});

function getYouTubeVideoId(url) {
  if (!url || typeof url !== "string") return null;
  const regex = /(?:v=|\/v\/|youtu\.be\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/;
  const m = url.match(regex);
  if (m && m[1]) return m[1];
  // fallback: if user passed only id
  if (/^[A-Za-z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

const hexcode = (hex) => Buffer.from(hex, "hex");

function decode(enc) {
  if (!enc || typeof enc !== "string") {
    throw new Error("Invalid input to decode() — received null or non-string");
  }
  try {
    const data = Buffer.from(enc, "base64");
    const iv = data.slice(0, 16);
    const content = data.slice(16);
    const key = hexcode(SECRET_KEY_HEX);

    const decipher = createDecipheriv("aes-128-cbc", key, iv);
    const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (err) {
    throw new Error("Decode failed: " + err.message);
  }
}

/**
 * Get a CDN (cached in-memory per runtime) and info for the link.
 * We minimize calls:
 *  - getRandomCdn() called once per overall operation
 *  - /v2/info called once per youtube url
 */
async function getRandomCdn() {
  // single call to get random CDN; cache across runtime if needed
  try {
    const res = await http.get("https://media.savetube.me/api/random-cdn");
    if (res?.data?.cdn) return res.data.cdn;
    throw new Error("random-cdn returned empty");
  } catch (err) {
    throw new Error("Failed to fetch random CDN: " + err.message);
  }
}

async function getInfoFromCdn(cdn, link) {
  try {
    const res = await http.post(
      `https://${cdn}/v2/info`,
      { url: link },
      {
        headers: {
          Referer: "https://yt.savetube.me/1kejjj1?id=362796039"
        }
      }
    );
    const encryptedData = res?.data?.data;
    if (!encryptedData) throw new Error("No encrypted data in /v2/info response");
    const info = decode(encryptedData);
    return info; // contains { key, title, ... } as in original
  } catch (err) {
    throw new Error("getInfoFromCdn failed: " + err.message);
  }
}

/**
 * Single download request to CDN (returns {status,url,filename,quality})
 * downloadType: "audio" or "video"
 * quality: numeric (kbps or p)
 */
async function requestDownloadFromCdn(cdn, downloadType, quality, key) {
  try {
    const res = await http.post(
      `https://${cdn}/download`,
      {
        downloadType,
        quality: `${quality}`,
        key
      },
      {
        headers: {
          "Content-Type": "application/json",
          Referer: "https://yt.savetube.me/start-download?from=1kejjj1%3Fid%3D362796039"
        }
      }
    );

    const dlUrl = res?.data?.data?.downloadUrl ?? res?.data?.downloadUrl ?? null;
    if (!dlUrl) throw new Error("No download URL returned");
    return {
      status: true,
      url: dlUrl
    };
  } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
}

/**
 * Build downloads for all qualities in parallel.
 * We call getRandomCdn() once and getInfoFromCdn() once, then fire parallel download requests.
 */
async function buildAllDownloads(link, keepAudio = true, keepVideo = true) {
  // expects link like https://youtube.com/watch?v=...
  const cdn = await getRandomCdn();
  const info = await getInfoFromCdn(cdn, link);
  const key = info.key;

  const audioPromises = (keepAudio ? audioQualities : []).map((q) =>
    requestDownloadFromCdn(cdn, "audio", q, key).then((r) => ({ q, type: "audio", res: r }))
  );

  const videoPromises = (keepVideo ? videoQualities : []).map((q) =>
    requestDownloadFromCdn(cdn, "video", q, key).then((r) => ({ q, type: "video", res: r }))
  );

  // Run all in parallel
  const all = await Promise.allSettled([...audioPromises, ...videoPromises]);

  // Normalize results
  const audioResults = [];
  const videoResults = [];

  for (const p of all) {
    if (p.status !== "fulfilled") {
      // promise-level failure
      continue;
    }
    const { q, type, res } = p.value;
    if (res && res.status) {
      const qualityLabel = type === "audio" ? `${q}kbps` : `${q}p`;
      const filename =
        type === "audio"
          ? `${info.title} (${q}kbps).mp3`
          : `${info.title} (${q}p).mp4`;
      const out = {
        quality: qualityLabel,
        url: res.url,
        filename
      };
      if (type === "audio") audioResults.push(out);
      else videoResults.push(out);
    } else {
      // skip failures (res.message contains reason)
      // console.warn(`Failed ${type} ${q}: ${res?.message}`);
    }
  }

  // sort by quality numeric ascending (optional)
  audioResults.sort((a, b) => parseInt(a.quality) - parseInt(b.quality));
  videoResults.sort((a, b) => parseInt(a.quality) - parseInt(b.quality));

  return {
    info,
    audioResults,
    videoResults,
    cdn
  };
}

// --------- Public API functions (keeps similar shape to your original) ----------

async function ytmp3(link) {
  const videoId = getYouTubeVideoId(link);
  if (!videoId) {
    return { status: false, message: "Invalid YouTube URL" };
  }
  const url = "https://youtube.com/watch?v=" + videoId;
  try {
    // fetch metadata (yts) once
    const metadata = await yts(url);

    // build downloads in parallel but reusing cdn/info
    const { audioResults } = await buildAllDownloads(url, true, false);

    return {
      status: true,
      creator: "@vreden/youtube_scraper",
      metadata: metadata.all && metadata.all[0] ? metadata.all[0] : metadata,
      available: audioResults
    };
  } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
}

async function ytmp4(link) {
  const videoId = getYouTubeVideoId(link);
  if (!videoId) {
    return { status: false, message: "Invalid YouTube URL" };
  }
  const url = "https://youtube.com/watch?v=" + videoId;
  try {
    const metadata = await yts(url);
    const { videoResults } = await buildAllDownloads(url, false, true);

    return {
      status: true,
      creator: "@vreden/youtube_scraper",
      metadata: metadata.all && metadata.all[0] ? metadata.all[0] : metadata,
      available: videoResults
    };
  } catch (err) {
    return {
      status: false,
      message: err.message
    };
  }
}

async function getYtVideoInfo(link) {
  const videoId = getYouTubeVideoId(link);
  if (!videoId) {
    return { status: false, message: "Invalid YouTube URL" };
  }
  const url = "https://youtube.com/watch?v=" + videoId;
  try {
    // fetch metadata once
    const data = await yts(url);

    // Build both audio and video in parallel (we still use a single CDN/info)
    const { audioResults, videoResults } = await buildAllDownloads(url, true, true);

    return {
      status: true,
      creator: "@vreden/youtube_scraper",
      metadata: data.all && data.all[0] ? data.all[0] : data,
      available: videoResults,
      audio: audioResults
    };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

async function transcript(link) {
  try {
    const resp = await http.get("https://ytb2mp4.com/api/fetch-transcript", {
      params: { url: link },
      headers: { Referer: "https://ytb2mp4.com/youtube-transcript" }
    });
    return {
      status: true,
      creator: "@vreden/youtube_scraper",
      transcript: resp.data.transcript
    };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

async function search(query) {
  try {
    const data = await yts(query);
    return { status: true, creator: "@vreden/youtube_scraper", results: data.all };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

async function ytdlv2(link, format) {
  try {
    const result = await http.get(`https://ytdl.vreden.web.id/metadata?url=${encodeURIComponent(link)}`);
    const videoId = getYouTubeVideoId(link);
    const url = "https://youtube.com/watch?v=" + videoId;

    // get downloads (audio/video) in parallel
    const { audioResults, videoResults } = await buildAllDownloads(url, true, true);

    // attach the best matching formats if present (simple approach)
    const bestAudio = audioResults.length ? audioResults[audioResults.length - 1].url : null;
    const bestVideo = videoResults.length ? videoResults[videoResults.length - 1].url : null;

    // try to place urls into result.data.downloads if shape matches original
    if (result?.data) {
      result.data.downloads = result.data.downloads || {};
      result.data.downloads.audio = bestAudio;
      result.data.downloads.video = bestVideo;
    }

    return { status: true, creator: "@vreden/youtube_scraper", ...result.data };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

async function channel(channelId) {
  try {
    const res = await http.get(`https://ytdl.vreden.web.id/channel/${channelId}`);
    return { status: true, creator: "@vreden/youtube_scraper", ...res.data };
  } catch (err) {
    return { status: false, message: err.message };
  }
}

module.exports = {
  search,
  ytmp3,
  ytmp4,
  getYtVideoInfo,
  transcript,
  ytdlv2,
  channel
};
