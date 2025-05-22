// social-media-scraper.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Apply stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

// Configuration - Replace with your own credentials and paths
const CONFIG = {
  instagram: {
    username: 'YOUR_INSTAGRAM_USERNAME',
    password: 'YOUR_INSTAGRAM_PASSWORD',
    hashtag: 'maydrakesingalong', // The hashtag to search for (without the # symbol)
    reelsCount: 10 // Number of reels to scrape
  },
  tiktok: {
    hashtag: 'maydrakesingalong', // The hashtag to search for (without the # symbol)
    reelsCount: 10 // Number of TikTok videos to scrape
  },
  outputFilePath: path.join(__dirname, 'social_media_links.xlsx')
};

// Helper function to format numbers (e.g., 1.5K to 1500)
function parseCount(countStr) {
  if (!countStr) return 0;
  
  countStr = countStr.trim().toLowerCase();
  
  if (countStr === 'n/a' || countStr === '') return 0;
  
  // Handle K, M, B suffixes
  if (countStr.endsWith('k')) {
    return parseFloat(countStr.replace('k', '')) * 1000;
  } else if (countStr.endsWith('m')) {
    return parseFloat(countStr.replace('m', '')) * 1000000;
  } else if (countStr.endsWith('b')) {
    return parseFloat(countStr.replace('b', '')) * 1000000000;
  }
  
  // Remove commas and convert to number
  return parseInt(countStr.replace(/,/g, ''), 10) || 0;
}

// Create Excel workbook
async function createExcelFile(tiktokLinks, instagramLinks) {
  const workbook = new ExcelJS.Workbook();
  
  // Add TikTok worksheet
  const tiktokSheet = workbook.addWorksheet('TikTok Reels');
  tiktokSheet.columns = [
    { header: 'Hashtag', key: 'hashtag', width: 20 },
    { header: 'Link', key: 'link', width: 60 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Likes', key: 'likes', width: 15 },
    { header: 'Comments', key: 'comments', width: 15 },
    { header: 'Scraped Date', key: 'date', width: 20 }
  ];
  
  // Add Instagram worksheet
  const instagramSheet = workbook.addWorksheet('Instagram Reels');
  instagramSheet.columns = [
    { header: 'Hashtag', key: 'hashtag', width: 20 },
    { header: 'Link', key: 'link', width: 60 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Likes', key: 'likes', width: 15 },
    { header: 'Comments', key: 'comments', width: 15 },
    { header: 'Scraped Date', key: 'date', width: 20 }
  ];
  
  // Add data to worksheets
  const currentDate = new Date().toISOString().split('T')[0];
  
  tiktokLinks.forEach(item => {
    tiktokSheet.addRow({
      hashtag: `#${CONFIG.tiktok.hashtag}`,
      link: item.link,
      author: item.author || 'Unknown',
      likes: item.likes || 'N/A',
      comments: item.comments || 'N/A',
      date: currentDate
    });
  });
  
  instagramLinks.forEach(item => {
    instagramSheet.addRow({
      hashtag: `#${CONFIG.instagram.hashtag}`,
      link: item.link,
      author: item.author || 'Unknown',
      likes: item.likes || 'N/A',
      comments: item.comments || 'N/A',
      date: currentDate
    });
  });
  
  // Save the workbook
  await workbook.xlsx.writeFile(CONFIG.outputFilePath);
  console.log(`Excel file saved at: ${CONFIG.outputFilePath}`);
}

// Extract TikTok video metrics (likes and comments)
async function extractTikTokMetrics(browser, link) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  try {
    // Go to video page
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract like and comment counts
    const metrics = await page.evaluate(() => {
      // Look for the like and comment counts
      const statsContainer = document.querySelectorAll('strong[data-e2e], span[data-e2e]');
      let likes = 'N/A';
      let comments = 'N/A';
      
      statsContainer.forEach(el => {
        const dataAttr = el.getAttribute('data-e2e');
        if (dataAttr && dataAttr.includes('like-count')) {
          likes = el.textContent.trim();
        } else if (dataAttr && dataAttr.includes('comment-count')) {
          comments = el.textContent.trim();
        }
      });
      
      return { likes, comments };
    });
    
    return metrics;
  } catch (error) {
    console.error(`Error extracting metrics for TikTok video ${link}:`, error);
    return { likes: 'N/A', comments: 'N/A' };
  } finally {
    await page.close();
  }
}

// Extract Instagram reel metrics (likes and comments)
async function extractInstagramMetrics(browser, link) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  try {
    // Go to post page
    await page.goto(link, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Extract like and comment counts
    const metrics = await page.evaluate(() => {
      // For likes, look for the likes section
      let likes = 'N/A';
      let comments = 'N/A';
      
      // Try different selectors for likes
      const likeElements = document.querySelectorAll('section span span');
      for (const el of likeElements) {
        if (el.textContent.includes('likes') || el.textContent.includes('like')) {
          likes = el.textContent.split(' ')[0].trim();
          break;
        }
      }
      
      // Try different selectors for comments
      const commentElements = document.querySelectorAll('ul li span');
      for (const el of commentElements) {
        if (el.textContent.includes('comments') || el.textContent.includes('comment')) {
          comments = el.textContent.split(' ')[0].trim();
          break;
        }
      }
      
      return { likes, comments };
    });
    
    return metrics;
  } catch (error) {
    console.error(`Error extracting metrics for Instagram reel ${link}:`, error);
    return { likes: 'N/A', comments: 'N/A' };
  } finally {
    await page.close();
  }
}

// Scrape TikTok videos with specific hashtag
async function scrapeTikTok() {
  console.log(`Starting TikTok scraping for hashtag: #${CONFIG.tiktok.hashtag}`);
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to TikTok hashtag page
    await page.goto(`https://www.tiktok.com/tag/${CONFIG.tiktok.hashtag}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for videos to load
    await page.waitForSelector('div[data-e2e="challenge-item"], div[data-e2e="tiktok-feed-item"]', { timeout: 60000 });
    
    // Scroll to load more videos
    let previousHeight;
    let videoData = [];
    
    while (videoData.length < CONFIG.tiktok.reelsCount) {
      // Extract video links and authors
      videoData = await page.evaluate(() => {
        const data = [];
        const videoElements = document.querySelectorAll('div[data-e2e="challenge-item"], div[data-e2e="tiktok-feed-item"]');
        
        videoElements.forEach(el => {
          const linkEl = el.querySelector('a[href*="/video/"]');
          const authorEl = el.querySelector('a[href*="/@"]');
          
          if (linkEl && linkEl.href) {
            data.push({
              link: linkEl.href,
              author: authorEl ? authorEl.textContent.trim() : 'Unknown'
            });
          }
        });
        
        return [...new Set(data.map(JSON.stringify))].map(JSON.parse); // Remove duplicates
      });
      
      // Break if we have enough links or if no more new content is loading
      if (videoData.length >= CONFIG.tiktok.reelsCount) break;
      
      // Scroll down
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { 
        timeout: 10000 
      }).catch(() => console.log('No more new content to load'));
      
      // Wait for content to load
      await page.waitForTimeout(2000);
    }
    
    // Limit to requested count
    videoData = videoData.slice(0, CONFIG.tiktok.reelsCount);
    console.log(`Found ${videoData.length} TikTok videos with hashtag #${CONFIG.tiktok.hashtag}`);
    
    // Extract likes and comments for each video
    console.log('Extracting metrics for each TikTok video...');
    for (let i = 0; i < videoData.length; i++) {
      console.log(`Processing TikTok video ${i+1}/${videoData.length}: ${videoData[i].link}`);
      const metrics = await extractTikTokMetrics(browser, videoData[i].link);
      videoData[i].likes = metrics.likes;
      videoData[i].comments = metrics.comments;
    }
    
    return videoData;
  } catch (error) {
    console.error('Error scraping TikTok:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Scrape Instagram reels with specific hashtag
async function scrapeInstagram() {
  console.log(`Starting Instagram scraping for hashtag: #${CONFIG.instagram.hashtag}`);
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to Instagram login page
    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Accept cookies if dialog appears
    try {
      const cookieButton = await page.waitForSelector('button[tabindex="0"]', { timeout: 5000 });
      if (cookieButton) await cookieButton.click();
    } catch (error) {
      console.log('No cookie dialog found or already accepted');
    }
    
    // Login to Instagram
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]', CONFIG.instagram.username);
    await page.type('input[name="password"]', CONFIG.instagram.password);
    await page.click('button[type="submit"]');
    
    // Wait for login to complete
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Skip save login info if prompted
    try {
      const notNowButton = await page.waitForSelector('button:has-text("Not Now"), button:has-text("Not now")', { timeout: 5000 });
      if (notNowButton) await notNowButton.click();
    } catch (error) {
      console.log('No save login prompt or already handled');
    }
    
    // Skip notifications if prompted
    try {
      const notNowNotifButton = await page.waitForSelector('button:has-text("Not Now"), button:has-text("Not now")', { timeout: 5000 });
      if (notNowNotifButton) await notNowNotifButton.click();
    } catch (error) {
      console.log('No notifications prompt or already handled');
    }
    
    // Navigate to hashtag page
    await page.goto(`https://www.instagram.com/explore/tags/${CONFIG.instagram.hashtag}/`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    // Wait for posts to load
    await page.waitForSelector('article a', { timeout: 60000 });
    
    // Click on the "Reels" tab if available
    try {
      const reelsTab = await page.waitForSelector('a[href*="/reels"]', { timeout: 5000 });
      if (reelsTab) await reelsTab.click();
      await page.waitForTimeout(2000); // Wait for reels to load
    } catch (error) {
      console.log('No separate reels tab found, continuing with available content');
    }
    
    // Scroll to load more reels
    let previousHeight;
    let reelData = [];
    
    while (reelData.length < CONFIG.instagram.reelsCount) {
      // Extract reel links and authors
      reelData = await page.evaluate(() => {
        const data = [];
        const reelElements = document.querySelectorAll('article a');
        
        reelElements.forEach(el => {
          if (el.href && (el.href.includes('/reel/') || el.href.includes('/p/'))) {
            // Try to find the author from the post
            let author = 'Unknown';
            const authorEl = el.closest('article')?.querySelector('a[href*="/@"] span, a[href*="/"] span');
            if (authorEl) {
              author = authorEl.textContent.trim();
            }
            
            data.push({
              link: el.href,
              author: author
            });
          }
        });
        
        return [...new Set(data.map(JSON.stringify))].map(JSON.parse); // Remove duplicates
      });
      
      // Break if we have enough links or if no more new content is loading
      if (reelData.length >= CONFIG.instagram.reelsCount) break;
      
      // Scroll down
      previousHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForFunction(`document.body.scrollHeight > ${previousHeight}`, { 
        timeout: 10000 
      }).catch(() => console.log('No more new content to load'));
      
      // Wait for content to load
      await page.waitForTimeout(2000);
    }
    
    // Limit to requested count
    reelData = reelData.slice(0, CONFIG.instagram.reelsCount);
    console.log(`Found ${reelData.length} Instagram reels with hashtag #${CONFIG.instagram.hashtag}`);
    
    // Extract likes and comments for each reel
    console.log('Extracting metrics for each Instagram reel...');
    for (let i = 0; i < reelData.length; i++) {
      console.log(`Processing Instagram reel ${i+1}/${reelData.length}: ${reelData[i].link}`);
      const metrics = await extractInstagramMetrics(browser, reelData[i].link);
      reelData[i].likes = metrics.likes;
      reelData[i].comments = metrics.comments;
    }
    
    return reelData;
  } catch (error) {
    console.error('Error scraping Instagram:', error);
    return [];
  } finally {
    await browser.close();
  }
}

// Main function
async function main() {
  try {
    // Scrape TikTok and Instagram
    const tiktokLinks = await scrapeTikTok();
    // const instagramLinks = await scrapeInstagram();
    
    // Create Excel file with scraped links
    await createExcelFile(tiktokLinks, instagramLinks);
    
    console.log('Scraping completed successfully!');
    console.log(`Found ${tiktokLinks.length} TikTok videos and ${instagramLinks.length} Instagram reels with hashtag #${CONFIG.tiktok.hashtag}`);
    console.log(`All data including likes and comments has been exported to: ${CONFIG.outputFilePath}`);
  } catch (error) {
    console.error('Error running the scraper:', error);
  }
}

main();