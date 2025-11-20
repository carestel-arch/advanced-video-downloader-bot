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
  console.log(`🌐 Health check available at /health`);
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

// Enhanced YouTube Downloader
async function downloadYouTube(url, quality = 'highest') {
  try {
    console.log('📥 Downloading YouTube video:', url);
    
    // Validate URL
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }

    const info = await ytdl.getInfo(url);
    let format;

    if (quality === 'audio') {
      format = ytdl.chooseFormat(info.formats, { 
        quality: 'highestaudio',
        filter: 'audioonly'
      });
    } else {
      format = ytdl.chooseFormat(info.formats, { 
        quality: quality === 'highest' ? 'highest' : 'lowest',
        filter: 'audioandvideo'
      });
    }

    if (!format) {
      throw new Error('No suitable format found for this video');
    }

    return {
      success: true,
      title: info.videoDetails.title,
      url: format.url,
      duration: parseInt(info.videoDetails.lengthSeconds),
      thumbnail: info.videoDetails.thumbnails[0]?.url || '',
      author: info.videoDetails.author?.name || 'Unknown',
      views: info.videoDetails.viewCount || 0,
      quality: format.qualityLabel || 'Unknown',
      size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown'
    };
  } catch (error) {
    console.log('YouTube download error:', error.message);
    return {
      success: false,
      error: 'YouTube: ' + error.message
    };
  }
}

// Instagram Downloader using external API
async function downloadInstagram(url) {
  try {
    console.log('📥 Downloading Instagram video:', url);
    
    // Using Instagram download API
    const response = await axios.get(`https://api.instagram.com/download?url=${encodeURIComponent(url)}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.video_url) {
      return {
        success: true,
        title: 'Instagram Video',
        url: response.data.video_url,
        author: response.data
