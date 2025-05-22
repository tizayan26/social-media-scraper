// social-media-scraper.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Apply stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin({
    // These options make stealth more aggressive
    enabledEvasions: new Set([
      'chrome.app',
      'chrome.csi',
      'chrome.loadTimes',
      'chrome.runtime',
      'iframe.contentWindow',
      'media.codecs',
      'navigator.hardwareConcurrency',
      'navigator.languages',
      'navigator.permissions',
      'navigator.plugins',
      'navigator.webdriver',
      'sourceurl',
      'user-agent-override',
      'webgl.vendor',
      'window.outerdimensions'
    ])
  }));

//   puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false ,    args: [
//     '--no-sandbox',
//     '--disable-setuid-sandbox',
//     '--disable-dev-shm-usage',
//     '--disable-accelerated-2d-canvas',
//     '--no-first-run',
//     '--no-zygote',
//     '--single-process'
//   ]}).then(async browser => {
//     console.log('Running tests..')
//     const page = await browser.newPage()
//     await page.goto('https://bot.sannysoft.com')
//    // await page.waitForTimeout(5000)
//     await page.screenshot({ path: 'testresult.png', fullPage: true })
//     await browser.close()
//     console.log(`All done, check the screenshot. ✨`)
//   })

// Configuration - Replace with your own credentials and paths
const CONFIG = {
  instagram: {
    username: 'zayan.upal@gmail.com',
    password: 'tizayan26',
    hashtag: 'makeup', // The hashtag to search for (without the # symbol)
    reelsCount: 10 // Number of reels to scrape
  },
  tiktok: {
    hashtag: 'makeup', // The hashtag to search for (without the # symbol)
    reelsCount: 10 // Number of TikTok videos to scrape
  },
  outputFilePath: path.join(__dirname, 'social_media_links.xlsx')
};

// Create Excel workbook
async function createExcelFile(tiktokLinks, instagramLinks) {
  const workbook = new ExcelJS.Workbook();
  
  // Add TikTok worksheet
  const tiktokSheet = workbook.addWorksheet('TikTok Reels');
  tiktokSheet.columns = [
    { header: 'Hashtag', key: 'hashtag', width: 20 },
    { header: 'Link', key: 'link', width: 60 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Scraped Date', key: 'date', width: 20 }
  ];
  
  // Add Instagram worksheet
  const instagramSheet = workbook.addWorksheet('Instagram Reels');
  instagramSheet.columns = [
    { header: 'Hashtag', key: 'hashtag', width: 20 },
    { header: 'Link', key: 'link', width: 60 },
    { header: 'Author', key: 'author', width: 20 },
    { header: 'Scraped Date', key: 'date', width: 20 }
  ];
  
  // Add data to worksheets
  const currentDate = new Date().toISOString().split('T')[0];
  
  tiktokLinks.forEach(item => {
    tiktokSheet.addRow({
      hashtag: `#${CONFIG.tiktok.hashtag}`,
      link: item.link,
      author: item.author || 'Unknown',
      date: currentDate
    });
  });
  
  instagramLinks.forEach(item => {
    instagramSheet.addRow({
      hashtag: `#${CONFIG.instagram.hashtag}`,
      link: item.link,
      author: item.author || 'Unknown',
      date: currentDate
    });
  });
  
  // Save the workbook
  await workbook.xlsx.writeFile(CONFIG.outputFilePath);
  console.log(`Excel file saved at: ${CONFIG.outputFilePath}`);
}


async function solvePuzzleSlider(page) {
    try {
      // Wait for slider to appear (with shorter timeout)
      await page.waitForSelector('.captcha-slider', { timeout: 3000 });
      
      // Get slider dimensions
      const slider = await page.$('.captcha-slider');
      const sliderHandle = await page.$('.slider-handle');
      const sliderBox = await slider.boundingBox();
      const handleBox = await sliderHandle.boundingBox();
      
      // Simulate human-like drag
      await page.mouse.move(
        handleBox.x + handleBox.width / 2,
        handleBox.y + handleBox.height / 2
      );
      await page.mouse.down();
      
      // Move in random increments with pauses
      const steps = 20 + Math.floor(Math.random() * 10);
      for (let i = 0; i < steps; i++) {
        await page.mouse.move(
          handleBox.x + (sliderBox.width * (i/steps)) + Math.random() * 5,
          handleBox.y + handleBox.height / 2 + (Math.random() > 0.5 ? 1 : -1) * Math.random() * 3,
          { steps: 1 }
        );
        await page.waitForTimeout(50 + Math.random() * 100);
      }
      
      // Release at end
      await page.mouse.up();
      await page.waitForTimeout(1000);
      
      return true;
    } catch (error) {
      console.log('No slider found or already solved');
      return false;
    }
  }

async function handleCookieConsent(page) {
try {
    // Try to click "Decline optional cookies" button
    const declineButton = await page.waitForSelector('text/Decline optional cookies', { timeout: 5000 });
    if (declineButton) {
    await declineButton.click();
    await page.waitForTimeout(1000);
    return true;
    }
} catch (error) {
    console.log('No cookie consent dialog found');
}
return false;
}
// Scrape TikTok videos with specific hashtag
async function scrapeTikTok() {
  console.log(`Starting TikTok scraping for hashtag: #${CONFIG.tiktok.hashtag}`);
  const browser = await puppeteer.launch({ 
    //executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 
    headless: false
    // args: [
    //     '--disable-blink-features=AutomationControlled',
    //     '--disable-infobars',
    //     '--disable-notifications',
    //     '--disable-popup-blocking',
    //     '--disable-web-security',
    //     '--disable-extensions',
    //     '--disable-default-apps',
    //     '--disable-component-extensions-with-background-pages',
    //     '--disable-component-update',
    //     '--disable-background-networking',
    //     '--disable-sync',
    //     '--disable-translate',
    //     '--disable-client-side-phishing-detection',
    //     '--disable-hang-monitor',
    //     '--disable-prompt-on-repost',
    //     '--disable-domain-reliability',
    //     '--disable-renderer-backgrounding',
    //     '--disable-ipc-flooding-protection',
    //     '--disable-background-timer-throttling',
    //     '--disable-backgrounding-occluded-windows',
    //     '--disable-breakpad',
    //     '--disable-software-rasterizer',
    //     '--disable-dev-shm-usage',
    //     '--no-sandbox',
    //     '--disable-setuid-sandbox',
    //     '--allow-running-insecure-content',
    //     '--autoplay-policy=user-gesture-required',
    //     '--enable-features=NetworkService,NetworkServiceInProcess',
    //     '--hide-scrollbars',
    //     '--metrics-recording-only',
    //     '--mute-audio',
    //     '--no-default-browser-check',
    //     '--no-first-run',
    //     '--disable-background-networking'
    //   ],
    //   ignoreDefaultArgs: ['--enable-automation']
    });
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

    // ADD THIS RIGHT HERE:
    // 1. First try to handle cookie consent
    await handleCookieConsent(page);

    // 2. Then check for and solve puzzle slider if it appears
    const sliderSolved = await solvePuzzleSlider(page);
    if (!sliderSolved) {
    console.log('Puzzle slider did not appear or was already solved');
    }
   
    // Wait for videos to load
    await page.waitForSelector('div[data-e2e="challenge-item"]', { timeout: 60000 });
    
    // Scroll to load more videos
    let previousHeight;
    let videoData = [];
    
    while (videoData.length < CONFIG.tiktok.reelsCount) {
      // Extract video links and authors
      videoData = await page.evaluate(() => {
        const data = [];
        const videoElements = document.querySelectorAll('div[data-e2e="challenge-item"]');
        
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
    
    console.log(`Scraped ${videoData.length} TikTok videos with hashtag #${CONFIG.tiktok.hashtag}`);
    return videoData.slice(0, CONFIG.tiktok.reelsCount);
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
  const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: false ,
    args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-notifications',
        '--disable-popup-blocking',
        '--disable-web-security',
        '--disable-extensions',
        '--disable-default-apps',
        '--disable-component-extensions-with-background-pages',
        '--disable-component-update',
        '--disable-background-networking',
        '--disable-sync',
        '--disable-translate',
        '--disable-client-side-phishing-detection',
        '--disable-hang-monitor',
        '--disable-prompt-on-repost',
        '--disable-domain-reliability',
        '--disable-renderer-backgrounding',
        '--disable-ipc-flooding-protection',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-software-rasterizer',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--allow-running-insecure-content',
        '--autoplay-policy=user-gesture-required',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--hide-scrollbars',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-background-networking'
      ],
      ignoreDefaultArgs: ['--enable-automation']});
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
      const notNowButton = await page.waitForSelector('button:has-text("Not Now")', { timeout: 5000 });
      if (notNowButton) await notNowButton.click();
    } catch (error) {
      console.log('No save login prompt or already handled');
    }
    
    // Skip notifications if prompted
    try {
      const notNowNotifButton = await page.waitForSelector('button:has-text("Not Now")', { timeout: 5000 });
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
    
    console.log(`Scraped ${reelData.length} Instagram reels with hashtag #${CONFIG.instagram.hashtag}`);
    return reelData.slice(0, CONFIG.instagram.reelsCount);
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
    const instagramLinks = await scrapeInstagram();
    
    // Create Excel file with scraped links
    await createExcelFile(tiktokLinks, instagramLinks);
    
    console.log('Scraping completed successfully!');
    console.log(`Found ${tiktokLinks.length} TikTok videos and ${instagramLinks.length} Instagram reels with hashtag #${CONFIG.tiktok.hashtag}`);
  } catch (error) {
    console.error('Error running the scraper:', error);
  }
}

main();