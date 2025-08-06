# Quick Setup Guide for Ironclad Support Bot

## 🚀 5-Minute Setup

### Step 1: Create Slack App

1. Visit [api.slack.com/apps](https://api.slack.com/apps)
2. Click **Create New App** → **From scratch**
3. Name: `Ironclad Support Bot`
4. Choose your workspace

### Step 2: Enable Socket Mode

1. Go to **Socket Mode** (left sidebar)
2. Toggle **Enable Socket Mode** to ON
3. Click **Generate** for App-Level Token
4. Name it: `ironclad-bot-token`
5. Add scope: `connections:write`
6. Click **Generate**
7. **Copy the token** (starts with `xapp-`) - this is your `SLACK_APP_TOKEN`

### Step 3: Set Bot Permissions

1. Go to **OAuth & Permissions** (left sidebar)
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Click **Add an OAuth Scope** and add:
   - `channels:history`
   - `channels:read`
   - `chat:write`
   - `chat:write.public`
   - `commands`
   - `reactions:write`

### Step 4: Install to Workspace

1. Scroll up to **OAuth Tokens for Your Workspace**
2. Click **Install to Workspace**
3. Review permissions and click **Allow**
4. **Copy the Bot User OAuth Token** (starts with `xoxb-`) - this is your `SLACK_BOT_TOKEN`

### Step 5: Get Signing Secret

1. Go to **Basic Information** (left sidebar)
2. Scroll to **App Credentials**
3. **Copy the Signing Secret** - this is your `SLACK_SIGNING_SECRET`

### Step 6: Add Slash Commands

1. Go to **Slash Commands** (left sidebar)
2. Click **Create New Command**
3. Add each command:

   **Command 1:**
   - Command: `/ironclad-help`
   - Request URL: `https://your-app.onrender.com/slack/events`
   - Short Description: `Search Ironclad help center`
   - Usage Hint: `[your search query]`

   **Command 2:**
   - Command: `/ironclad-bot-status`
   - Request URL: `https://your-app.onrender.com/slack/events`
   - Short Description: `Check bot status`

   **Command 3:**
   - Command: `/ironclad-bot-test`
   - Request URL: `https://your-app.onrender.com/slack/events`
   - Short Description: `Test bot search`

### Step 7: Enable Events

1. Go to **Event Subscriptions** (left sidebar)
2. Toggle **Enable Events** to ON
3. For Request URL: Use `https://your-app.onrender.com/slack/events`
4. Under **Subscribe to bot events**, add:
   - `message.channels`
5. Click **Save Changes**

### Step 8: Get Channel ID

1. In Slack, go to #ironclad channel
2. Click channel name at top
3. Scroll down to bottom
4. **Copy the Channel ID** - this is your `IRONCLAD_CHANNEL_ID`

### Step 9: Local Setup

```bash
# Clone and enter directory
cd ironclad-support-bot

# Run setup script
./setup.sh

# Edit .env file with your tokens
nano .env  # or use your favorite editor
```

Add your tokens to `.env`:
```
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_APP_TOKEN=xapp-your-token-here
SLACK_SIGNING_SECRET=your-secret-here
IRONCLAD_CHANNEL_ID=C1234567890
```

### Step 10: Test Locally

```bash
# Start the bot
npm run dev

# You should see:
# ⚡️ Ironclad Support Bot is running!
# Monitoring channel: C1234567890
```

### Step 11: Deploy to Render

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Use these settings:
   - Name: `ironclad-support-bot`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Add environment variables (same 4 from .env)
7. Click **Create Web Service**

### Step 12: Update Slack URLs

After deployment, update all URLs in Slack app settings:
1. Slash Commands: Update all Request URLs to `https://your-app.onrender.com/slack/events`
2. Event Subscriptions: Update Request URL to same

## ✅ Testing

In #ironclad channel, try:
1. Ask a question: "How do I create a workflow?"
2. Use slash command: `/ironclad-help contract templates`
3. Check status: `/ironclad-bot-status`

## 🎉 Done!

Your bot should now be responding to questions in #ironclad!
