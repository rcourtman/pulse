// Debug script to understand the filter UI structure
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting debug script...');
  
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1440, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the resources page
    await page.goto('http://localhost:7654/resources');
    console.log('Navigated to resources page');
    
    // Wait for the page to load
    await page.waitForSelector('#root');
    console.log('Page loaded');
    
    // Take a screenshot of the initial state
    await page.screenshot({ path: 'initial-state.png' });
    console.log('Initial screenshot taken');
    
    // Find and click the filter button
    const filterButtonSelector = 'button[data-filter-button="true"]';
    await page.waitForSelector(filterButtonSelector, { timeout: 5000 })
      .catch(() => console.log('Filter button selector not found'));
    
    // Try different selectors for the filter button
    const filterButtonFound = await page.evaluate(() => {
      const selectors = [
        'button[data-filter-button="true"]',
        'button:has(svg[data-testid="FilterAltIcon"])',
        'button.MuiButton-root:has(.MuiButton-startIcon)',
        'button:has(svg)',
        'button:contains("Filter")'
      ];
      
      for (const selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          console.log(`Selector ${selector} found ${elements.length} elements`);
          
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            console.log(`Element ${i}: ${el.outerHTML.substring(0, 100)}...`);
            
            // If this looks like a filter button, click it
            if (el.textContent.includes('Filter') || 
                el.getAttribute('data-filter-button') === 'true' ||
                el.getAttribute('aria-label')?.includes('Filter')) {
              console.log('Clicking filter button');
              el.click();
              return true;
            }
          }
        } catch (e) {
          console.log(`Error with selector ${selector}: ${e.message}`);
        }
      }
      
      // Try a more direct approach - find buttons with Filter text
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const button of buttons) {
        if (button.textContent.includes('Filter')) {
          console.log('Found button with Filter text, clicking it');
          button.click();
          return true;
        }
      }
      
      return false;
    });
    
    console.log(`Filter button found and clicked: ${filterButtonFound}`);
    
    // Wait for filter panel to appear
    await page.waitForTimeout(2000);
    
    // Take a screenshot with filter panel open
    await page.screenshot({ path: 'filter-panel-open.png' });
    console.log('Filter panel screenshot taken');
    
    // Debug the filter panel structure
    const filterPanelInfo = await page.evaluate(() => {
      const info = {
        inputs: [],
        sliders: [],
        buttons: [],
        filterPanelVisible: false
      };
      
      // Check if there's any visible dialog or panel that might be the filter panel
      const possiblePanels = document.querySelectorAll('.MuiDialog-root, .MuiDrawer-root, .MuiPopover-root, [role="dialog"], [role="menu"]');
      info.possiblePanelsCount = possiblePanels.length;
      
      for (const panel of possiblePanels) {
        if (window.getComputedStyle(panel).display !== 'none') {
          info.filterPanelVisible = true;
          info.panelHTML = panel.outerHTML.substring(0, 500) + '...';
          
          // Get inputs in the panel
          const inputs = panel.querySelectorAll('input');
          info.inputs = Array.from(inputs).map(input => ({
            type: input.type,
            placeholder: input.placeholder,
            id: input.id,
            name: input.name,
            value: input.value,
            outerHTML: input.outerHTML
          }));
          
          // Get sliders in the panel
          const sliders = panel.querySelectorAll('input[type="range"]');
          info.sliders = Array.from(sliders).map(slider => ({
            min: slider.min,
            max: slider.max,
            value: slider.value,
            id: slider.id,
            outerHTML: slider.outerHTML
          }));
          
          // Get buttons in the panel
          const buttons = panel.querySelectorAll('button');
          info.buttons = Array.from(buttons).map(button => ({
            text: button.textContent,
            type: button.type,
            outerHTML: button.outerHTML
          }));
          
          break;
        }
      }
      
      return info;
    });
    
    console.log('Filter panel info:', JSON.stringify(filterPanelInfo, null, 2));
    fs.writeFileSync('filter-panel-info.json', JSON.stringify(filterPanelInfo, null, 2));
    
    // Try to apply filters if the panel is visible
    if (filterPanelInfo.filterPanelVisible) {
      const filtersApplied = await page.evaluate(() => {
        const results = {
          searchApplied: false,
          slidersAdjusted: false,
          filtersApplied: false
        };
        
        // Find and fill the search input
        const searchInputs = document.querySelectorAll('input[type="text"]');
        for (const input of searchInputs) {
          if (input.placeholder && input.placeholder.toLowerCase().includes('search')) {
            console.log('Found search input, setting value to ubuntu');
            input.value = 'ubuntu';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            results.searchApplied = true;
            break;
          }
        }
        
        // Find and adjust sliders
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length > 0) {
          console.log(`Found ${sliders.length} sliders`);
          sliders[0].value = 50;
          sliders[0].dispatchEvent(new Event('input', { bubbles: true }));
          sliders[0].dispatchEvent(new Event('change', { bubbles: true }));
          
          if (sliders.length > 1) {
            sliders[1].value = 30;
            sliders[1].dispatchEvent(new Event('input', { bubbles: true }));
            sliders[1].dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          results.slidersAdjusted = true;
        }
        
        // Find and click apply button
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
          if (button.textContent.includes('Apply')) {
            console.log('Found Apply button, clicking it');
            button.click();
            results.filtersApplied = true;
            break;
          }
        }
        
        return results;
      });
      
      console.log('Filters applied:', JSON.stringify(filtersApplied, null, 2));
      
      // Wait for filters to be applied
      await page.waitForTimeout(2000);
      
      // Take a screenshot with filters applied
      await page.screenshot({ path: 'filters-applied.png' });
      console.log('Filters applied screenshot taken');
    }
    
    // Navigate to memory sort page
    await page.goto('http://localhost:7654/resources?sort=memory&order=desc');
    console.log('Navigated to memory sort page');
    
    // Wait for the page to load
    await page.waitForSelector('#root');
    await page.waitForTimeout(2000);
    
    // Take a screenshot of the memory sort page
    await page.screenshot({ path: 'memory-sort.png' });
    console.log('Memory sort screenshot taken');
    
    console.log('Debug script completed successfully');
  } catch (error) {
    console.error('Error in debug script:', error);
  } finally {
    await browser.close();
  }
})(); 