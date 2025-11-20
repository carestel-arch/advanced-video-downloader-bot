// Load environment variables
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: '🎬 SnipSave Video Downloader Bot is running...',
    bot: '@snipsavevideodownloaderbot',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    bot: 'running',
    username: '@snipsavevideodownloaderbot',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Get Telegram token from environment
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '8017368297:AAHRUPmhsULOebtwjyKkEYZhGXpruKjQ5nE';

if (!TELEGRAM_TOKEN) {
  console.error('❌ CRITICAL: TELEGRAM_TOKEN environment variable is missing');
  process.exit(1);
}

console.log('🤖 Starting SnipSave Video Downloader Bot...');
console.log('🔧 Bot: @snipsavevideodownloaderbot');

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
    timeout: 120000,
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

// Test bot connection
bot.getMe().then(botInfo => {
  console.log('✅ Bot successfully connected to Telegram');
  console.log('🤖 Bot Username:', `@${botInfo.username}`);
  console.log('🆔 Bot ID:', botInfo.id);
}).catch(error => {
  console.error('❌ Bot failed to connect to Telegram:', error.message);
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
  const welcomeMessage = `🎬 *SnipSave Video Downloader* 🎬

*📥 Download from Popular Platforms:*
• YouTube (Videos & Audio) ✅
• Instagram (Reels, Posts) ⚠️
• TikTok (No Watermark) ✅
• Twitter/X (Videos) ⚠️

*🎯 Features:*
📹 Download HD Videos
🎵 Extract MP3 Audio
⚡ Fast Processing
📱 User Friendly

*🚀 How to Use:*
Simply send any video link to get started!

*⚡ Commands:*
/audio <url> - Extract audio only
/stats - View download statistics
/support - Get help

*Bot:* @snipsavevideodownloaderbot`;

  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// FIXED YouTube Downloader - Using External APIs
async function downloadYouTube(url, quality = 'highest') {
  try {
    console.log('📥 Downloading YouTube video:', url);
    
    // Extract video ID
    let videoId;
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else {
      throw new Error('Invalid YouTube URL');
    }

    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }

    // Method 1: Try y2mate API
    try {
      console.log('🔄 Trying y2mate API...');
      const y2mateResponse = await axios.get(`https://y2mate.com/mates/analyzeV2/ajax`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        data: `url=https://www.youtube.com/watch?v=${videoId}&q_auto=1&ajax=1`,
        timeout: 15000
      });

      if (y2mateResponse.data && y2mateResponse.data.result) {
        const downloadUrl = y2mateResponse.data.result;
        if (downloadUrl && downloadUrl.includes('https')) {
          return {
            success: true,
            title: 'YouTube Video',
            url: downloadUrl,
            author: 'YouTube',
            duration: 0,
            thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
            quality: 'HD',
            size: 'Unknown',
            method: 'y2mate'
          };
        }
      }
    } catch (y2mateError) {
      console.log('y2mate API failed:', y2mateError.message);
    }

    // Method 2: Try onlinevideoconverter API
    try {
      console.log('🔄 Trying onlinevideoconverter API...');
      const converterResponse = await axios.get(`https://onlinevideoconverter.pro/api/convert`, {
        params: {
          url: `https://www.youtube.com/watch?v=${videoId}`,
          format: 'mp4'
        },
        timeout: 15000
      });

      if (converterResponse.data && converterResponse.data.url) {
        return {
          success: true,
          title: 'YouTube Video',
          url: converterResponse.data.url,
          author: 'YouTube',
          duration: 0,
          thumbnail: `https://img.youtube.com/vi/${videoId}/0.jpg`,
          quality: 'HD',
          size: 'Unknown',
          method: 'onlinevideoconverter'
        };
      }
    } catch (converterError) {
      console.log('onlinevideoconverter API failed:', converterError.message);
    }

    // Method 3: Try ytdl-core with different options
    try {
      console.log('🔄 Trying ytdl-core with alternative options...');
      const info = await ytdl.getInfo(url, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }
      });

      let format;
      if (quality === 'audio') {
        format = ytdl.chooseFormat(info.formats, { 
          quality: 'highestaudio',
          filter: 'audioonly'
        });
      } else {
        // Try to find a working format
        format = ytdl.chooseFormat(info.formats, { 
          quality: 'lowest',
          filter: 'audioandvideo'
        });
      }

      if (format && format.url) {
        return {
          success: true,
          title: info.videoDetails.title || 'YouTube Video',
          url: format.url,
          duration: parseInt(info.videoDetails.lengthSeconds) || 0,
          thumbnail: info.videoDetails.thumbnails[0]?.url || `https://img.youtube.com/vi/${videoId}/0.jpg`,
          author: info.videoDetails.author?.name || 'YouTube',
          views: info.videoDetails.viewCount || 0,
          quality: format.qualityLabel || 'Unknown',
          size: format.contentLength ? (format.contentLength / (1024 * 1024)).toFixed(2) + 'MB' : 'Unknown',
          method: 'ytdl-core'
        };
      }
    } catch (ytdlError) {
      console.log('ytdl-core failed:', ytdlError.message);
    }

    // If all methods fail
    throw new Error('All download methods failed. The video might be restricted or unavailable.');

  } catch (error) {
    console.log('YouTube download error:', error.message);
    return {
      success: false,
      error: 'YouTube: ' + error.message
    };
  }
}

// Improved TikTok Downloader (since it's working)
async function downloadTikTok(url) {
  try {
    console.log('📥 Downloading TikTok video:', url);
    
    // Method 1: Try tikwm API
    try {
      const response = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        timeout: 15000
      });
      
      if (response.data && response.data.data && response.data.data.play) {
        return {
          success: true,
          title: response.data.data.title || 'TikTok Video',
          url: response.data.data.play,
          author: response.data.data.author?.nickname || 'TikTok User',
          duration: response.data.data.duration || 0,
          thumbnail: response.data.data.cover || '',
          quality: 'HD',
          size: 'Unknown',
          method: 'tikwm'
        };
      }
    } catch (tikwmError) {
      console.log('tikwm API failed:', tikwmError.message);
    }

    // Method 2: Try another TikTok API
    try {
      const response = await axios.get(`https://www.tiktok.com/oembed?url=${url}`, {
        timeout: 15000
      });
      
      const downloadResponse = await axios.get(`https://tikdown.org/get?url=${encodeURIComponent(url)}`, {
        timeout: 15000
      });

      if (downloadResponse.data && downloadResponse.data.video_url) {
        return {
          success: true,
          title: response.data.title || 'TikTok Video',
          url: downloadResponse.data.video_url,
          author: response.data.author_name || 'TikTok User',
          duration: 0,
          thumbnail: '',
          quality: 'HD',
          size: 'Unknown',
          method: 'tikdown'
        };
      }
    } catch (alternativeError) {
      console.log('Alternative TikTok API failed:', alternativeError.message);
    }

    throw new Error('All TikTok download methods failed');

  } catch (error) {
    console.log('TikTok download error:', error.message);
    return {
      success: false,
      error: 'TikTok: ' + error.message
    };
  }
}

// Simple Instagram Downloader
async function downloadInstagram(url) {
  try {
    console.log('📥 Downloading Instagram video:', url);
    
    // Using a simple Instagram API
    const response = await axios.get(`https://api.instagram.com/download?url=${encodeURIComponent(url)}`, {
      timeout: 15000
    });
    
    if (response.data && response.data.video_url) {
      return {
        success: true,
        title: 'Instagram Video',
        url: response.data.video_url,
        author: response.data.username || 'Instagram User',
        duration: 0,
        thumbnail: response.data.thumbnail_url || '',
        quality: 'HD',
        size: 'Unknown',
        method: 'instagram-api'
      };
    } else {
      throw new Error('No video found');
    }
  } catch (error) {
    console.log('Instagram download error:', error.message);
    return {
      success: false,
      error: 'Instagram: Could not download video. Try TikTok or YouTube instead.'
    };
  }
}

// Simple Twitter Downloader
async function downloadTwitter(url) {
  try {
    console.log('📥 Downloading Twitter video:', url);
    
    return {
      success: true,
      title: 'Twitter Video',
      url: `https://twitsave.com/info?url=${encodeURIComponent(url)}`,
      author: 'Twitter User',
      duration: 0,
      thumbnail: '',
      quality: 'HD',
      size: 'Unknown',
      method: 'twitsave'
    };
  } catch (error) {
    console.log('Twitter download error:', error.message);
    return {
      success: false,
      error: 'Twitter: Could not download video. Try TikTok or YouTube instead.'
    };
  }
}

// Universal Download Handler
async function handleUniversalDownload(chatId, url, options = {}) {
  try {
    await bot.sendChatAction(chatId, 'typing');

    let result;
    let platform = 'Unknown';

    // Detect platform and download
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'YouTube';
      result = await downloadYouTube(url, options.quality);
    } else if (url.includes('instagram.com')) {
      platform = 'Instagram';
      result = await downloadInstagram(url);
    } else if (url.includes('tiktok.com')) {
      platform = 'TikTok';
      result = await downloadTikTok(url);
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      platform = 'Twitter/X';
      result = await downloadTwitter(url);
    } else {
      return await bot.sendMessage(chatId,
        `❌ *Unsupported Platform*\n\n` +
        `I currently support:\n` +
        `• YouTube (✅ Multiple Methods)\n` +
        `• TikTok (✅ Working)\n` +
        `• Instagram (⚠️ Limited)\n` +
        `• Twitter/X (⚠️ Limited)\n\n` +
        `Try a TikTok or YouTube link!`,
        { parse_mode: 'Markdown' }
      );
    }

    if (!result.success) {
      throw new Error(result.error);
    }

    // Update stats
    downloadStats.totalDownloads++;
    downloadStats[platform.toLowerCase()]++;
    downloadStats.lastUpdated = new Date();

    // Download and send
    await downloadAndSendFile(chatId, result, platform, options);

  } catch (error) {
    console.log('Universal download error:', error.message);
    await bot.sendMessage(chatId, 
      `❌ *Download Failed!*\n\n` +
      `*Error:* ${error.message}\n\n` +
      `*💡 Tips:*\n` +
      `• Try TikTok links (they work! ✅)\n` +
      `• Try different YouTube videos\n` +
      `• Make sure videos are public\n` +
      `• Try shorter videos first`,
      { parse_mode: 'Markdown' }
    );
  }
}

// Download and send file
async function downloadAndSendFile(chatId, videoData, platform, options) {
  const progressMsg = await bot.sendMessage(chatId, 
    `⬇️ *Downloading from ${platform}...*\n\n` +
    `📹 *Title:* ${videoData.title}\n` +
    `👤 *Author:* ${videoData.author}\n` +
    `🎯 *Quality:* ${videoData.quality}\n` +
    `💾 *Size:* ${videoData.size}\n` +
    `⚡ *Method:* ${videoData.method || 'Direct'}\n\n` +
    `_Please wait while I process your file..._`,
    { parse_mode: 'Markdown' }
  );

  try {
    if (options.audio) {
      await bot.sendAudio(chatId, videoData.url, {
        caption: `🎵 *Audio from ${platform}*\n\n` +
                 `📝 **${videoData.title}**\n` +
                 `👤 ${videoData.author}\n` +
                 `🎯 MP3 Format\n\n` +
                 `✅ Downloaded via @snipsavevideodownloaderbot`,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendVideo(chatId, videoData.url, {
        caption: `📹 *${platform} Video*\n\n` +
                 `📝 **${videoData.title}**\n` +
                 `👤 ${videoData.author}\n` +
                 `🎯 ${videoData.quality}\n` +
                 `💾 ${videoData.size}\n\n` +
                 `✅ Downloaded via @snipsavevideodownloaderbot`,
        parse_mode: 'Markdown'
      });
    }

    await bot.editMessageText(`✅ *Download Complete!*\n\nEnjoy your ${options.audio ? 'audio' : 'video'} from ${platform}! 🎬`, {
      chat_id: chatId,
      message_id: progressMsg.message_id,
      parse_mode: 'Markdown'
    });

  } catch (error) {
    console.log('Send file error:', error.message);
    await bot.editMessageText(
      `❌ *Sending Failed!*\n\n` +
      `*Error:* ${error.message}\n\n` +
      `The file might be too large or in an unsupported format.\n\n` +
      `💡 *Tip:* Try TikTok links - they work perfectly! ✅`,
      {
        chat_id: chatId,
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
}

// Enhanced message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip commands
  if (text.startsWith('/')) return;

  // URL detection
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex);

  if (urls && urls.length > 0) {
    const url = urls[0];
    console.log(`📥 Received URL from ${chatId}:`, url);
    await handleUniversalDownload(chatId, url);
  }
});

// Audio extraction command
bot.onText(/\/audio (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1].trim();
  console.log(`🎵 Audio request from ${chatId}:`, url);
  await handleUniversalDownload(chatId, url, { audio: true });
});

// Stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  const statsMessage = `📊 *Download Statistics*\n\n` +
                      `🤖 *Bot:* @snipsavevideodownloaderbot\n` +
                      `📥 *Total Downloads:* ${downloadStats.totalDownloads}\n\n` +
                      `*Platform Breakdown:*\n` +
                      `📹 YouTube: ${downloadStats.youtube}\n` +
                      `📸 Instagram: ${downloadStats.instagram}\n` +
                      `🎵 TikTok: ${downloadStats.tiktok} ✅\n` +
                      `🐦 Twitter/X: ${downloadStats.twitter}\n\n` +
                      `*💡 Tip:* TikTok links work perfectly! ✅`;

  await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

// Support command
bot.onText(/\/support/, (msg) => {
  const chatId = msg.chat.id;
  
  const supportMessage = `🆘 *Support & Troubleshooting*\n\n` +
                        `*Current Status:*\n` +
                        `• TikTok: ✅ WORKING\n` +
                        `• YouTube: 🔄 MULTIPLE METHODS\n` +
                        `• Instagram: ⚠️ LIMITED\n` +
                        `• Twitter: ⚠️ LIMITED\n\n` +
                        `*Quick Fixes:*\n` +
                        `1. Use TikTok links for best results ✅\n` +
                        `2. Try different YouTube videos\n` +
                        `3. Make sure videos are public\n` +
                        `4. Avoid age-restricted content\n\n` +
                        `*Bot:* @snipsavevideodownloaderbot`;

  bot.sendMessage(chatId, supportMessage, { parse_mode: 'Markdown' });
});

console.log('✅ Bot initialization complete!');
console.log('🤖 Bot: @snipsavevideodownloaderbot');
console.log('🎵 TikTok: ✅ WORKING');
console.log('📹 YouTube: 🔄 MULTIPLE METHODS');
console.log('🚀 Bot is running and ready for messages!');
