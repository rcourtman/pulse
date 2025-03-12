const puppeteer = require('puppeteer');

async function debugFilterUI() {
  console.log('Starting filter UI debug script');
  
  const browser = await puppeteer.launch({
    headless: false, // Use non-headless mode to see what's happening
    defaultViewport: { width: 1440, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logs from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to the resources page
    console.log('Navigating to the resources page');
    await page.goto('http://localhost:7654/resources', { waitUntil: 'networkidle2' });
    
    // Wait for the page to load
    console.log('Waiting for page to load');
    await page.waitForSelector('#root');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Set up mock data
    console.log('Setting up mock data');
    await page.evaluate(() => {
      window.localStorage.setItem('use_mock_data', 'true');
      window.localStorage.setItem('MOCK_DATA_ENABLED', 'true');
      window.localStorage.setItem('mock_enabled', 'true');
      console.log('Mock data flags set in localStorage');
    });
    
    // Reload the page to apply mock data
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('#root');
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
    
    // Find all buttons on the page
    console.log('Finding all buttons on the page');
    const buttons = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map(button => {
        const rect = button.getBoundingClientRect();
        return {
          text: button.textContent.trim(),
          classes: button.className,
          id: button.id,
          attributes: Array.from(button.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' '),
          visible: rect.width > 0 && rect.height > 0 && window.getComputedStyle(button).display !== 'none',
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        };
      });
    });
    
    console.log('Found', buttons.length, 'buttons on the page');
    buttons.forEach((button, index) => {
      console.log(`Button ${index + 1}:`, button);
    });
    
    // Try to find and click the filter button
    console.log('Attempting to find and click the filter button');
    const filterButtonClicked = await page.evaluate(() => {
      // Try different selectors
      const selectors = [
        'button[data-filter-button="true"]',
        'button.MuiButton-root:has(svg[data-testid="FilterAltIcon"])',
        'button.MuiButton-root:has(.MuiSvgIcon-root)',
        'button:has(svg[data-testid="FilterAltIcon"])',
        'button:has(.MuiSvgIcon-root)',
        'button.MuiButton-startIcon',
        'button.filter-button',
        'button:contains("Filter")'
      ];
      
      for (const selector of selectors) {
        try {
          const button = document.querySelector(selector);
          if (button) {
            console.log(`Found filter button with selector: ${selector}`);
            button.click();
            return true;
          }
        } catch (err) {
          console.log(`Error with selector ${selector}: ${err.message}`);
        }
      }
      
      // Try buttons with filter-related text
      const allButtons = Array.from(document.querySelectorAll('button'));
      const filterButtons = allButtons.filter(btn => 
        btn.textContent.toLowerCase().includes('filter') || 
        btn.innerHTML.toLowerCase().includes('filter')
      );
      
      if (filterButtons.length > 0) {
        console.log(`Found ${filterButtons.length} buttons with 'filter' text`);
        filterButtons[0].click();
        return true;
      }
      
      return false;
    });
    
    if (filterButtonClicked) {
      console.log('Filter button clicked, waiting for panel to appear');
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 3000)));
      
      // Check if filter panel is visible
      const filterPanelInfo = await page.evaluate(() => {
        const possiblePanels = [
          document.querySelector('.MuiDrawer-root'),
          document.querySelector('.filter-panel'),
          document.querySelector('.filter-drawer'),
          document.querySelector('[role="dialog"]')
        ].filter(Boolean);
        
        if (possiblePanels.length > 0) {
          return possiblePanels.map(panel => ({
            classes: panel.className,
            id: panel.id,
            attributes: Array.from(panel.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' '),
            html: panel.outerHTML.substring(0, 500) + '...' // First 500 chars to avoid huge output
          }));
        }
        
        return null;
      });
      
      if (filterPanelInfo) {
        console.log('Filter panel found:', filterPanelInfo);
      } else {
        console.log('No filter panel found after clicking button');
      }
    } else {
      console.log('Could not find or click filter button');
    }
    
    // Take a screenshot for reference
    console.log('Taking screenshot');
    await page.screenshot({ path: 'filter-debug.png' });
    
    console.log('Debug script completed');
  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    // Keep the browser open for manual inspection
    console.log('Debug script finished. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close the browser when done.');
  }
}

debugFilterUI(); 