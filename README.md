# Ironclad Support Slack Bot

A Slack bot that helps answer questions in the #ironclad channel by searching the Ironclad help center.

## Features

- 🔍 Monitors #ironclad channel for questions
- 🤖 Automatically searches Ironclad support documentation
- 🎯 Provides interactive buttons for feedback
- ✅ Marks resolved questions with a checkmark
- 💬 Slash command for manual searches
- 🛠️ Built-in troubleshooting commands

## Prerequisites

- Node.js 14+ installed
- A Slack workspace where you have admin permissions
- A Render.com account (for deployment)

## Setup Instructions

### 1. Create a New Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "Ironclad Support Bot" and select your workspace

### 2. Configure Socket Mode

1. In your app settings, go to "Socket Mode"
2. Enable Socket Mode
3. Generate an App-Level Token with `connections:write` scope
4. Save the token as `SLACK_APP_TOKEN`

### 3. Configure OAuth & Permissions

1. Go to "OAuth & Permissions"
2. Add these Bot Token Scopes:
   - `channels:history` - Read messages in public channels
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to channels bot isn't in
   - `commands` - Handle slash commands
   - `reactions:write` - Add reactions
   - `channels:read` - View basic channel info
3. Install the app to your workspace
4. Copy the Bot User OAuth Token as `SLACK_BOT_TOKEN`

### 4. Configure Slash Commands

Add these slash commands in "Slash Commands" section:

1. `/ironclad-help`
   - Description: Search Ironclad help center
   - Usage hint: [search query]

2. `/ironclad-bot-status`
   - Description: Check bot status
   - Usage hint: (no parameters)

3. `/ironclad-bot-test`
   - Description: Test bot search functionality
   - Usage hint: (no parameters)

### 5. Enable Event Subscriptions

1. Go to "Event Subscriptions"
2. Enable Events
3. Subscribe to bot events:
   - `message.channels` - Listen to public channel messages
4. Save changes

### 6. Get Your Signing Secret

1. Go to "Basic Information"
2. Copy the Signing Secret as `SLACK_SIGNING_SECRET`

### 7. Find Your Channel ID

In Slack:
1. Right-click on #ironclad channel (or #revbot for testing)
2. Select "View channel details"
3. Copy the Channel ID at the bottom

**Note**: For testing, you can use #revbot instead of #ironclad

### 8. Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
   
4. Add Environment Variables:
   - `SLACK_BOT_TOKEN` - Your bot token from step 3
   - `SLACK_APP_TOKEN` - Your app token from step 2
   - `SLACK_SIGNING_SECRET` - Your signing secret from step 6
   - `IRONCLAD_CHANNEL_ID` - Your channel ID from step 7

5. Deploy!

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your tokens:
   ```bash
   cp .env.example .env
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```

## How It Works

### Question Detection

The bot monitors the #ironclad channel and looks for messages that appear to be questions by checking for:
- Question marks (?)
- Question words (how, what, where, when, why)
- Help-related keywords (help, issue, problem, error)

### Search Process

1. When a question is detected, the bot searches the Ironclad help center
2. It tries multiple selectors to find search results (compatible with Zendesk)
3. Returns top 3 most relevant articles
4. If no results found, provides a direct search link

### User Feedback

After providing results, users can:
- Click "✅ Yes, this helped!" - Adds a checkmark to the original message
- Click "❌ No, I need more help" - Provides additional support options

## Customization

### Adjusting Question Detection

Modify the `isQuestion` logic in `index.js`:

```javascript
const isQuestion = message.text && (
  message.text.includes('?') ||
  message.text.toLowerCase().includes('how') ||
  // Add more patterns here
);
```

### Changing Search Behavior

Modify `searchIroncladSupport()` function to:
- Add more selectors for different help center formats
- Change the number of results returned
- Add caching for common queries

### Adding More Commands

Add new slash commands:

```javascript
app.command('/your-command', async ({ command, ack, client }) => {
  await ack();
  // Your logic here
});
```

## Troubleshooting

### Bot not responding

1. Check channel ID is correct
2. Ensure bot is added to the channel
3. Verify Socket Mode is enabled
4. Check environment variables are set

### Search not working

1. Test with `/ironclad-bot-test` command
2. Check if Ironclad support site structure changed
3. Review console logs for errors

### Socket Mode errors

1. Verify app token has `connections:write` scope
2. Ensure Socket Mode is enabled in app settings
3. Check network connectivity

## Differences from Revenue Bot

| Feature | Revenue Bot | Ironclad Bot |
|---------|------------|--------------|
| Purpose | Approval workflows | Q&A support |
| Monitoring | Queue channel patterns | Question detection |
| Actions | Approve/Revise buttons | Helpful/Not helpful |
| Scheduled tasks | Weekly digests | None |
| Storage | Tracks approvals | Stateless |

## Next Steps

Consider adding:
- 📊 Analytics on frequently asked questions
- 💾 Caching for common queries
- 🤖 AI-powered answer generation
- 📧 Escalation to human support
- 📚 Integration with internal knowledge base

## Support

For issues or questions about the bot:
1. Check the troubleshooting section
2. Use `/ironclad-bot-status` to check bot health
3. Review Render logs for deployment issues

## License

ISC
