// Load environment variables
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🎬 Advanced Video Downloader Bot is running...',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    bot: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Health check: https://your-app-name.herokuapp.com/health`);
});

// Get Telegram token from environment
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.error('❌ CRITICAL: TELEGRAM_TOKEN environment variable is missing');
  console.error('💡 Set it in Heroku: heroku config:set TELEGRAM_TOKEN=your_token');
  process.exit(1);
}

console.log('🤖 Starting Advanced Video Downloader Bot...');
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');

// Enhanced bot configuration for production
const bot = new TelegramBot(TELEGRAM_TOKEN, { 
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  },
  request: {
    timeout: 60000,
    agentOptions: {
      keepAlive: true,
      family: 4
    }
  }
});

// Store download stats
let downloadStats = {
  totalDownloads: 0,
  youtube: 0,
  instagram: 0,
  tiktok: 0,
  twitter: 0,
  lastUpdated: new Date()
};

// Test bot connection with better logging
bot.getMe().then(botInfo => {
  console.log('✅ Bot successfully connected to Telegram');
  console.log('🤖 Bot Username:', `@${botInfo.username}`);
  console.log('🆔 Bot ID:', botInfo.id);
  console.log('📊 Bot is ready to receive messages');
}).catch(error => {
  console.error('❌ Bot failed to connect to Telegram:', error.message);
  console.error('💡 Check your TELEGRAM_TOKEN and internet connection');
  process.exit(1);
});

// Enhanced error handling
bot.on('error', (error) => {
  console.error('🤖 Bot error:', error.message);
});

bot.on('polling_error', (error) => {
  console.error('📡 Polling error:', error.message);
});

// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `🎬 *Advanced Video Downloader Pro* 🎬

*📥 Download from Popular Platforms:*
• YouTube (Videos & Audio) ✅
• Instagram (Reels, Posts) ⚠️
• TikTok (No Watermark) ⚠️
• Twitter/X (Videos) ⚠️

*🎯 Features:*
📹 Download HD Videos
🎵 Extract MP3 Audio
⚡ Fast Processing
📱 User Friendly

*🚀 How to Use:*
Simply send any YouTube link to get started!

*⚡ Commands:*
/audio <url> - Extract audio only
/stats - View download statistics
/support - Get help

*⚠️ Note:* For best results, use YouTube links.`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// [Rest of your bot functions remain the same...]
// Keep all your downloadYouTube, downloadInstagram, etc. functions
// Keep the message handlers and other logic

// Add a function to log bot activity
function logActivity(chatId, username, action, platform = 'unknown') {
  const timestamp = new Date().toISOString();
  console.log(`📝 Activity: ${action} | User: @${username} | Platform: ${platform} | Chat: ${chatId} | Time: ${timestamp}`);
}

// Enhanced message handler with logging
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  const text = msg.text;

  // Skip commands
  if (text.startsWith('/')) return;

  // URL detection
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex);

  if (urls && urls.length > 0) {
    const url = urls[0];
    logActivity(chatId, username, 'download_request', detectPlatform(url));
    await handleUniversalDownload(chatId, url);
  }
});

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'unknown';
}

console.log('✅ Bot initialization complete!');
console.log('🚀 Deployment ready for Heroku + GitHub');
