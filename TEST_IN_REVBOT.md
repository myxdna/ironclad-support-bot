# Test Configuration for #revbot

## Testing Setup

Since we're testing in #revbot instead of #ironclad, here's what you need to know:

### 1. Get #revbot Channel ID

In Slack:
1. Go to #revbot channel
2. Click the channel name at the top
3. Scroll to bottom of the modal
4. Copy the Channel ID (starts with C)

### 2. Update Your .env

```
IRONCLAD_CHANNEL_ID=C_YOUR_REVBOT_CHANNEL_ID
```

### 3. Testing Scenarios

Test these in #revbot:


### Important: Add Bot to Channel

After installing the app to your workspace:
1. Go to #revbot (or your test channel)
2. Type `/invite @Ironclad Support Bot`
3. The bot should now appear in the channel member list

**Basic Questions:**
- "How do I create a workflow?"
- "What is a contract template?"
- "Where can I find help with approvals?"
- "I'm having an issue with notifications"

**Edge Cases:**
- Messages without questions
- Multiple questions in one message
- Follow-up questions in threads

**Slash Commands:**
- `/ironclad-help workflow automation`
- `/ironclad-bot-status`
- `/ironclad-bot-test`

### 4. Expected Behavior

The bot will:
1. Monitor #revbot for questions
2. Search Ironclad help center
3. Reply in thread with top 3 results
4. Add feedback buttons

### 5. Things to Verify

- [ ] Bot responds only to questions
- [ ] Bot ignores its own messages
- [ ] Bot responds in threads
- [ ] Feedback buttons work
- [ ] Checkmark reaction appears when "helpful" is clicked
- [ ] Slash commands work from any channel

### 6. Monitoring

Watch the console logs for:
```
⚡️ Ironclad Support Bot is running!
Monitoring channel: revbot
```

### 7. After Testing

When ready for production:
1. Get the real #ironclad channel ID
2. Update IRONCLAD_CHANNEL_ID in .env
3. Redeploy to Render
