// =============================================
// INDEX.JS - Main Telegram Bot
// Luuqadda: Soomaali + English
// =============================================

const TelegramBot = require("node-telegram-bot-api");
const config = require("./config");
const userManager = require("./userManager");
const { getFormats, downloadVideo, deleteFile } = require("./downloader");
const queue = require("./queue");

// Initialize bot
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Store pending URL selections per user: { userId: { url, formats, title } }
const pendingDownloads = {};

// Anti-spam: track last message time per user
const lastMessage = {};

console.log("🤖 Bot wuu bilaabmay...");

// =============================================
// HELPERS
// =============================================

function isAdmin(userId) {
  return userId === config.ADMIN_ID;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isSpamming(userId) {
  const now = Date.now();
  const last = lastMessage[userId] || 0;
  if (now - last < 2000) return true; // 2 second cooldown
  lastMessage[userId] = now;
  return false;
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function formatExpiry(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString("so-SO");
}

// =============================================
// /start COMMAND
// =============================================
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  userManager.getUser(userId, username);

  bot.sendMessage(
    msg.chat.id,
    `👋 *Ku soo dhawow Video Downloader Bot!*\n\n` +
    `Waxaan kaa caawin karaa in aad ka soo dejiso video-yada:\n` +
    `📺 YouTube • TikTok • Instagram • Facebook • Twitter\n\n` +
    `📌 *Sida loo isticmaalo:*\n` +
    `1️⃣ Noo soo dir URL-ka video-ga\n` +
    `2️⃣ Dooro quality-ga aad rabto\n` +
    `3️⃣ Bot-ku wuxuu kuu soo diri doonaa video-ga\n\n` +
    `📋 *Amarrada:*\n` +
    `/help - Caawimaad\n` +
    `/status - Xaaladdaada\n` +
    `/premium - Noqo Premium\n`,
    { parse_mode: "Markdown" }
  );
});

// =============================================
// /help COMMAND
// =============================================
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `ℹ️ *CAAWIMAAD*\n\n` +
    `*Sida loo isticmaalo:*\n` +
    `Kaliya soo dir URL-ka video-ga, bot-ku wuxuu kuu soo tusi doonaa quality-yada available-ka ah.\n\n` +
    `*👤 Free User:*\n` +
    `• Max quality: 480p\n` +
    `• ${config.FREE_DAILY_LIMIT} downloads maalintii\n` +
    `• ${config.FREE_DELAY_SECONDS} ilbiriqsi delay ah\n\n` +
    `*⭐ Premium User:*\n` +
    `• Dhammaan quality-yada (ilaa 8K)\n` +
    `• Unlimited downloads\n` +
    `• Delay la'aan\n` +
    `• Priority queue\n\n` +
    `*Amarrada:*\n` +
    `/start - Bilow\n` +
    `/status - Xaaladdaada\n` +
    `/premium - Xog premium\n` +
    `/cancel - Ka jooji download-ka socda`,
    { parse_mode: "Markdown" }
  );
});

// =============================================
// /status COMMAND
// =============================================
bot.onText(/\/status/, (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const user = userManager.getUser(userId, username);
  const premiumActive = userManager.isPremiumActive(user);
  const { remaining } = userManager.checkDailyLimit(userId, config.FREE_DAILY_LIMIT);

  let statusText = `👤 *XAALADDAADA*\n\n`;
  statusText += `🆔 ID: \`${userId}\`\n`;
  statusText += `👤 Magac: ${username}\n`;
  statusText += `📅 Ku biirtay: ${new Date(user.joinedAt).toLocaleDateString()}\n\n`;

  if (premiumActive) {
    statusText += `⭐ *Nooc: PREMIUM*\n`;
    statusText += `📆 Dhacaya: ${formatExpiry(user.premiumExpiry)}\n`;
    statusText += `♾️ Downloads: Unlimited\n`;
  } else {
    statusText += `👤 *Nooc: Free*\n`;
    statusText += `📥 Downloads hadhay maanta: ${remaining}/${config.FREE_DAILY_LIMIT}\n`;
    statusText += `\n💡 /premium si aad u hesho unlimited downloads`;
  }

  statusText += `\n\n📊 Downloads guud: ${user.totalDownloads || 0}`;

  bot.sendMessage(msg.chat.id, statusText, { parse_mode: "Markdown" });
});

// =============================================
// /premium COMMAND
// =============================================
bot.onText(/\/premium/, (msg) => {
  bot.sendMessage(msg.chat.id, config.PAYMENT_INFO, { parse_mode: "Markdown" });
});

// =============================================
// /paid COMMAND - User reports payment
// =============================================
bot.onText(/\/paid (.+)/, (msg, match) => {
  const userId = msg.from.id;
  const username = msg.from.username || msg.from.first_name;
  const reference = match[1];

  // Notify admin
  bot.sendMessage(
    config.ADMIN_ID,
    `💰 *LACAG-BIXIN CUSUB*\n\n` +
    `👤 User: @${username}\n` +
    `🆔 ID: \`${userId}\`\n` +
    `🧾 Reference: ${reference}\n\n` +
    `Approve-garee: /approve ${userId} 30\n` +
    `Diid: /reject ${userId}`,
    { parse_mode: "Markdown" }
  );

  bot.sendMessage(
    msg.chat.id,
    `✅ *Lacag-bixintaada waa la diray admin-ka!*\n\n` +
    `Reference: \`${reference}\`\n\n` +
    `Admin-ku wuxuu xaqiijin doonaa 1-24 saacadood gudahood. Adkayso! 🙏`,
    { parse_mode: "Markdown" }
  );
});

// =============================================
// /cancel COMMAND
// =============================================
bot.onText(/\/cancel/, (msg) => {
  const userId = msg.from.id;
  delete pendingDownloads[userId];
  bot.sendMessage(msg.chat.id, "❌ La joojiyay.");
});

// =============================================
// ADMIN: /approve user_id days
// =============================================
bot.onText(/\/approve (\d+) (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const targetId = parseInt(match[1]);
  const days = parseInt(match[2]);
  const success = userManager.approvePremium(targetId, days);

  if (success) {
    bot.sendMessage(msg.chat.id, `✅ User ${targetId} waa la approve-garay (${days} maalmood).`);
    bot.sendMessage(
      targetId,
      `🎉 *Hambalyo! Premium-kaaga waa la xaqiijiyay!*\n\n` +
      `⭐ Waxaad hadda haysataa ${days} maalmood oo premium ah.\n` +
      `Enjoy garee downloads-kaaga! 🚀`,
      { parse_mode: "Markdown" }
    );
  } else {
    bot.sendMessage(msg.chat.id, `❌ User ${targetId} lama helin.`);
  }
});

// =============================================
// ADMIN: /revoke user_id
// =============================================
bot.onText(/\/revoke (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const targetId = parseInt(match[1]);
  userManager.revokePremium(targetId);
  bot.sendMessage(msg.chat.id, `✅ Premium-ka user ${targetId} waa la joojiyay.`);
});

// =============================================
// ADMIN: /reject user_id
// =============================================
bot.onText(/\/reject (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const targetId = parseInt(match[1]);
  bot.sendMessage(msg.chat.id, `✅ User ${targetId} waa la diidey.`);
  bot.sendMessage(targetId, `❌ Lacag-bixintaadu waa la diidey. Wixii su'aal ah nala soo xiriir.`);
});

// =============================================
// ADMIN: /ban user_id
// =============================================
bot.onText(/\/ban (\d+)/, (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const targetId = parseInt(match[1]);
  userManager.banUser(targetId);
  bot.sendMessage(msg.chat.id, `✅ User ${targetId} waa la ban-garay.`);
});

// =============================================
// ADMIN: /stats
// =============================================
bot.onText(/\/stats/, (msg) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const users = userManager.getAllUsers();
  const premium = users.filter((u) => userManager.isPremiumActive(u)).length;
  const total = users.length;
  const totalDl = users.reduce((s, u) => s + (u.totalDownloads || 0), 0);

  bot.sendMessage(
    msg.chat.id,
    `📊 *STATS*\n\n` +
    `👥 Users guud: ${total}\n` +
    `⭐ Premium users: ${premium}\n` +
    `👤 Free users: ${total - premium}\n` +
    `📥 Downloads guud: ${totalDl}`,
    { parse_mode: "Markdown" }
  );
});

// =============================================
// ADMIN: /broadcast message
// =============================================
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  if (!isAdmin(msg.from.id)) return bot.sendMessage(msg.chat.id, "⛔ Admin kaliya.");

  const message = match[1];
  const users = userManager.getAllUsers();
  let sent = 0;

  bot.sendMessage(msg.chat.id, `📢 Waxaan u diri doonaa ${users.length} user...`);

  for (const user of users) {
    try {
      await bot.sendMessage(user.id, `📢 *Xaaladda Admin:*\n\n${message}`, {
        parse_mode: "Markdown",
      });
      sent++;
      await sleep(50); // Avoid rate limiting
    } catch {
      // User may have blocked bot
    }
  }

  bot.sendMessage(msg.chat.id, `✅ Waa la diray: ${sent}/${users.length} users`);
});

// =============================================
// URL HANDLER - Main download flow
// =============================================
bot.on("message", async (msg) => {
  const userId = msg.from.id;
  const chatId = msg.chat.id;
  const text = msg.text;

  // Ignore commands
  if (!text || text.startsWith("/")) return;

  // Anti-spam check
  if (isSpamming(userId)) return;

  const username = msg.from.username || msg.from.first_name;
  const user = userManager.getUser(userId, username);

  // Banned user check
  if (user.banned) {
    return bot.sendMessage(chatId, "⛔ Acount-kaagu waa la xannibaay.");
  }

  // Check if valid URL
  if (!isValidUrl(text)) {
    return bot.sendMessage(
      chatId,
      "⚠️ URL-ka oo sax ah noo soo dir.\n\nMisaalo: https://youtube.com/watch?v=..."
    );
  }

  // Notify user we're fetching
  const loadingMsg = await bot.sendMessage(chatId, "🔍 Waxaan ka raadinayaa quality-yada...");

  try {
    const { formats, title } = await getFormats(text);

    if (!formats || formats.length === 0) {
      return bot.editMessageText(
        "❌ Lama heli karo quality-yada. URL-ka hubi.",
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }

    const premiumActive = userManager.isPremiumActive(user);

    // Filter qualities based on user type
    const availableFormats = premiumActive
      ? formats
      : formats.filter((f) => f.height <= parseInt(config.FREE_MAX_QUALITY));

    if (availableFormats.length === 0) {
      return bot.editMessageText(
        `⚠️ Quality-yada available-ka ah waxay ka sarreeyaan 480p.\n\n` +
        `⭐ /premium si aad u hesho dhammaan quality-yada.`,
        { chat_id: chatId, message_id: loadingMsg.message_id }
      );
    }

    // Store pending download info
    pendingDownloads[userId] = { url: text, formats: availableFormats, title };

    // Build inline keyboard with quality options
    const keyboard = availableFormats.map((f) => [
      {
        text: `${f.height >= 2160 ? "🔥 " : f.height >= 720 ? "⭐ " : ""}${f.label}${
          f.filesize ? ` (~${(f.filesize / (1024 * 1024)).toFixed(1)}MB)` : ""
        }`,
        callback_data: `dl_${f.height}`,
      },
    ]);

    await bot.editMessageText(
      `🎬 *${title.substring(0, 60)}*\n\n` +
      `${premiumActive ? "⭐ Premium" : "👤 Free"} | Dooro quality:`,
      {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard },
      }
    );
  } catch (err) {
    bot.editMessageText(`❌ ${err.message}`, {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
    });
  }
});

// =============================================
// CALLBACK - Quality selection
// =============================================
bot.on("callback_query", async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;

  if (!data.startsWith("dl_")) return;

  const height = parseInt(data.replace("dl_", ""));
  const pending = pendingDownloads[userId];

  if (!pending) {
    return bot.answerCallbackQuery(query.id, {
      text: "❌ Session-ku wuu dhacay. URL-ka mar kale soo dir.",
      show_alert: true,
    });
  }

  const username = query.from.username || query.from.first_name;
  const user = userManager.getUser(userId, username);
  const premiumActive = userManager.isPremiumActive(user);

  // Check daily limit for free users
  if (!premiumActive) {
    const { allowed, remaining } = userManager.checkDailyLimit(userId, config.FREE_DAILY_LIMIT);
    if (!allowed) {
      return bot.answerCallbackQuery(query.id, {
        text: `❌ Maanta waxaad gaartay xaddiga ${config.FREE_DAILY_LIMIT} downloads. Berri isku day ama /premium.`,
        show_alert: true,
      });
    }
  }

  bot.answerCallbackQuery(query.id);

  // Clear keyboard
  bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    { chat_id: chatId, message_id: query.message.message_id }
  );

  const statusMsg = await bot.sendMessage(
    chatId,
    premiumActive
      ? `⭐ Premium | Waxaan ku soo dirin doonaa ${height >= 2160 ? height / 1080 + "K" : height + "p"} quality...`
      : `⏳ Free user | ${config.FREE_DELAY_SECONDS} ilbiriqsi ku sugo...`
  );

  // Add to queue
  const position = queue.size;
  if (position > 0) {
    bot.sendMessage(chatId, `📋 Queue: ${position + 1} download ka hor kuugu jira.`);
  }

  try {
    await queue.add(async () => {
      // Delay for free users
      if (!premiumActive) {
        for (let i = config.FREE_DELAY_SECONDS; i > 0; i--) {
          await bot.editMessageText(
            `⏳ ${i} ilbiriqsi ku sugo...`,
            { chat_id: chatId, message_id: statusMsg.message_id }
          );
          await sleep(1000);
        }
      }

      await bot.editMessageText("📥 Waxaan soo dejinayaa...", {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });

      // Download video
      const filePath = await downloadVideo(
        pending.url,
        height,
        `video_${userId}`
      );

      await bot.editMessageText("📤 Waxaan kuu diri doonaa...", {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });

      // Send video to user
      await bot.sendVideo(chatId, filePath, {
        caption: `✅ *${pending.title.substring(0, 50)}*\n\n` +
          `📊 Quality: ${height >= 2160 ? height / 1080 + "K" : height + "p"}\n` +
          `${premiumActive ? "⭐ Premium Download" : "👤 Free Download"}`,
        parse_mode: "Markdown",
        supports_streaming: true,
      });

      // Cleanup
      deleteFile(filePath);
      delete pendingDownloads[userId];
      userManager.incrementDownload(userId);

      await bot.deleteMessage(chatId, statusMsg.message_id);
    });
  } catch (err) {
    deleteFile(`./downloads/video_${userId}_*.mp4`); // cleanup attempt
    bot.editMessageText(`❌ ${err.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    });
  }
});

// =============================================
// ERROR HANDLING
// =============================================
bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
});

console.log("✅ Bot wuu shaqeynayaa. Telegram-ka fur oo isku day!");
