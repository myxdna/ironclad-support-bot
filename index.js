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
const SUPPORT_BASE_URL = 'https://support.ironcladapp.com';
const SEARCH_URL = `${SUPPORT_BASE_URL}/hc/en-us/search`;

console.log(`[CONFIG] Bot will monitor channel: ${IRONCLAD_CHANNEL}`);

// Local knowledge base from pinned messages
const LOCAL_KNOWLEDGE = {
  workflows: {
    keywords: ['workflow', 'workflows', 'available workflows', 'which workflow', 'what workflow'],
    title: 'Available Workflows in Ironclad',
    content: `Here are the available workflows in Ironclad:

**Amendment Template** → Use when making changes to existing contracts
**API License Agreement** → Generate Solink API License or review third party API licenses
**Banking Registration Form** → Request or provide banking information
**Confirmation Letters** → When customers need confirmation (installations, outages, etc.)
**Consent Forms** → Gather customer consent for demos, marketing footage, etc.
**Contract for Legal Review** → Submit third party contracts (except NDAs/API licenses)
**Data Processing Addendum** → Send signable DPA to third parties
**Deployment Contracts** → (Deployment only) Generate work orders or review change orders
**Financial and Legal Documents** → (Finance/Legal only) Upload documents for signature
**Master Services Agreement (MSA)** → Generate MSA for new customers
**MNDA (Mutual Non-Disclosure Agreement)** → Generate Solink MNDA or review third party NDAs/MNDAs
**Partner Agreements** → Generate Reseller or Representative Agreements
**Riders** → Generate Dominos and other riders
**Tech Intake Form** → (No longer used - use HubSpot instead for installer intake)
**Terms of Service [Online]** → For legal review of website terms
**Vendor Requests** → Submit vendor requests for multi-team review`
  },
  review: {
    keywords: ['review stage', 'review', 'contract review', 'best practices review'],
    title: 'Review Stage Best Practices',
    content: `**Review Stage - What to do after creating your contract:**

1. **Email Document** - Always email to your counterparty first for their review
2. **Upload New Version** - If counterparty makes changes, upload their version
3. **Approve** - Only after both parties agree on terms

**DO:**
• Email document to counterparty
• Use Activity Feed to ask for help
• Use @mentions for specific change requests

**DON'T:**
• Hit approve immediately without counterparty review`
  },
  sign: {
    keywords: ['sign stage', 'partially signed', 'already signed', 'signed outside'],
    title: 'Sign Stage - Handling Partially Signed Contracts',
    content: `If your counterparty has already signed outside of Ironclad:

**Answer: Upload the signed packet!**

This handles contracts that are partially or fully signed outside the system.`
  },
  approvals: {
    keywords: ['approval', 'approvals', 'mandatory approval', 'additional approval', 'when to approve'],
    title: 'Approvals Best Practices',
    content: `**Two types of approvals:**

**Mandatory Approvals** - Required based on workflow and questionnaire
**Additional Approvals** - Add via "Add approver" button

**Timing:** Only collect approvals AFTER negotiations conclude
• Workflow Owner approval = business terms agreed
• Legal/Security approval = they accept the terms

**Remember:** Only click approve after contract is negotiated and ready to sign!`
  },
  training: {
    keywords: ['training', 'ironclad training', 'academy', 'access', 'who needs training', 'can i get access', 'get access', 'license cost'],
    title: 'Ironclad Access & Training',
    content: `**Who gets access:** AEs, signers, legal, and contract handlers

**Need access?** Check with your department first - licenses are $300/year (approvers cost more). Submit to #ithelpdesk if needed

**One-time use?** Ask someone on your team instead

**Training:** Go to academy.ironcladapp.com

**Wrong Bamboo task?** Ping @Nadia Vizcardo`
  },
  pii: {
    keywords: ['pii', 'addendum pii', 'pii addendum', 'personal information', 'data protection'],
    title: 'PII/Data Protection Addendum',
    content: `For PII (Personally Identifiable Information) protection:

**Use the Data Processing Addendum (DPA) workflow**

This workflow allows you to send a signable copy of Solink's DPA to third parties and covers PII handling requirements.`
  },
  submit: {
    keywords: ['submit document', 'legal review', 'upload document', 'submit for review', 'reference video', 'how to submit'],
    title: 'How to Submit Documents for Legal Review',
    content: `To submit a document for legal review:

1. Use the **Contract for Legal Review** workflow
2. This is for any third party contract (except NDAs or API License Agreements)
3. Fill out the questionnaire in the Create stage
4. Upload your document when prompted
5. Submit for review

**Having issues?** The legal team can help - ping them in the Activity Feed within your workflow.`
  },
  templates: {
    keywords: ['template', 'msa template', 'dpa template', 'get template', 'without submitting', 'template without'],
    title: 'Getting Templates Without Formal Submission',
    content: `To get templates without formally submitting through Ironclad:

**Option 1:** Start the workflow (MSA or DPA) and download the generated document in the Review stage without sending it

**Option 2:** Ask the legal team (@Hannah Buechel or @Rachael) for a template copy

Note: Templates may need customization based on your specific use case.`
  },
  mnda: {
    keywords: ['mnda', 'nda questions', 'mutual nda', 'non disclosure'],
    title: 'NDA/MNDA Questions',
    content: `For NDA or MNDA (Mutual Non-Disclosure Agreement) questions:

**Use the MNDA workflow** in Ironclad to generate or review NDAs/MNDAs

**For specific questions:** Post in #ironclad or ping the legal team (@Rachael or @Hannah Buechel)

**This channel (#ironclad) is the right place for all contract and legal document questions!**`
  },
  thirdparty_nda: {
    keywords: ['nda from prospect', 'nda from client', 'their nda', 'they sent nda', 'received nda', 'prospect nda', 'client nda', 'third party nda', 'mnda from prospect', 'mnda from client'],
    title: 'Third-Party NDA/MNDA Upload',
    content: `**Have an NDA/MNDA from a prospect/client that they'd like you to sign?**

Use the **MNDA (Mutual Non-Disclosure Agreement)** workflow to upload the contract for review:

1. Click "Start a workflow" in Ironclad
2. Select "Mutual Non-Disclosure Agreement (MNDA)"
3. Choose "Upload other party's contract (counterparty paper)"
4. Upload their NDA/MNDA document
5. Fill out the required information
6. Submit for legal review

The legal team will review and advise on any needed changes.`
  },
  cs_access: {
    keywords: ['cs access', 'customer success access', 'csm access', 'cs ironclad'],
    title: 'Customer Success Access',
    content: `**CS teams don't need Ironclad access!**

Contract details are in HubSpot, not Ironclad. Current contracts aren't even in Ironclad yet.

**Future state:** Contract info will be in Salesforce (Project Rome)

**For now:** Check HubSpot for contract details`
  },
  review_stage: {
    keywords: ['review stage process', 'after creating contract', 'what to do after', 'contract created now what'],
    title: 'Review Stage Process',
    content: `After creating your contract in Review Stage:

1. **Email the contract** to counterparty (Ironclad won't auto-send)
2. **Wait for their feedback**
3. **Upload new version** if they make changes
4. **Only approve** after both parties agree

**Don't:** Immediately approve without counterparty review
**Why:** Approvals reset with any changes - you'll waste time re-approving`
  },
  edit_process: {
    keywords: ['edits', 'changes to contract', 'counterparty edits', 'cancel signature'],
    title: 'Handling Contract Edits',
    content: `When counterparty wants changes after signing started:

1. Click "Cancel signature request"
2. Click "Go back to review"
3. Upload the edited version
4. Ping @Rachael in the activity feed
5. Re-approve after edits are made

**Note:** Simple process but people get nervous - it's okay!`
  },
  partial_sign: {
    keywords: ['partially signed', 'already signed', 'signed outside ironclad', 'counterparty signed'],
    title: 'Partially Signed Contracts',
    content: `If counterparty already signed outside Ironclad:

**Upload the partially signed document**

This collects only our signatures on their pre-signed doc. Simple process - just need to know it exists!`
  },
  repository: {
    keywords: ['repository', 'find contracts', 'saved agreements', 'where are contracts'],
    title: 'Finding Saved Contracts',
    content: `All executed contracts are in the Ironclad Repository.

**Tip:** You can set reminders for contract renewals
**Useful for:** Reseller agreements with specific terms or pilot projects`
  },
  signature_help: {
    keywords: ['who gets signatures', 'signature responsibility', 'collecting signatures'],
    title: 'Signature Responsibility',
    content: `**You are responsible for getting signatures!**

The person who creates the workflow owns the signature process. Legal team does not collect signatures for you.`
  },
  demo_access: {
    keywords: ['demo access', 'demo form', 'access form', 'demo access form'],
    title: 'Demo Access Form',
    content: `For demo access forms, use the **Consent Forms** workflow.

This workflow is used to gather customer consent for:
• Using their environment to demo our product
• Using their footage for marketing purposes
• Any other reason requiring customer consent

**To find it:** Click "Start a workflow" in Ironclad and look for "Consent Forms"`
  },
  pilot_project: {
    keywords: ['pilot', 'pilot project', 'poc', 'proof of concept', 'pilot template', 'trial', 'pilot agreement'],
    title: 'Pilot Project Templates',
    content: `**Running a pilot project? There's a specific template for that!**

Do NOT use the regular master template for pilots. Instead, use one of these:

1. **2025 Pilot Solink Master Subscription & Cameras Template**
   → For unpaid pilot projects

2. **2025 Paid Pilot Solink Master Subscription & Cameras Template**
   → For paid pilot projects

**Important:** Do not use the regular master template and write your own legal terms for pilots please.`
  },
  external_signature: {
    keywords: ['cant use ironclad', 'must use adobe', 'docusign', 'pandadoc', 'wet signature', 'pen and paper', 'other signature', 'external signature', 'different signature'],
    title: 'Using External Signature Providers',
    content: `**Someone can't use Ironclad and must use Adobe Sign/DocuSign/etc?**

All types of signatures are OK! Whether it's:
• Ironclad E-Signature (easiest option!)
• Adobe Sign, DocuSign, PandaDoc
• Even "wet signature" with pen and paper

**How to handle external signatures:**

1. Make sure the workflow is in the **Sign Stage** (all approvals collected)
2. Follow instructions for uploading signed documents: https://support.ironcladapp.com/hc/en-us/articles/12276801813271-Upload-Signed-Documents
3. Upload the document and select the people **who have already signed**
4. Ironclad E-Signature will send requests to remaining signers, if applicable`
  }
};

// Helper function to check local knowledge first
function checkLocalKnowledge(query) {
  const lowerQuery = query.toLowerCase();
  
  for (const [key, info] of Object.entries(LOCAL_KNOWLEDGE)) {
    for (const keyword of info.keywords) {
      if (lowerQuery.includes(keyword)) {
        return {
          found: true,
          title: info.title,
          content: info.content,
          source: 'pinned'
        };
      }
    }
  }
  
  return { found: false };
}

// Helper function to search Ironclad support
async function searchIroncladSupport(query) {
  // First check local knowledge
  const localResult = checkLocalKnowledge(query);
  if (localResult.found) {
    console.log('Found answer in local knowledge base');
    return [{
      title: localResult.title,
      url: '#', // No URL for local content
      snippet: 'From Ironclad knowledge base',
      isLocal: true,
      content: localResult.content
    }];
  }
  
  // If not found locally, search online
  try {
    // First try the search endpoint
    const response = await axios.get(SEARCH_URL, {
      params: { query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SlackBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Try multiple possible selectors for Zendesk help centers
    const selectors = [
      '.search-result',
      '.search-results-list li',
      'ul.search-results li',
      '.article-list li',
      '[class*="search-result"]',
      'a[href*="/articles/"]'
    ];
    
    let foundResults = false;
    
    for (const selector of selectors) {
      if ($(selector).length > 0) {
        $(selector).each((i, elem) => {
          if (i < 3) { // Limit to top 3 results
            // Try to extract title
            let title = $(elem).find('h2, h3, h4, .article-title, .search-result-title, a').first().text().trim();
            
            // Try to extract link
            let link = $(elem).find('a').first().attr('href');
            if (!link) {
              link = $(elem).attr('href');
            }
            
            // Try to extract snippet
            let snippet = $(elem).find('p, .article-body, .search-result-description, .excerpt').first().text().trim();
            if (!snippet) {
              snippet = $(elem).text().trim();
            }
            
            if (title && link) {
              results.push({
                title: title.substring(0, 100),
                url: link.startsWith('http') ? link : `${SUPPORT_BASE_URL}${link}`,
                snippet: snippet.substring(0, 150) + (snippet.length > 150 ? '...' : '')
              });
              foundResults = true;
            }
          }
        });
        
        if (foundResults) break;
      }
    }
    
    // If no results found with selectors, try a more general approach
    if (results.length === 0) {
      // Look for any links that seem to be help articles
      $('a[href*="/articles/"], a[href*="/hc/"]').each((i, elem) => {
        if (i < 3 && results.length < 3) {
          const $elem = $(elem);
          const href = $elem.attr('href');
          const text = $elem.text().trim();
          
          if (text && href && text.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              title: text.substring(0, 100),
              url: href.startsWith('http') ? href : `${SUPPORT_BASE_URL}${href}`,
              snippet: 'Click to read the full article.'
            });
          }
        }
      });
    }
    
    // If still no results, return a fallback
    if (results.length === 0) {
      console.log('No results found, returning direct link to search');
      results.push({
        title: 'Search Ironclad Help Center',
        url: `${SEARCH_URL}?query=${encodeURIComponent(query)}`,
        snippet: `Click here to search for "${query}" on the Ironclad Help Center.`
      });
    }
    
    return results;
  } catch (error) {
    console.error('Error searching Ironclad support:', error);
    // Return a direct link as fallback
    return [{
      title: 'Search Ironclad Help Center',
      url: `${SEARCH_URL}?query=${encodeURIComponent(query)}`,
      snippet: 'Click here to search the Ironclad Help Center directly.'
    }];
  }
}

// Format search results for Slack
function formatSearchResults(results, query) {
  if (results.length === 0) {
    return {
      text: `I couldn't find any help articles for "${query}". You might want to try different keywords or contact support directly.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `I couldn't find any help articles for *"${query}"*. You might want to try different keywords or contact support directly.`
          }
        }
      ]
    };
  }
  
  // Check if this is local content
  if (results[0].isLocal) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `I found this information:`
        }
      },
      {
        type: 'divider'
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${results[0].title}*\n\n${results[0].content}`
        }
      }
    ];
    
    blocks.push({
      type: 'divider'
    });
    
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Did this answer your question?'
      }
    });
    
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '✅ Yes, this helped!'
          },
          style: 'primary',
          action_id: 'answer_helpful',
          value: query
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '❌ No, I need more help'
          },
          action_id: 'answer_not_helpful',
          value: query
        }
      ]
    });
    
    return { blocks };
  }
  
  // Regular web results
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `I found these help articles for *"${query}"*:`
      }
    },
    {
      type: 'divider'
    }
  ];
  
  results.forEach((result, index) => {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${index + 1}. <${result.url}|${result.title}>*\n${result.snippet}`
      }
    });
  });
  
  blocks.push({
    type: 'divider'
  });
  
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Did this answer your question?'
    }
  });
  
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '✅ Yes, this helped!'
        },
        style: 'primary',
        action_id: 'answer_helpful',
        value: query
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '❌ No, I need more help'
        },
        action_id: 'answer_not_helpful',
        value: query
      }
    ]
  });
  
  return { blocks };
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
    
    // Post initial searching message
    const searchingMsg = await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '🔍 Searching Ironclad help center...'
    });
    
    // Search for help articles
    const results = await searchIroncladSupport(event.text);
    
    // Update message with results
    const formattedResults = formatSearchResults(results, event.text);
    
    await client.chat.update({
      channel: event.channel,
      ts: searchingMsg.ts,
      ...formattedResults
    });
    
  } catch (error) {
    logger.error('Error handling message:', error);
    // Try to post error message
    try {
      await client.chat.postMessage({
        channel: event.channel,
        thread_ts: event.ts,
        text: 'Sorry, I encountered an error while searching. Please try again later.'
      });
    } catch (postError) {
      logger.error('Error posting error message:', postError);
    }
  }
});

// Handle button interactions
app.action('answer_helpful', async ({ body, ack, client, logger }) => {
  await ack();
  
  try {
    // Add checkmark reaction to original message
    await client.reactions.add({
      channel: body.channel.id,
      timestamp: body.message.thread_ts,
      name: 'white_check_mark'
    });
    
    // Don't replace the content - just remove the buttons and add confirmation
    const originalBlocks = body.message.blocks.filter(block => block.type !== 'actions');
    
    // Add a confirmation message
    originalBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_✅ Great! Glad this helped._'
      }
    });
    
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      blocks: originalBlocks
    });
  } catch (error) {
    logger.error('Error handling helpful response:', error);
  }
});

app.action('answer_not_helpful', async ({ body, ack, client, logger }) => {
  await ack();
  
  try {
    // Add !! emoji reaction to the original message
    await client.reactions.add({
      channel: body.channel.id,
      timestamp: body.message.thread_ts,
      name: 'bangbang'  // This is the !! emoji
    });
    
    // Post follow-up message
    await client.chat.postMessage({
      channel: body.channel.id,
      thread_ts: body.message.thread_ts,
      text: 'I\'m sorry the articles didn\'t help. Here are some options:\n\n• Try searching with different keywords\n• In Ironclad, click "New" to browse all workflows - each has a description of when to use it\n• Post your specific issue and someone from the team will help\n• Contact Ironclad support directly at support@ironcladapp.com\n\nSomeone from the team will respond to help you.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'I\'m sorry the articles didn\'t help. Here are some options:\n\n• Try searching with different keywords\n• **In Ironclad, click "Start a workflow" to browse all workflows** - each has a description of when to use it\n• Post your specific issue and someone from the team will help\n• Contact Ironclad support directly at support@ironcladapp.com\n\n**Someone from the team will respond to help you.**'
          }
        }
      ]
    });
    
    // Don't update the original message - just remove the buttons
    // Get the original blocks and remove only the actions block
    const originalBlocks = body.message.blocks.filter(block => block.type !== 'actions');
    
    // Add a note that help was requested
    originalBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_❌ Additional help requested - someone will respond in thread_'
      }
    });
    
    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      blocks: originalBlocks
    });
  } catch (error) {
    logger.error('Error handling not helpful response:', error);
  }
});

// Slash command for manual search
app.command('/ironclad-help', async ({ command, ack, client, logger }) => {
  await ack();
  
  try {
    if (!command.text) {
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: 'Please provide a search query. Usage: `/ironclad-help how to create a workflow`'
      });
      return;
    }
    
    // Search and post results
    const results = await searchIroncladSupport(command.text);
    const formattedResults = formatSearchResults(results, command.text);
    
    await client.chat.postMessage({
      channel: command.channel_id,
      ...formattedResults
    });
  } catch (error) {
    logger.error('Error handling slash command:', error);
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Sorry, I encountered an error while searching. Please try again later.'
    });
  }
});

// Troubleshooting slash commands
app.command('/ironclad-bot-status', async ({ ack, client, command }) => {
  await ack();
  
  const status = {
    channel: IRONCLAD_CHANNEL,
    searchUrl: SEARCH_URL,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  await client.chat.postEphemeral({
    channel: command.channel_id,
    user: command.user_id,
    text: `Bot Status:\n\`\`\`${JSON.stringify(status, null, 2)}\`\`\``
  });
});

app.command('/ironclad-bot-test', async ({ ack, client, command }) => {
  await ack();
  
  try {
    const testResults = await searchIroncladSupport('workflow');
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `Test search successful! Found ${testResults.length} results for "workflow".`
    });
  } catch (error) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: `Test failed: ${error.message}`
    });
  }
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
    console.log('\n[IMPORTANT] Make sure your Slack app has these event subscriptions:');
    console.log('- message.channels (for public channels)');
    console.log('- message.groups (for private channels)');
    console.log('- Or just "message" for all message events');
    console.log('\nThe bot is now listening for questions in the configured channel.');
  } catch (error) {
    console.error('Failed to start app:', error);
  }
})();
