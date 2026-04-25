# 🤖 Telegram Video Downloader Bot

Bot-kan wuxuu u oggolaanayaa users-ka inay ka soo dejiyaan video-yada YouTube, TikTok, Instagram, Facebook iwm.

---

## ⚙️ SIDA LOO HIRGALIYO (Setup)

### 1. Install-garee Node.js
Download Node.js: https://nodejs.org

### 2. Install-garee yt-dlp
```bash
# Linux/Mac
pip install yt-dlp
# ama
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp

# Windows
pip install yt-dlp
```

### 3. Install-garee ffmpeg (loo baahan yahay merge-ka audio+video)
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# Windows: https://ffmpeg.org/download.html
```

### 4. Bot-ka Telegram-ka ka samee
1. Fur @BotFather Telegram-ka
2. Ku qor `/newbot`
3. Bot-ka magac u sii
4. Copy-garee TOKEN-ka

### 5. Hel Admin ID-gaada
1. Fur @userinfobot Telegram-ka
2. Ku qor `/start`
3. ID-gaada copy-garee

### 6. Config.js update-garee
Fur `config.js` oo beddel:
```js
BOT_TOKEN: "TOKEN_KAAGA_HALKAN",
ADMIN_ID: 123456789, // ID-gaaga
```

EVC Plus/Zaad/Sahal numberkaaga sidoo kale ku dar.

### 7. Dependencies install-garee
```bash
npm install
```

### 8. Bot-ka bilow
```bash
node index.js
# ama dev mode:
npm run dev
```

---

## 📁 STRUCTURE-KA FAYLASHA

```
telegram-bot/
├── index.js        # Main bot logic
├── config.js       # Settings
├── userManager.js  # User database
├── downloader.js   # yt-dlp integration
├── queue.js        # Download queue
├── users.json      # User data (auto-created)
├── downloads/      # Temporary files (auto-created)
└── package.json
```

---

## 👑 ADMIN COMMANDS

| Command | Shaqada |
|---------|---------|
| `/approve 123456 30` | Premium u samee user 30 maalmood |
| `/revoke 123456` | Premium ka qaad |
| `/reject 123456` | Lacag-bixin diid |
| `/ban 123456` | User ban-garee |
| `/stats` | Stats guud |
| `/broadcast Xaaladda` | Dhammaan users u dir |

---

## 👤 USER COMMANDS

| Command | Shaqada |
|---------|---------|
| `/start` | Bilow |
| `/help` | Caawimaad |
| `/status` | Xaaladdaada |
| `/premium` | Payment info |
| `/paid REF123` | Lacag bixintii waa la diray |
| `/cancel` | Ka jooji |

---

## 💳 PAYMENT SYSTEM

1. User wuxuu ku qoraa `/premium`
2. Bot-ku wuxuu u tusi doonaa EVC/Zaad/Sahal number-ka
3. User lacagta bixiyaa oo `/paid REF123` dira
4. Admin-ku wuxuu helaa notification
5. Admin wuxuu qoraa `/approve USER_ID 30`
6. User wuxuu helaa confirmation

---

## ⚠️ XUSUUSIN

- Telegram bot-yadu waxay diri karaan ilaa **50MB** faylal
- Video-yada weyn (4K, 8K) badanaa waa ka badan yihiin 50MB
- Premium users-ka ku xusi in quality sare ay waxtar yar yeelan karto
- yt-dlp regularly update-garee: `pip install -U yt-dlp`
