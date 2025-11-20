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
        author: response.data.username || 'Instagram User',
        duration: 0,
        thumbnail: response.data.thumbnail_url || '',
        quality: 'HD',
        size: 'Unknown'
      };
    } else {
      throw new Error('No video found in response');
    }
  } catch (error) {
    console.log('Instagram download error:', error.message);
    return {
      success: false,
      error: 'Instagram: Service temporarily unavailable. Try YouTube instead.'
    };
  }
}

// TikTok Downloader
async function downloadTikTok(url) {
  try {
    console.log('📥 Downloading TikTok video:', url);
    
    // Using TikTok download API
    const response = await axios.get(`https://www.tiktok.com/oembed?url=${url}`, {
      timeout: 10000
    });
    
    // Use a TikTok download service
    const downloadResponse = await axios.get(`https://tikwm.com/api?url=${encodeURIComponent(url)}`, {
      timeout: 15000
    });
    
    if (downloadResponse.data && downloadResponse.data.data && downloadResponse.data.data.play) {
      return {
        success: true,
        title: response.data.title || 'TikTok Video',
        url: downloadResponse.data.data.play,
        author: response.data.author_name || 'TikTok User',
        duration: 0,
        thumbnail: downloadResponse.data.data.cover || '',
        quality: 'HD',
        size: 'Unknown'
      };
    } else {
      throw new Error('No video URL found');
    }
  } catch (error) {
    console.log('TikTok download error:', error.message);
    return {
      success: false,
      error: 'TikTok: Service temporarily unavailable. Try YouTube instead.'
    };
  }
}

// Twitter Downloader
async function downloadTwitter(url) {
  try {
    console.log('📥 Downloading Twitter video:', url);
    
    // Using external service for Twitter
    const response = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
      timeout: 10000
    });
    
    if (response.data && response.data.videos) {
      const highestQuality = response.data.videos.reduce((prev, current) => 
        (prev.quality > current.quality) ? prev : current
      );
      
      return {
        success: true,
        title: 'Twitter Video',
        url: highestQuality.url,
        author: response.data.author || 'Twitter User',
        duration: 0,
        thumbnail: response.data.thumbnail || '',
        quality: highestQuality.quality,
        size: 'Unknown'
      };
    } else {
      throw new Error('No video found');
    }
  } catch (error) {
    console.log('Twitter download error:', error.message);
    return {
      success: false,
      error: 'Twitter: Could not download video. Try another link.'
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
        `• YouTube (✅ Reliable)\n` +
        `• Instagram (⚠️ Limited)\n` +
        `• TikTok (⚠️ Limited)\n` +
        `• Twitter/X (⚠️ Limited)\n\n` +
        `Try a YouTube link for best results!`,
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

    // Send quality options for YouTube
    if (platform === 'YouTube' && !options.quality) {
      return await sendQualityOptions(chatId, url, result);
    }

    // Download and send
    await downloadAndSendFile(chatId, result, platform, options);

  } catch (error) {
    console.log('Universal download error:', error.message);
    await bot.sendMessage(chatId, 
      `❌ *Download Failed!*\n\n` +
      `*Error:* ${error.message}\n\n` +
      `*💡 Tip:* Try using YouTube links for most reliable downloads`,
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
    `💾 *Size:* ${videoData.size}\n\n` +
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
                 `✅ Downloaded successfully!`,
        parse_mode: 'Markdown'
      });
    } else {
      await bot.sendVideo(chatId, videoData.url, {
        caption: `📹 *${platform} Video*\n\n` +
                 `📝 **${videoData.title}**\n` +
                 `👤 ${videoData.author}\n` +
                 `🎯 ${videoData.quality}\n` +
                 `💾 ${videoData.size}\n\n` +
                 `✅ Downloaded successfully!`,
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
      `The file might be too large or in an unsupported format.`,
      {
        chat_id: chatId,
        message_id: progressMsg.message_id,
        parse_mode: 'Markdown'
      }
    );
  }
}

// Send quality options for YouTube
async function sendQualityOptions(chatId, url, videoData) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: '🎯 Highest Quality', callback_data: `quality_${url}_highest` },
        { text: '⚡ Balanced', callback_data: `quality_${url}_medium` }
      ],
      [
        { text: '📱 Mobile Friendly', callback_data: `quality_${url}_low` },
        { text: '🎵 Audio Only', callback_data: `audio_${url}` }
      ]
    ]
  };

  await bot.sendMessage(chatId,
    `🎬 *Quality Selection for YouTube*\n\n` +
    `📹 *Title:* ${videoData.title}\n` +
    `⏱️ *Duration:* ${formatDuration(videoData.duration)}\n` +
    `👤 *Channel:* ${videoData.author}\n\n` +
    `*Choose your preferred quality:*`,
    {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    }
  );
}

// Handle callback queries (quality selection)
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  if (data.startsWith('quality_')) {
    const parts = data.split('_');
    const url = parts[1];
    const quality = parts[2];
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await handleUniversalDownload(message.chat.id, url, { quality });
    
  } else if (data.startsWith('audio_')) {
    const url = data.split('_')[1];
    
    await bot.answerCallbackQuery(callbackQuery.id);
    await handleUniversalDownload(message.chat.id, url, { audio: true });
  }
});

// Activity logging function
function logActivity(chatId, username, action, platform = 'unknown') {
  const timestamp = new Date().toISOString();
  console.log(`📝 Activity: ${action} | User: @${username} | Platform: ${platform} | Chat: ${chatId} | Time: ${timestamp}`);
}

function detectPlatform(url) {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  return 'unknown';
}

// Enhanced message handler with logging
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  const text = msg.text;

  // Skip commands
  if (text.startsWith('/')) return;

  // Improved URL detection
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex);

  if (urls && urls.length > 0) {
    const url = urls[0];
    logActivity(chatId, username, 'download_request', detectPlatform(url));
    await handleUniversalDownload(chatId, url);
  }
});

// Audio extraction command
bot.onText(/\/audio (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = match[1].trim();
  const username = msg.from.username || 'unknown';
  
  logActivity(chatId, username, 'audio_request', detectPlatform(url));
  await handleUniversalDownload(chatId, url, { audio: true });
});

// Stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  
  logActivity(chatId, username, 'stats_request');
  
  const statsMessage = `📊 *Download Statistics*\n\n` +
                      `📥 *Total Downloads:* ${downloadStats.totalDownloads}\n\n` +
                      `*Platform Breakdown:*\n` +
                      `📹 YouTube: ${downloadStats.youtube}\n` +
                      `📸 Instagram: ${downloadStats.instagram}\n` +
                      `🎵 TikTok: ${downloadStats.tiktok}\n` +
                      `🐦 Twitter/X: ${downloadStats.twitter}\n\n` +
                      `*Last Updated:* ${downloadStats.lastUpdated.toLocaleString()}\n\n` +
                      `*💡 Tip:* YouTube links work most reliably!`;

  await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

// Support command
bot.onText(/\/support/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  
  logActivity(chatId, username, 'support_request');
  
  const supportMessage = `🆘 *Support & Troubleshooting*\n\n` +
                        `*Common Issues:*\n\n` +
                        `❌ *Download fails:*\n` +
                        `• Make sure video is public\n` +
                        `• Try different quality setting\n` +
                        `• Use shorter videos first\n\n` +
                        `❌ *Video too large:*\n` +
                        `• Use /audio for audio only\n` +
                        `• Choose lower quality\n\n` +
                        `❌ *Platform not working:*\n` +
                        `• YouTube: Always works ✅\n` +
                        `• Instagram: Limited support ⚠️\n` +
                        `• TikTok: Limited support ⚠️\n` +
                        `• Twitter: Limited support ⚠️\n\n` +
                        `*Need immediate help?*\n` +
                        `Try YouTube links first - they work best!`;

  bot.sendMessage(chatId, supportMessage, { parse_mode: 'Markdown' });
});

// Batch download command
bot.onText(/\/batch/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  
  logActivity(chatId, username, 'batch_request');
  
  bot.sendMessage(chatId,
    `📦 *Batch Download*\n\n` +
    `Send multiple links separated by new lines:\n\n` +
    `https://youtube.com/...\n` +
    `https://instagram.com/...\n` +
    `https://tiktok.com/...\n\n` +
    `I'll download them one by one!\n\n` +
    `*Note:* YouTube links work most reliably.`,
    { parse_mode: 'Markdown' }
  );
});

// Handle batch messages (multiple URLs)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username || 'unknown';
  const text = msg.text;

  // Skip commands and single URLs (handled above)
  if (text.startsWith('/') || text.match(/(https?:\/\/[^\s]+)/g)?.length === 1) return;

  // Check for multiple URLs
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const urls = text.match(urlRegex);

  if (urls && urls.length > 1) {
    logActivity(chatId, username, 'batch_download', `multiple_${urls.length}`);
    
    await bot.sendMessage(chatId, 
      `📦 *Starting Batch Download*\n\n` +
      `Found ${urls.length} links. Downloading one by one...`,
      { parse_mode: 'Markdown' }
    );

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < urls.length; i++) {
      try {
        await handleUniversalDownload(chatId, urls[i]);
        successCount++;
        // Add delay between downloads
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.log(`Batch download failed for ${urls[i]}:`, error.message);
        failCount++;
      }
    }

    await bot.sendMessage(chatId, 
      `✅ *Batch download completed!*\n\n` +
      `📊 Results:\n` +
      `✅ Successful: ${successCount}\n` +
      `❌ Failed: ${failCount}\n` +
      `📝 Total: ${urls.length}`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Format duration from seconds to MM:SS
function formatDuration(seconds) {
  if (!seconds) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

console.log('✅ Bot initialization complete!');
console.log('🚀 Deployment ready for Heroku + GitHub');
console.log('📹 Supported: YouTube (✅), Instagram (⚠️), TikTok (⚠️), Twitter (⚠️)');
console.log('🔧 Bot is running and ready for messages!');
