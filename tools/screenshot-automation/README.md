# Screenshot Automation Tool for Pulse for Proxmox VE

This tool automates the process of taking screenshots for the Pulse for Proxmox VE application documentation. It can capture screenshots in both light and dark modes, create split-view images, and crop specific regions of the UI.

## Features

- Capture screenshots of any page/route in the application
- Support for both light and dark mode
- Create split-view images (diagonal or vertical) showing both modes
- Crop specific regions for feature highlights
- Configurable via JSON

## Installation

```bash
# Navigate to the screenshot tool directory
cd tools/screenshot-automation

# Install dependencies
npm install

# Build the tool
npm run build
```

## Usage

### Basic Usage

```bash
# From the project root directory
npm run screenshots

# Or from the screenshot tool directory
cd tools/screenshot-automation
npm start
```

### Command Line Options

```bash
# Specify a custom config file
npm run screenshots -- --config custom-config.json

# Override the base URL
npm run screenshots -- --url http://localhost:9000

# Override the output directory
npm run screenshots -- --output custom/output/dir
```

## Configuration

The tool is configured via a JSON file. By default, it looks for `screenshot-config.json` in the current directory.

### Example Configuration

```json
{
  "baseUrl": "http://localhost:7654",
  "outputDir": "docs/images",
  "screenshots": [
    {
      "path": "/",
      "name": "dashboard",
      "viewportSize": {
        "width": 1920,
        "height": 1080
      },
      "waitForSelector": ".dashboard-container",
      "createSplitView": true,
      "splitViewConfig": {
        "type": "diagonal"
      }
    },
    {
      "path": "/resources",
      "name": "resources",
      "viewportSize": {
        "width": 1920,
        "height": 1080
      },
      "waitForSelector": ".resources-container",
      "createSplitView": true,
      "splitViewConfig": {
        "type": "vertical"
      }
    }
  ]
}
```

### Configuration Options

- `baseUrl`: The base URL of the application (default: `http://localhost:7654`)
- `outputDir`: The directory where screenshots will be saved (default: `docs/images`)
- `screenshots`: An array of screenshot definitions

#### Screenshot Definition

- `path`: The path/route to navigate to
- `name`: The name of the screenshot (used for the output filename)
- `viewportSize`: The viewport size for the screenshot (default: `{ width: 1920, height: 1080 }`)
- `waitForSelector`: A CSS selector to wait for before taking the screenshot
- `cropRegion`: A region to crop from the screenshot (optional)
  - `x`: The x-coordinate of the top-left corner
  - `y`: The y-coordinate of the top-left corner
  - `width`: The width of the region
  - `height`: The height of the region
- `createSplitView`: Whether to create a split-view image showing both light and dark modes (optional)
- `splitViewConfig`: Configuration for the split-view (optional)
  - `type`: The type of split (`diagonal` or `vertical`)

## Manual Workflow for Updating Screenshots

Here's a recommended workflow for updating screenshots when you make UI changes:

1. **Start the development server**:
   ```bash
   npm run dev:start
   ```

2. **Make your UI changes** and verify they look good in the browser.

3. **Update the screenshot configuration** if needed:
   - Add new screenshots for new features
   - Adjust crop regions for changed components
   - Edit `tools/screenshot-automation/screenshot-config.json`

4. **Run the screenshot tool**:
   ```bash
   npm run screenshots
   ```

5. **Verify the screenshots** in the `docs/images` directory.

6. **Commit the changes**:
   ```bash
   git add docs/images/*.png
   git commit -m "Update screenshots for latest UI changes"
   git push
   ```

## Troubleshooting

- **Error: Browser not initialized**: Make sure you call `initialize()` before taking screenshots
- **Error: Failed to load config file**: Check that your config file exists and is valid JSON
- **Error: Navigation timeout**: Increase the timeout or check that the application is running
- **Error: Waiting for selector timed out**: Check that the selector exists on the page 