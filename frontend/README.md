# Pulse Frontend

A React-based frontend for real-time Proxmox VE monitoring with socket.io for live data updates.

## Features

- Real-time network data monitoring
- WebSocket communication with the backend
- Responsive Material UI design
- Automatic reconnection handling
- Cluster-aware VM and container display
- Customizable filters and views

## Requirements

- Node.js 18.x or higher
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
# or
yarn
```

2. Configure environment (if needed):

The frontend automatically connects to the backend on the same host and port. In most cases, you don't need to configure anything.

If you need to override the default settings, create a `.env` file in the root directory with:
```
VITE_API_URL=http://your-backend-url:7654
```

## Development

To start the development server:

```bash
# From the project root (recommended)
npm run dev

# Or from the frontend directory
npm run dev
```

This will start a development server at http://localhost:7654

The development server is configured to proxy API requests to the backend server running on port 7655.

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist` directory.

## Troubleshooting

If you're experiencing issues with real-time updates:

1. Check that the WebSocket server is running
2. Ensure your browser supports WebSockets
3. Check the network tab in your developer tools for any connection errors
4. Try accessing the application by IP address instead of localhost
5. Check the logs for WebSocket connection issues:
   ```bash
   npm run logs:websocket
   ```
6. Use the connection checker tool:
   ```bash
   node scripts/check-connections.js
   ```

For more detailed troubleshooting, see the [WebSocket Troubleshooting Guide](../docs/troubleshooting-websocket.md). 