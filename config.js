// =============================================
// CONFIG.JS - Bot Settings
// Halkan waxaad ku beddeli kartaa token-kaaga
// =============================================

module.exports = {
  // TOKEN-KA TELEGRAM BOT-KAAGA - ka hel @BotFather
BOT_TOKEN: "8616440846:AAGsILqthEutJepwZI0f3YQo3exwXOTFUn0",

  // ADMIN ID - ID-gaaga Telegram (hel @userinfobot)
  ADMIN_ID: 123456789,

  // Free user limits
  FREE_DAILY_LIMIT: 5,          // downloads maalintii
  FREE_MAX_QUALITY: "480",      // max quality (480p)
  FREE_DELAY_SECONDS: 7,        // delay ka hor download

  // Premium
  PREMIUM_DEFAULT_DAYS: 30,     // maalmo premium ah markii la approve garayo

  // File size limits (Telegram max = 50MB for bots)
  MAX_FILE_SIZE_MB: 50,

  // Downloads folder
  DOWNLOAD_DIR: "./downloads",

  // Payment instructions (Somali payment methods)
  PAYMENT_INFO: `
💳 *PREMIUM LACAG-BIXINTA*

📱 *EVC Plus:* 252-61-XXXXXXX
📱 *Zaad:* 252-63-XXXXXXX  
📱 *Sahal:* 252-65-XXXXXXX

💰 *Qiimaha:*
• 1 Bilood: $3 USD
• 3 Bilood: $8 USD
• 6 Bilood: $14 USD

📝 *Kadib lacag-bixinta:*
Noo soo dir screenshot + /paid [reference_number]

Admin wuxuu xaqiijin doonaa 1-24 saacadood gudahood.
  `,
};
