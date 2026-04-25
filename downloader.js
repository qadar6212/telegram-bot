// =============================================
// DOWNLOADER.JS - Video download using yt-dlp
// Waxay ka soo qaadataa video-yada URL-ka
// =============================================

const { execFile, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const config = require("./config");

// Make sure downloads folder exists
if (!fs.existsSync(config.DOWNLOAD_DIR)) {
  fs.mkdirSync(config.DOWNLOAD_DIR, { recursive: true });
}

// Fetch available formats/qualities from URL
function getFormats(url) {
  return new Promise((resolve, reject) => {
    execFile(
      "yt-dlp",
      ["--list-formats", "--no-playlist", "-J", url],
      { timeout: 30000 },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error("URL-kan lama garan karo ama waa khalad."));
        }
        try {
          const info = JSON.parse(stdout);
          const formats = parseFormats(info);
          resolve({ formats, title: info.title || "video" });
        } catch {
          reject(new Error("Ma heli karo macluumaadka video-ga."));
        }
      }
    );
  });
}

// Parse and group formats into quality options
function parseFormats(info) {
  const seen = new Set();
  const result = [];

  const qualityMap = {
    4320: "8K",
    2160: "4K",
    1440: "1440p",
    1080: "1080p",
    720: "720p",
    480: "480p",
    360: "360p",
    240: "240p",
    144: "144p",
  };

  if (!info.formats) return result;

  // Sort by height descending
  const sorted = info.formats
    .filter((f) => f.height && f.vcodec !== "none")
    .sort((a, b) => (b.height || 0) - (a.height || 0));

  for (const fmt of sorted) {
    const h = fmt.height;
    const label = qualityMap[h] || `${h}p`;
    if (!seen.has(label)) {
      seen.add(label);
      result.push({
        label,
        height: h,
        format_id: fmt.format_id,
        ext: fmt.ext || "mp4",
        filesize: fmt.filesize || fmt.filesize_approx || null,
      });
    }
  }

  return result;
}

// Download video with selected quality
function downloadVideo(url, height, outputName) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(
      config.DOWNLOAD_DIR,
      `${outputName}_${Date.now()}.mp4`
    );

    // Build yt-dlp arguments
    const args = [
      url,
      "--no-playlist",
      "-f",
      `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
      "--merge-output-format",
      "mp4",
      "-o",
      outputPath,
      "--no-warnings",
      "--quiet",
    ];

    const proc = spawn("yt-dlp", args);

    let errOutput = "";
    proc.stderr.on("data", (d) => {
      errOutput += d.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && fs.existsSync(outputPath)) {
        // Check file size
        const stats = fs.statSync(outputPath);
        const sizeMB = stats.size / (1024 * 1024);

        if (sizeMB > config.MAX_FILE_SIZE_MB) {
          fs.unlinkSync(outputPath);
          return reject(
            new Error(
              `Faylku waa weyn yahay (${sizeMB.toFixed(1)}MB). Telegram wuxuu oggolaanayaa ilaa ${config.MAX_FILE_SIZE_MB}MB. Isku day quality yar.`
            )
          );
        }

        resolve(outputPath);
      } else {
        reject(new Error("Download-ka wuu fashilmay. URL-ka hubi ama isku day mar kale."));
      }
    });

    proc.on("error", () => {
      reject(new Error("yt-dlp lama heli karo. Server-ka hubi."));
    });
  });
}

// Delete file after sending
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Silent fail
  }
}

module.exports = { getFormats, downloadVideo, deleteFile };
