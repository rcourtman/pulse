# Screenshot Automation for Pulse for Proxmox VE

This document explains how to use the screenshot automation tool to keep the documentation images up-to-date with the latest UI changes.

## Quick Start

The easiest way to update screenshots is to use the provided npm script:

```bash
# From the project root
npm run screenshots
```

This script will:
1. Check if the development server is running with mock data enabled
2. Automatically start the server if needed (or restart it with mock data if it's running without mock data)
3. Run the screenshot tool with the default configuration
4. Save the screenshots to the `docs/images` directory
5. Clean up by stopping any servers it started

## Configuration

The screenshot tool is configured via a JSON file located at `tools/screenshot-automation/screenshot-config.json`. This file defines which screenshots to take, their sizes, and other options.

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

## Adding New Screenshots

To add a new screenshot:

1. Open `tools/screenshot-automation/screenshot-config.json`
2. Add a new entry to the `screenshots` array:
   ```json
   {
     "path": "/your-page-path",
     "name": "your-screenshot-name",
     "waitForSelector": ".your-element-selector",
     "createSplitView": true
   }
   ```
3. Run `npm run screenshots` to generate the new screenshot

## Cropping Specific UI Elements

To capture just a specific part of the UI (e.g., a new feature):

```json
{
  "path": "/",
  "name": "feature-highlight",
  "waitForSelector": ".feature-element",
  "cropRegion": {
    "x": 100,
    "y": 200,
    "width": 400,
    "height": 300
  }
}
```

## Split View (Light/Dark Mode)

The tool can create split-view images showing both light and dark modes:

```json
{
  "path": "/settings",
  "name": "settings",
  "createSplitView": true,
  "splitViewConfig": {
    "type": "diagonal"  // or "vertical"
  }
}
```

## Advanced Usage

For more advanced usage, you can use the tool directly:

```bash
# From the project root
npm run screenshots:tool -- --config custom-config.json --url http://localhost:9000
```

Or from the tool directory:

```bash
cd tools/screenshot-automation
./update-screenshots.sh --help
```

## Troubleshooting

- **Error: Failed to build the screenshot tool**: Check for TypeScript errors in the tool code
- **Error: Waiting for selector timed out**: Ensure the selector exists on the page
- **Screenshots look wrong**: Check that the viewport size and selectors are correct
- **Server fails to start automatically**: You can manually start the server with `npm run dev:mock` before running the screenshot tool
- **Server doesn't shut down properly**: You can manually stop any running servers with `npm run dev:kill:all`

## Recommended Workflow

1. Make UI changes to the application
2. Run `npm run screenshots` to update all screenshots
3. Verify the screenshots look good
4. Commit the changes to the repository