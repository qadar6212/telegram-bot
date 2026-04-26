const YTDlpWrap = require("yt-dlp-wrap").default;
const path = require("path");
const fs = require("fs");
const config = require("./config");

if (!fs.existsSync(config.DOWNLOAD_DIR)) {
  fs.mkdirSync(config.DOWNLOAD_DIR, { recursive: true });
}

const ytDlp = new YTDlpWrap();

async function initYtDlp() {
  try {
    await YTDlpWrap.downloadFromGithub();
    console.log("yt-dlp ready");
  } catch (e) {
    console.log("yt-dlp init:", e.message);
  }
}
initYtDlp();

async function getFormats(url) {
  try {
    const info = await ytDlp.getVideoInfo(url);
    const formats = parseFormats(info);
    return { formats, title: info.title || "video" };
  } catch (e) {
    throw new Error("URL-kan lama garan karo ama waa khalad.");
  }
}

function parseFormats(info) {
  const seen = new Set();
  const result = [];
  const qualityMap = { 4320:"8K", 2160:"4K", 1440:"1440p", 1080:"1080p", 720:"720p", 480:"480p", 360:"360p", 240:"240p", 144:"144p" };
  if (!info.formats) return result;
  const sorted = info.formats.filter((f) => f.height && f.vcodec !== "none").sort((a, b) => (b.height || 0) - (a.height || 0));
  for (const fmt of sorted) {
    const h = fmt.height;
    const label = qualityMap[h] || `${h}p`;
    if (!seen.has(label)) {
      seen.add(label);
      result.push({ label, height: h, format_id: fmt.format_id, ext: fmt.ext || "mp4", filesize: fmt.filesize || fmt.filesize_approx || null });
    }
  }
  return result;
}

async function downloadVideo(url, height, outputName) {
  const outputPath = path.join(config.DOWNLOAD_DIR, `${outputName}_${Date.now()}.mp4`);
  try {
    await ytDlp.execPromise([url, "--no-playlist", "-f", `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`, "--merge-output-format", "mp4", "-o", outputPath, "--no-warnings", "--quiet"]);
    if (!fs.existsSync(outputPath)) throw new Error("Fayl ma samayn karin.");
    const stats = fs.statSync(outputPath);
    const sizeMB = stats.size / (1024 * 1024);
    if (sizeMB > config.MAX_FILE_SIZE_MB) { fs.unlinkSync(outputPath); throw new Error(`Faylku waa weyn yahay (${sizeMB.toFixed(1)}MB). Isku day quality yar.`); }
    return outputPath;
  } catch (e) {
    deleteFile(outputPath);
    throw new Error(e.message || "Download-ka wuu fashilmay.");
  }
}

function deleteFile(filePath) {
  try { if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch {}
}

module.exports = { getFormats, downloadVideo, deleteFile };