# social-media-scraper

# Social Media Reels Scraper Guide

## Installation

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher recommended)

2. Create a new directory for your project and navigate to it:

   ```
   mkdir social-media-scraper
   cd social-media-scraper
   ```

3. Create the `package.json` and `social-media-scraper.js` files with the content provided

4. Install the required dependencies:
   ```
   npm install
   ```

## Configuration

Before running the script, you need to update the configuration in the `social-media-scraper.js` file:

1. Update the Instagram credentials with your username and password:

   ```javascript
   instagram: {
     username: 'YOUR_INSTAGRAM_USERNAME',
     password: 'YOUR_INSTAGRAM_PASSWORD',
     targetAccount: 'target_account', // Replace with the Instagram account to scrape
     reelsCount: 10 // Number of reels to scrape
   }
   ```

2. Update the TikTok target account:

   ```javascript
   tiktok: {
     targetAccount: 'target_account', // Replace with the TikTok account to scrape
     reelsCount: 10 // Number of TikTok videos to scrape
   }
   ```

3. Optionally, update the output file path:
   ```javascript
   outputFilePath: path.join(__dirname, "social_media_links.xlsx");
   ```

## Running the Scraper

To run the scraper, execute:

```
npm start
```

The script will:

1. Open a browser and navigate to TikTok to scrape videos from the specified account
2. Open another browser and log in to Instagram to scrape reels from the specified account
3. Save all the collected links to an Excel file with separate sheets for TikTok and Instagram

## Notes and Limitations

- The script uses a non-headless browser so you can see the scraping process
- Instagram requires login to access content; make sure your credentials are correct
- TikTok and Instagram may apply rate limiting or bot detection
- The scraper may need adjustments as websites update their structure
- Be respectful of the platforms' terms of service and rate limits

## Troubleshooting

- If the script fails to find elements, it may be due to website structure changes
- Increase timeouts if you have a slow connection
- Try reducing the number of reels/videos to scrape if you encounter issues
- Make sure your Instagram credentials are correct if login fails
