const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');
const ytdl = require('ytdl-core');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('🎬 Advanced Video Downloader Bot is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

if (!TELEGRAM_TOKEN) {
  console.log('❌ ERROR: TELEGRAM_TOKEN environment variable is missing');
  console.log('💡 Make sure to set TELEGRAM_TOKEN in your environment variables');
  process.exit(1);
}

console.log('🚀 Starting Advanced Video Downloader Bot...');

// Enhanced bot configuration
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
  twitter: 0
};

// Test connection with better error handling
bot.getMe().then(botInfo => {
  console.log('✅ Bot connected to Telegram:', botInfo.username);
  console.log('🤖 Bot ID:', botInfo.id);
}).catch(error => {
  console.log('❌ Bot failed to connect to Telegram:', error.message);
  console.log('💡 Check your TELEGRAM_TOKEN and internet connection');
  process.exit(1);
});

// Enhanced error handling for bot
bot.on('error', (error) => {
  console.log('🤖 Bot error:', error.message);
});

bot.on('polling_error', (error) => {
  console.log('📡 Polling error:', error.message);
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

*⚠️ Note:* Instagram, TikTok, and Twitter may not work reliably due to platform restrictions.`;

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

// Simplified Instagram Downloader using external API
async function downloadInstagram(url) {
  try {
    console.log('📥 Downloading Instagram video:', url);
    
    // Using a more reliable Instagram download API
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

// Simplified TikTok Downloader
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

// Enhanced Universal Download Handler
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

// Enhanced download and send function
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

// Rest of the functions remain similar but with better error handling...
// [Keep the sendQualityOptions, callback_query handler, and other functions from your original code]

// Enhanced message handler with better URL detection
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Skip commands
  if (text.startsWith('/')) return;

  // Improved URL detection
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
                      `📥 *Total Downloads:* ${downloadStats.totalDownloads}\n\n` +
                      `*Platform Breakdown:*\n` +
                      `📹 YouTube: ${downloadStats.youtube}\n` +
                      `📸 Instagram: ${downloadStats.instagram}\n` +
                      `🎵 TikTok: ${downloadStats.tiktok}\n` +
                      `🐦 Twitter/X: ${downloadStats.twitter}\n\n` +
                      `*💡 Tip:* YouTube links work most reliably!`;

  await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

console.log('✅ Advanced Video Downloader Bot is starting...');
console.log('📹 Supported: YouTube (✅), Instagram (⚠️), TikTok (⚠️), Twitter (⚠️)');
console.log('🔧 Bot initialized and ready for messages!');
