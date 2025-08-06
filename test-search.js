const axios = require('axios');
const cheerio = require('cheerio');

const SUPPORT_BASE_URL = 'https://support.ironcladapp.com';
const SEARCH_URL = `${SUPPORT_BASE_URL}/hc/en-us/search`;

async function testSearch(query) {
  console.log(`Testing search for: "${query}"`);
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get(SEARCH_URL, {
      params: { query },
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SlackBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    console.log(`Status Code: ${response.status}`);
    console.log(`Content Length: ${response.data.length} characters`);
    
    const $ = cheerio.load(response.data);
    
    // Log page title
    console.log(`Page Title: ${$('title').text()}`);
    
    // Try to find any results
    const selectors = [
      '.search-result',
      '.search-results-list li',
      'ul.search-results li',
      '.article-list li',
      '[class*="search-result"]',
      'a[href*="/articles/"]'
    ];
    
    console.log('\nChecking for results:');
    for (const selector of selectors) {
      const count = $(selector).length;
      if (count > 0) {
        console.log(`✅ Found ${count} results with selector: ${selector}`);
        
        // Show first result
        const first = $(selector).first();
        console.log('  First result:');
        console.log(`    Text: ${first.text().trim().substring(0, 100)}...`);
        console.log(`    HTML: ${first.html().substring(0, 200)}...`);
      }
    }
    
    // If no results found, show a sample of the page
    console.log('\nPage sample:');
    console.log($('body').text().substring(0, 500) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run test
testSearch('workflow').then(() => {
  console.log('\nTest complete!');
});
