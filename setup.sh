#!/bin/bash

echo "🚀 Ironclad Support Bot Setup"
echo "============================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo ""
    echo "⚠️  Please edit .env and add your Slack credentials:"
    echo "   - SLACK_BOT_TOKEN"
    echo "   - SLACK_APP_TOKEN"
    echo "   - SLACK_SIGNING_SECRET"
    echo "   - IRONCLAD_CHANNEL_ID"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Slack credentials"
echo "2. Run 'npm run dev' to start in development mode"
echo "3. Or 'npm start' for production mode"
