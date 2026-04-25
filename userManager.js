// =============================================
// USERMANAGER.JS - User database management
// Waxay maamusheysaa users.json
// =============================================

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "users.json");

// Load database
function loadDB() {
  try {
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch {
    return { users: {} };
  }
}

// Save database
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Get or create user
function getUser(userId, username) {
  const db = loadDB();
  if (!db.users[userId]) {
    db.users[userId] = {
      id: userId,
      username: username || "unknown",
      joinedAt: Date.now(),
      isPremium: false,
      premiumExpiry: null,
      dailyDownloads: 0,
      lastDownloadDate: null,
      totalDownloads: 0,
      banned: false,
    };
    saveDB(db);
  }
  return db.users[userId];
}

// Update user
function updateUser(userId, data) {
  const db = loadDB();
  if (db.users[userId]) {
    db.users[userId] = { ...db.users[userId], ...data };
    saveDB(db);
  }
}

// Check if premium is still valid
function isPremiumActive(user) {
  if (!user.isPremium) return false;
  if (!user.premiumExpiry) return false;
  return Date.now() < user.premiumExpiry;
}

// Approve premium for user
function approvePremium(userId, days) {
  const db = loadDB();
  if (!db.users[userId]) return false;

  const expiry = Date.now() + days * 24 * 60 * 60 * 1000;
  db.users[userId].isPremium = true;
  db.users[userId].premiumExpiry = expiry;
  saveDB(db);
  return true;
}

// Revoke premium
function revokePremium(userId) {
  const db = loadDB();
  if (!db.users[userId]) return false;
  db.users[userId].isPremium = false;
  db.users[userId].premiumExpiry = null;
  saveDB(db);
  return true;
}

// Check & reset daily downloads (resets every new day)
function checkDailyLimit(userId, freeLimit) {
  const db = loadDB();
  const user = db.users[userId];
  if (!user) return { allowed: false, remaining: 0 };

  const today = new Date().toDateString();
  const lastDate = user.lastDownloadDate
    ? new Date(user.lastDownloadDate).toDateString()
    : null;

  // Reset if new day
  if (lastDate !== today) {
    user.dailyDownloads = 0;
    user.lastDownloadDate = Date.now();
    db.users[userId] = user;
    saveDB(db);
  }

  const remaining = freeLimit - user.dailyDownloads;
  return {
    allowed: user.dailyDownloads < freeLimit,
    remaining: Math.max(0, remaining),
  };
}

// Increment download count
function incrementDownload(userId) {
  const db = loadDB();
  if (!db.users[userId]) return;
  db.users[userId].dailyDownloads = (db.users[userId].dailyDownloads || 0) + 1;
  db.users[userId].totalDownloads = (db.users[userId].totalDownloads || 0) + 1;
  db.users[userId].lastDownloadDate = Date.now();
  saveDB(db);
}

// Get all users (for admin stats)
function getAllUsers() {
  const db = loadDB();
  return Object.values(db.users);
}

// Ban user
function banUser(userId) {
  const db = loadDB();
  if (!db.users[userId]) return false;
  db.users[userId].banned = true;
  saveDB(db);
  return true;
}

module.exports = {
  getUser,
  updateUser,
  isPremiumActive,
  approvePremium,
  revokePremium,
  checkDailyLimit,
  incrementDownload,
  getAllUsers,
  banUser,
};
