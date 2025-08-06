const { App } = require('@slack/bolt');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

(async () => {
  try {
    // Start the app
    await app.start();
    console.log('✅ Bot connected successfully!\n');
    
    // Test 1: Get bot info
    const authTest = await app.client.auth.test();
    console.log('Bot Info:', {
      user_id: authTest.user_id,
      team_id: authTest.team_id,
      bot_id: authTest.bot_id
    });
    
    // Test 2: Try to get channel info
    const channelId = process.env.IRONCLAD_CHANNEL_ID;
    console.log(`\nTrying to get info for channel: ${channelId}`);
    
    try {
      const channelInfo = await app.client.conversations.info({
        channel: channelId
      });
      console.log('Channel Info:', {
        name: channelInfo.channel.name,
        is_private: channelInfo.channel.is_private,
        is_member: channelInfo.channel.is_member
      });
    } catch (error) {
      console.error('Error getting channel info:', error.data?.error || error.message);
    }
    
    // Test 3: List channels bot is in
    console.log('\nChannels bot is member of:');
    const result = await app.client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true
    });
    
    const memberChannels = result.channels.filter(c => c.is_member);
    memberChannels.forEach(channel => {
      console.log(`- ${channel.name} (${channel.id}) - ${channel.is_private ? 'private' : 'public'}`);
    });
    
    // Test 4: Try posting a test message
    console.log(`\nTrying to post test message to ${channelId}...`);
    try {
      await app.client.chat.postMessage({
        channel: channelId,
        text: '🧪 Test message from bot diagnostic script'
      });
      console.log('✅ Successfully posted test message!');
    } catch (error) {
      console.error('❌ Error posting message:', error.data?.error || error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
