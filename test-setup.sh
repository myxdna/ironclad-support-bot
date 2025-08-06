#!/bin/bash

echo "🧪 Ironclad Support Bot Test Mode Setup"
echo "======================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file for test mode..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📝 Next Steps for Testing in #revbot:"
echo ""
echo "1. Get the #revbot channel ID:"
echo "   - In Slack, right-click on #revbot"
echo "   - Select 'View channel details'"
echo "   - Copy the Channel ID (starts with C)"
echo ""
echo "2. Edit .env file and add:"
echo "   IRONCLAD_CHANNEL_ID=<your-revbot-channel-id>"
echo ""
echo "3. Add your Slack tokens to .env:"
echo "   SLACK_BOT_TOKEN=xoxb-..."
echo "   SLACK_APP_TOKEN=xapp-..."
echo "   SLACK_SIGNING_SECRET=..."
echo ""
echo "4. Install dependencies:"
echo "   npm install"
echo ""
echo "5. Run in test mode:"
echo "   npm run dev"
echo ""
echo "The bot will monitor #revbot instead of #ironclad for testing."
echo ""
echo "📖 See TEST_IN_REVBOT.md for detailed testing instructions."
