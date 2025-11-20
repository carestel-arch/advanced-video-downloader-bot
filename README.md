# Advanced Video Downloader Bot

A Telegram bot for downloading videos from various social media platforms.

## Supported Platforms
- YouTube (✅ Reliable)
- Instagram (⚠️ Limited)
- TikTok (⚠️ Limited) 
- Twitter/X (⚠️ Limited)

## Features
- Download videos in HD quality
- Extract MP3 audio from videos
- Batch download support
- Quality selection for YouTube

## Deployment

### Heroku
1. Set `8017368297:AAHRUPmhsULOebtwjyKkEYZhGXpruKjQ5nE` environment variable
2. Deploy to Heroku
3. Bot starts automatically

### Local Development
1. Create `.env` file with `8017368297:AAHRUPmhsULOebtwjyKkEYZhGXpruKjQ5nE`
2. Run `npm install`
3. Run `npm start`

## Commands
- `/start` - Start the bot
- `/audio <url>` - Extract audio only
- `/stats` - View download statistics
- `/support` - Get help
- `/batch` - Download multiple videos
