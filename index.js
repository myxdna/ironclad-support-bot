const { App } = require('@slack/bolt');
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
require('dotenv').config();

// Initialize the app with Socket Mode
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Add more logging
  logLevel: 'debug'
});

// Initialize Express for health checks
const expressApp = express();
const PORT = process.env.PORT || 3000;

// Configuration
const IRONCLAD_CHANNEL = process.env.IRONCLAD_CHANNEL_ID || 'revbot';
const IRONCLAD_GPT_URL = 'https://chatgpt.com/g/g-68a4e4694ec081919dae9c71556775c7-ironclad-assistant';

console.log(`[CONFIG] Bot will monitor channel: ${IRONCLAD_CHANNEL}`);

// Format response for Slack
function formatResponse(query) {
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `I can help you with that! For the best answers to Ironclad questions, please use our dedicated AI assistant:`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🤖 <${IRONCLAD_GPT_URL}|*Ironclad Assistant GPT*>\n\nThis AI assistant has been trained on all our Ironclad workflows, processes, and common questions.`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Your question:* "${query}"\n\nCopy this question and paste it into the Ironclad Assistant for an immediate answer!`
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ This helped!'
            },
            url: IRONCLAD_GPT_URL,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❓ I need human help'
            },
            action_id: 'need_human_help',
            value: query
          }
        ]
      }
    ]
  };
}

// Listen for ALL message events (including private channels)
app.event('message', async ({ event, client, logger }) => {
  try {
    // Log all messages for debugging
    logger.info('Message event received:', {
      channel: event.channel,
      channel_type: event.channel_type,
      text: event.text?.substring(0, 50),
      user: event.user,
      ts: event.ts
    });
    
    // Only process messages in our target channel
    if (event.channel !== IRONCLAD_CHANNEL) {
      logger.debug(`Ignoring message - not in target channel. Expected: ${IRONCLAD_CHANNEL}, Got: ${event.channel}`);
      return;
    }
    
    // Ignore bot messages, edited messages, and thread replies
    if (event.subtype || event.thread_ts || !event.text) {
      logger.debug('Ignoring message - bot message, thread reply, or no text');
      return;
    }
    
    // Check if message is a question
    const isQuestion = event.text && (
      event.text.includes('?') ||
      event.text.toLowerCase().includes('how') ||
      event.text.toLowerCase().includes('what') ||
      event.text.toLowerCase().includes('where') ||
      event.text.toLowerCase().includes('when') ||
      event.text.toLowerCase().includes('why') ||
      event.text.toLowerCase().includes('help') ||
      event.text.toLowerCase().includes('issue') ||
      event.text.toLowerCase().includes('problem') ||
      event.text.toLowerCase().includes('error')
    );
    
    if (!isQuestion) {
      logger.debug('Message does not appear to be a question');
      return;
    }
    
    logger.info('Processing question:', event.text);
    
    // Post response directing to GPT
    const response = formatResponse(event.text);
    
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      ...response
    });
    
  } catch (error) {
    logger.error('Error handling message:', error);
    // Try to post error message
    try {
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: 'Sorry, I encountered an error. Please try the Ironclad Assistant GPT directly: ' + IRONCLAD_GPT_URL
      });
    } catch (postError) {
      logger.error('Error posting error message:', postError);
    }
  }
});

// Handle button for human help
app.action('need_human_help', async ({ body, ack, client, logger }) => {
  await ack();
  
  try {
    // Add !! emoji reaction to the original message
    await client.reactions.add({
      channel: body.channel.id,
      timestamp: body.container.thread_ts,
      name: 'bangbang'  // This is the !! emoji
    });
    
    // Post follow-up message
    await client.chat.postMessage({
      channel: body.channel.id,
      thread_ts: body.container.thread_ts,
      text: `Someone from the team will respond to help you with your Ironclad question.`
    });
    
  } catch (error) {
    logger.error('Error handling human help request:', error);
  }
});

// Slash command for manual search
app.command('/ironclad-help', async ({ command, ack, client, logger }) => {
  await ack();
  
  try {
    const query = command.text || 'General Ironclad help';
    const response = formatResponse(query);
    
    await client.chat.postMessage({
      channel: command.channel_id,
      ...response
    });
  } catch (error) {
    logger.error('Error handling slash command:', error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Please visit the Ironclad Assistant GPT: ' + IRONCLAD_GPT_URL
    });
  }
});

// Troubleshooting slash commands
app.command('/ironclad-bot-status', async ({ ack, client, command }) => {
  await ack();
  
  const status = {
    channel: IRONCLAD_CHANNEL,
    gptUrl: IRONCLAD_GPT_URL,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  await client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    text: `Bot Status:\n\`\`\`${JSON.stringify(status, null, 2)}\`\`\``
  });
});

// Error handling
app.error((error) => {
  console.error('Slack app error:', error);
});

// Health check endpoint for monitoring
expressApp.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    channel: IRONCLAD_CHANNEL
  });
});

// Start Express server
expressApp.listen(PORT, () => {
  console.log(`Health check endpoint available at http://localhost:${PORT}/health`);
});

// Start the app
(async () => {
  try {
    await app.start();
    console.log('⚡️ Ironclad Support Bot is running!');
    console.log(`Monitoring channel: ${IRONCLAD_CHANNEL}`);
    console.log(`Directing users to: ${IRONCLAD_GPT_URL}`);
    console.log('\n[IMPORTANT] Make sure your Slack app has these event subscriptions:');
    console.log('- message.channels (for public channels)');
    console.log('- message.groups (for private channels)');
    console.log('- Or just "message" for all message events');
    console.log('\nThe bot is now listening for questions in the configured channel.');
  } catch (error) {
    console.error('Failed to start app:', error);
  }
})();
