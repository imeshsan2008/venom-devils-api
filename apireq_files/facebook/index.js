const axios = require("axios");
const { decode } = require("html-entities");

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

class FbScraper {
  constructor(options = {}) {
    this.creator = options.creator || "Dark Venom";
    this.retries = options.retries || 3;
    this.timeout = options.timeout || 15000;
    this.proxy = options.proxy || null;
  }

  // -------------------------
  // HTTP
  // -------------------------
  async request(url, headers) {
    return axios.get(url, {
      timeout: this.timeout,
      headers,
      proxy: this.proxy || false,
    });
  }

  sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  decodeText(str) {
    return decode(str || "");
  }

  cleanUrl(url) {
    return url ? url.replace(/\\\//g, "/") : null;
  }

  formatTitle(raw) {
    try {
      const unicode = raw.replace(/\\\\/g, "\\");
      return JSON.parse(`"${unicode}"`)
        .replace(/\n/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    } catch {
      return raw;
    }
  }

  formatDuration(ms) {
    if (!ms) return "Unknown";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  extract(html, patterns = []) {
    for (const r of patterns) {
      const m = html.match(r);
      if (m && m[1]) return m[1];
    }
    return null;
  }

  // -------------------------
  // CORE PARSER (IMPROVED)
  // -------------------------
  parseVideo(html) {
    html = html.replace(/&quot;/g, '"').replace(/&amp;/g, "&");

    // 🔥 MOBILE + MODERN FB FALLBACKS
    const sd = this.extract(html, [
      /"browser_native_sd_url":"(.*?)"/,
      /"playable_url":"(.*?)"/,
      /"sd_src_no_ratelimit":"(.*?)"/,
      /"playable_url_quality":"(.*?)"/,
    ]);

    const hd = this.extract(html, [
      /"browser_native_hd_url":"(.*?)"/,
      /"playable_url_quality_hd":"(.*?)"/,
      /"hd_src_no_ratelimit":"(.*?)"/,
    ]);

    const thumb = this.extract(html, [
      /"preferred_thumbnail":{"image":{"uri":"(.*?)"/,
      /"thumbnailImage":{"uri":"(.*?)"/,
    ]);

    const titleRaw =
      this.extract(html, [
        /<meta\sname="description"\scontent="(.*?)"/,
        /<meta\sproperty="og:title"\scontent="(.*?)"/,
        /"message":{"text":"(.*?)"/,
      ]) || "No title available";

    const duration = this.extract(html, [
      /"playable_duration_in_ms":(\d+)/,
    ]);

    return {
      sd: this.cleanUrl(sd),
      hd: this.cleanUrl(hd),
      thumbnail: this.cleanUrl(thumb),
      title: this.formatTitle(this.decodeText(titleRaw)),
      durationMs: duration ? parseInt(duration) : null,
    };
  }

  // -------------------------
  // RETRY ENGINE
  // -------------------------
  async fetchWithRetry(url, headers) {
    let lastError;

    for (let i = 1; i <= this.retries; i++) {
      try {
        const res = await this.request(url, headers);

        const parsed = this.parseVideo(res.data);

        // DEBUG (optional)
        // console.log(res.data.slice(0, 2000));

        if (!parsed.sd && !parsed.hd) {
          throw new Error("No video URL found (SD/HD missing)");
        }

        return parsed;
      } catch (err) {
        lastError = err;
        console.error(`Attempt ${i} failed:`, err.message);

        if (i < this.retries) {
          await this.sleep(1000 * i);
        }
      }
    }

    throw lastError;
  }

  // -------------------------
  // MAIN API
  // -------------------------
  async getFbVideoInfo(videoUrl, cookie, useragent) {
    if (!videoUrl || !videoUrl.startsWith("http")) {
      throw {
        status: "error",
        message: "Invalid video URL",
      };
    }

    // 🔥 IMPORTANT: use mobile version (more stable)
    const url = videoUrl.replace("www.facebook.com", "m.facebook.com");

    const headers = {
      "user-agent": useragent || DEFAULT_UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "en-GB,en;q=0.9",
      cookie: cookie || "",
      "cache-control": "max-age=0",
      "sec-fetch-site": "none",
      "sec-fetch-mode": "navigate",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      Connection: "keep-alive",
    };

    try {
      const data = await this.fetchWithRetry(url, headers);

      return {
        status: "success",
        creator: this.creator,
        title: data.title,
        duration: this.formatDuration(data.durationMs),
        thumbnail: data.thumbnail,
        sd: data.sd,
        hd: data.hd,
      };
    } catch (err) {
      return {
        status: "error",
        message: "Failed to fetch Facebook video info after retries",
        error: err.message,
      };
    }
  }
}

module.exports = FbScraper;