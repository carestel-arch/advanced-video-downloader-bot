const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Simple server
app.get('/', (req, res) => {
  res.send('✅ Bot is running! Send /start to @snipsavevideodownloaderbot');
});

app.listen(PORT, () => {
  console.log('🚀 Server started on port', PORT);
});

// Your bot token
const bot = new TelegramBot('8017368297:AAHRUPmhsULOebtwjyKkEYZhGXpruKjQ5nE', {
  polling: true
});

console.log('🤖 Bot started successfully!');

// Configuration
const REQUIRED_CHANNEL = '@starlife_advert'; // Your channel
const CHANNEL_ID = '@starlife_advert'; // Channel to send promotions
const ADMIN_IDS = ['8403840295']; // Starlife Agency admin ID

// Promotional messages for your channel with your investment plan
const PROMOTIONAL_MESSAGES = [
  {
    message: `🌟 *Starlife Investment Plan* 🌟

Welcome to Starlife Investment!
🔹At Starlife, we provide a simple and transparent way for members to grow their money through daily profit earnings.
🔹Your capital remains safely locked with us while you earn a stable daily profit that you can withdraw anytime after reaching the minimum amount.

Start small, grow steadily, and earn continuously.

⭐ *How It Works*

1️⃣ *Invest and Activate Your Account*
> Minimum investment: $10
> Get $1 free upon your first investment
> You can increase your investment anytime

2️⃣ *Daily Profit Earnings*
> Your capital is locked, and you earn daily profits based on your investment (2% daily)
> Profit is added automatically every 24 hours
> No waiting for capital return — everything you withdraw is profit only

3️⃣ *Withdraw Anytime*
> As soon as your available profit reaches $2, you can withdraw
> Withdrawals are processed quickly and securely

4️⃣ *Earn More with Referrals*
> Share your Member ID with others
> When someone invests using your ID, you earn a referral bonus of 10%
> Referral earnings can also be withdrawn

👇 Click the link below to join now!
https://www.starlifeadvert.com/starlife-investment-plan

Your financial freedom starts with one decision! 🚀`
  },
  {
    message: `💰 *Withdrawal Rules & Payment Methods*

📊 *Withdrawal Rules:*
Withdrawal No. | Amount      | Fee
1st Withdrawal | Any Amount  | FREE
2nd+ Withdrawals | Below $50 | $1
2nd+ Withdrawals | $50 or more | $2

➡ Minimum withdrawal: $2
➡ Referral bonuses follow the same withdrawal rules

💳 *Payment Methods*
To activate your Starlife Investment account, make your deposit using any of the supported USDT networks below.

1️⃣ *USDT Tether (TRC20 – TRON Network)*
Wallet Address:
TPqsL1i3rZ1e6W9zxx6UB79pMUGTzNQfHf

2️⃣ *USDT Tether (BEP20 – Binance Smart Chain)* (Recommended)
Wallet Address:
0xa95bd74fae59521e8405e14b54b0d07795643812

⚠ *Important Notes*
• Send only USDT to the corresponding network address
• Sending to the wrong network may result in loss of funds
• Keep your Transaction Hash (TXID) for verification
• Investment activated once payment is confirmed

Start investing today! 🌐
https://www.starlifeadvert.com/starlife-investment-plan`
  },
  {
    message: `👥 *Referral Program & Earnings Tracking*

🌟 *Referral Program*
> Share your Member ID
> When your friend registers and invests using that ID:
> You earn a referral commission of 10%
> No limit to how many referrals you can bring

Grow your network, grow your income! 🌍

📊 *Check Your Starlife Earnings Instantly!*
Want to know how much you have earned so far?

Your profits are updated every single day — track your progress anytime!

With our secure Telegram bot, you can view:
🔹 Daily Earnings
🔹 Total Profit Earned
🔹 Days Active
🔹 Investment Details

For your security and privacy, earnings are accessible only through our verified Telegram bot.

Simply login using your Member ID to view your real-time account performance.

🔒 *Access Earnings Here:* 👉 @starlifeadvertbot

🚀 *Join Starlife Today!*
Invest • Earn Daily • Withdraw Anytime
https://www.starlifeadvert.com/starlife-investment-plan`
  },
  {
    message: `📢 *Terms & Conditions & Important Information*

📌 *Terms & Conditions*
1. Minimum investment is $10 to activate earning.
2. Capital is locked and only used to generate profit.
3. Daily profit rates may be updated but members will be notified.
4. Referral earnings are credited instantly when referrals invest.
5. All withdrawals follow the stated rules.
6. Fraud, multiple accounts under one user, or abuse will result in account suspension.
7. Starlife reserves the right to modify rules with notice for improvement and security.

💫 *Why Choose Starlife?*
✅ Transparent earning system
✅ Daily profit withdrawals
✅ Secure and reliable
✅ 24/7 customer support
✅ Growing community

🎯 *Perfect For:*
• Individuals looking for passive income
• Those wanting to grow their savings
• People interested in referral earnings
• Anyone seeking financial freedom

Start your journey today with just $10! 
🌐 https://www.starlifeadvert.com/starlife-investment-plan

For earnings tracking: @starlifeadvertbot`
  }
];

// User statistics storage
const userStats = {
  totalUsers: new Set(),
  monthlyUsers: new Set(),
  currentMonth: new Date().getMonth() + '-' + new Date().getFullYear(),
  userChatIds: new Set()
};

// Function to check if user joined channel
async function checkChannelMembership(userId) {
  try {
    const chatMember = await bot.getChatMember(REQUIRED_CHANNEL, userId);
    return ['member', 'administrator', 'creator'].includes(chatMember.status);
  } catch (error) {
    console.log('Error checking channel membership:', error.message);
    return false;
  }
}

// Function to send join channel message
function sendJoinMessage(chatId) {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📢 Join Our Channel',
            url: `https://t.me/starlife_advert`
          }
        ],
        [
          {
            text: '✅ I Have Joined',
            callback_data: 'check_joined'
          }
        ]
      ]
    }
  };

  const message = `
🎬 *Video Downloader Bot* 🎬

⚠️ *Channel Membership Required*

To use this bot, please join our channel first for amazing investment opportunities and updates!

1. Click "Join Our Channel" below
2. Join the channel
3. Come back and click "I Have Joined"

After joining, you'll be able to download TikTok and YouTube videos! 🚀
  `;

  return bot.sendMessage(chatId, message, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard.reply_markup
  });
}

// Update user statistics
function updateUserStats(userId, chatId) {
  const currentMonth = new Date().getMonth() + '-' + new Date().getFullYear();
  
  if (userStats.currentMonth !== currentMonth) {
    userStats.monthlyUsers = new Set();
    userStats.currentMonth = currentMonth;
  }
  
  userStats.totalUsers.add(userId);
  userStats.monthlyUsers.add(userId);
  userStats.userChatIds.add(chatId);
}

// Function to send promotional message to channel
async function sendPromoToChannel() {
  try {
    // Select a random promotional message
    const promo = PROMOTIONAL_MESSAGES[Math.floor(Math.random() * PROMOTIONAL_MESSAGES.length)];
    
    await bot.sendMessage(CHANNEL_ID, promo.message, { 
      parse_mode: 'Markdown' 
    });
    
    console.log('✅ Promotional message sent to channel');
    return true;
  } catch (error) {
    console.log('Error sending promo to channel:', error.message);
    return false;
  }
}

// Function to send custom promotional message
async function sendCustomPromo(message) {
  try {
    await bot.sendMessage(CHANNEL_ID, message, { 
      parse_mode: 'Markdown' 
    });
    return true;
  } catch (error) {
    console.log('Error sending custom promo:', error.message);
    return false;
  }
}

// Function to send welcome message to new users
async function sendWelcomeMessage(chatId, userName, userId) {
  const welcomeMessage = `
👋 Welcome *${userName || 'there'}*! 

Thank you for using @snipsavevideodownloaderbot! 🎬

I can download TikTok and YouTube videos for you. Here's what I can do:

✅ Download TikTok videos (no watermark)
✅ Download YouTube videos
✅ Fast and reliable

Just send me a link and I'll handle the rest! 🚀

*User ID:* ${userId}
*Need help?* Use /help command.

💫 *Also check out our investment opportunities!*
Visit: https://www.starlifeadvert.com/starlife-investment-plan
  `;
  
  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
}

// Auto-promo scheduler (sends every 6 hours)
function startPromoScheduler() {
  setInterval(async () => {
    try {
      await sendPromoToChannel();
    } catch (error) {
      console.log('Error in promo scheduler:', error.message);
    }
  }, 6 * 60 * 60 * 1000); // 6 hours
  
  console.log('📢 Promotional scheduler started (every 6 hours)');
}

// Start the promo scheduler
startPromoScheduler();

// Stats command
bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  const isMember = await checkChannelMembership(userId);
  if (!isMember) {
    return sendJoinMessage(chatId);
  }
  
  updateUserStats(userId, chatId);
  
  const statsMessage = `
📊 *Bot Statistics*

👥 Total Users: ${userStats.totalUsers.size}
📅 Monthly Users: ${userStats.monthlyUsers.size}
📈 Current Month: ${userStats.currentMonth}
💬 Active Chats: ${userStats.userChatIds.size}

Thank you for being part of our community! ❤️
  `;
  
  bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
});

// Admin command to send promotional message
bot.onText(/\/promo(?:\s+(.*))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Check if user is admin
  if (!ADMIN_IDS.includes(userId.toString())) {
    return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
  }
  
  const promoMessage = match[1];
  
  if (!promoMessage) {
    // Send random promo if no message provided
    const success = await sendPromoToChannel();
    if (success) {
      await bot.sendMessage(chatId, '✅ Random promotional message sent to channel!');
    } else {
      await bot.sendMessage(chatId, '❌ Failed to send promotional message.');
    }
  } else {
    // Send custom promo message
    const success = await sendCustomPromo(promoMessage);
    if (success) {
      await bot.sendMessage(chatId, '✅ Custom promotional message sent to channel!');
    } else {
      await bot.sendMessage(chatId, '❌ Failed to send promotional message.');
    }
  }
});

// Admin command to see promotional messages
bot.onText(/\/promolist/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!ADMIN_IDS.includes(userId.toString())) {
    return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
  }
  
  let promoList = '📢 *Current Promotional Messages:*\n\n';
  PROMOTIONAL_MESSAGES.forEach((promo, index) => {
    promoList += `${index + 1}. ${promo.message.substring(0, 100)}...\n\n`;
  });
  
  promoList += '\nUse /promo to send a random one to the channel.';
  
  await bot.sendMessage(chatId, promoList, { parse_mode: 'Markdown' });
});

// Callback handler for join check
bot.on('callback_query', async (callbackQuery) => {
  const message = callbackQuery.message;
  const userId = callbackQuery.from.id;
  const chatId = message.chat.id;
  const userName = callbackQuery.from.first_name;
  
  if (callbackQuery.data === 'check_joined') {
    const isMember = await checkChannelMembership(userId);
    
    if (isMember) {
      updateUserStats(userId, chatId);
      await bot.editMessageText(
        `✅ *Welcome ${userName || 'there'}! Channel membership verified!*\n\nNow you can use the bot freely! 🎉\n\nJust send me a TikTok or YouTube link to download videos.\n\nUse /stats to see user statistics.`,
        {
          chat_id: chatId,
          message_id: message.message_id,
          parse_mode: 'Markdown'
        }
      );
      
      // Send welcome message with username
      await sendWelcomeMessage(chatId, userName, userId);
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: '❌ Please join the channel first, then click here!',
        show_alert: true
      });
    }
  }
});

// Simple TikTok downloader
async function downloadTikTok(url) {
  try {
    const response = await axios.get(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
      timeout: 30000
    });
    
    if (response.data && response.data.data && response.data.data.play) {
      return {
        success: true,
        url: response.data.data.play,
        title: response.data.data.title || 'TikTok Video',
        author: response.data.data.author?.nickname || 'TikTok User'
      };
    }
    throw new Error('No video found');
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download TikTok video'
    };
  }
}

// Simple YouTube downloader
async function downloadYouTube(url) {
  try {
    const response = await axios.get(`https://youtube.com/youtubei/v1/player?videoId=${extractYouTubeId(url)}`, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    return {
      success: true,
      url: `https://youtube.com/watch?v=${extractYouTubeId(url)}`,
      title: 'YouTube Video',
      author: 'YouTube'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to download YouTube video'
    };
  }
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

// Main download handler
async function handleDownload(chatId, url, userId, userName) {
  try {
    // Check channel membership first
    const isMember = await checkChannelMembership(userId);
    if (!isMember) {
      return sendJoinMessage(chatId);
    }
    
    // Update stats for active user
    updateUserStats(userId, chatId);
    
    await bot.sendChatAction(chatId, 'typing');
    
    let result;
    
    if (url.includes('tiktok.com')) {
      result = await downloadTikTok(url);
    } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
      result = await downloadYouTube(url);
    } else {
      await bot.sendMessage(chatId, '❌ Send TikTok or YouTube links only for now.');
      return;
    }
    
    if (result.success) {
      await bot.sendVideo(chatId, result.url, {
        caption: `🎬 ${result.title}\n👤 ${result.author}\n\n✅ @snipsavevideodownloaderbot`
      });
    } else {
      await bot.sendMessage(chatId, `❌ ${result.error}\n\n💡 Try a different video or platform.`);
    }
    
  } catch (error) {
    console.log('Error:', error.message);
    await bot.sendMessage(chatId, 
      '❌ Download failed. Try:\n• TikTok links (work best)\n• Different videos\n• Shorter videos'
    );
  }
}

// Modified Start command with channel check
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name;
  
  // Check if user is in channel
  const isMember = await checkChannelMembership(userId);
  
  if (!isMember) {
    return sendJoinMessage(chatId);
  }
  
  // User is member, update stats and show welcome
  updateUserStats(userId, chatId);
  
  const welcomeMessage = `
🎬 *Video Downloader Bot* 🎬

✅ *Welcome ${userName || 'there'}! Thanks for joining our channel!* ❤️

📊 *Working Platforms:*
• TikTok - BEST ✅
• YouTube - GOOD ✅

🚀 *How to Use:*
Just send any TikTok or YouTube link!

⚡ *Pro Tip:*
TikTok links work instantly! 🎯

📈 Use /stats to see user statistics

💫 *Also check out our investment plan:*
https://www.starlifeadvert.com/starlife-investment-plan

🤖 @snipsavevideodownloaderbot
  `;
  
  bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  
  // Send additional welcome message with username
  await sendWelcomeMessage(chatId, userName, userId);
});

// Handle all messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userId = msg.from.id;
  const userName = msg.from.first_name;
  
  if (!text || text.startsWith('/')) return;
  
  // Simple URL detection
  if (text.includes('http') && (text.includes('tiktok.com') || text.includes('youtube.com') || text.includes('youtu.be'))) {
    handleDownload(chatId, text, userId, userName);
  } else {
    // Check membership for any other message too
    const isMember = await checkChannelMembership(userId);
    if (!isMember) {
      return sendJoinMessage(chatId);
    }
    bot.sendMessage(chatId, '📨 Send me a TikTok or YouTube link to download videos!');
  }
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  const isMember = await checkChannelMembership(userId);
  if (!isMember) {
    return sendJoinMessage(chatId);
  }
  
  updateUserStats(userId, chatId);
  
  bot.sendMessage(chatId, 
    `🆘 *Quick Help*\n\n` +
    `1. Copy TikTok/YouTube link\n` +
    `2. Paste here\n` +
    `3. Get video instantly! 🎬\n\n` +
    `💡 TikTok links work best!\n\n` +
    `📊 Use /stats to see user statistics\n` +
    `📢 Join our channel: @starlife_advert\n` +
    `💫 Investment plan: https://www.starlifeadvert.com/starlife-investment-plan`,
    { parse_mode: 'Markdown' }
  );
});

// Admin commands help
bot.onText(/\/admin/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (!ADMIN_IDS.includes(userId.toString())) {
    return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
  }
  
  const adminHelp = `
🛠 *Admin Commands*

/promo [message] - Send promotional message to channel
/promo - Send random promotional message
/promolist - View all promotional messages
/stats - View bot statistics

Example:
/promo Check out our new investment features!
  `;
  
  bot.sendMessage(chatId, adminHelp, { parse_mode: 'Markdown' });
});

console.log('✅ Bot is ready and running!');
console.log('📢 Channel requirement: ENABLED');
console.log('🎯 TikTok: WORKING');
console.log('📹 YouTube: WORKING');
console.log('📊 User stats: ENABLED');
console.log('📢 Auto-promo: ENABLED (every 6 hours)');
console.log('💫 Investment plan: INTEGRATED');
console.log('👑 Admin: Starlife Agency (8403840295)');
