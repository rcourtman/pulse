# Developer Documentation

This document provides detailed information about the Proxmox Pulse codebase structure, key components, and design decisions to help new contributors understand the project.

## Project Architecture

Proxmox Pulse uses a modern web application architecture with a Node.js backend and a React frontend:

```
pulse/
├── src/                  # Backend source code
│   ├── api/              # API routes and controllers
│   ├── config/           # Configuration settings
│   ├── mock/             # Mock data implementation
│   ├── routes/           # Express routes
│   ├── scripts/          # Backend utility scripts
│   ├── services/         # Business logic and external services
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── websocket/        # WebSocket implementation
│   └── server.ts         # Main server entry point
├── frontend/             # Frontend React application
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── constants/    # Application constants
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   ├── App.jsx       # Main application component
│   │   └── main.jsx      # Entry point
│   └── public/           # Static assets
├── scripts/              # Utility scripts
├── docs/                 # Documentation
│   ├── images/           # Documentation images
│   └── *.md              # Markdown documentation files
└── tools/                # Development tools
```

## Key Components

### Backend

#### Proxmox API Client (`src/api/proxmox-client.ts`)

This service handles all communication with the Proxmox API. It:
- Authenticates with Proxmox servers
- Retrieves node, VM, and container information
- Polls for updates at configured intervals
- Handles error conditions and retries

#### Mock Data Implementation (`src/mock/`)

The mock data implementation:
- Provides a standalone mock server (`src/mock/server.ts`)
- Generates realistic VM and container data with meaningful names
- Implements a mock client (`src/api/mock-client.ts`) that mimics the real Proxmox client
- Uses templates (`src/mock/templates.ts`) for VM and container names and OS types

#### WebSocket Server (`src/websocket/server.js`)

The WebSocket server:
- Broadcasts real-time updates to connected clients
- Manages client connections
- Handles authentication and authorization
- Implements message queuing for reliability

#### Metrics Collection (`src/services/metrics.js`)

This service:
- Collects and processes metrics from Proxmox nodes
- Calculates derived metrics (averages, trends)
- Maintains historical data for the configured retention period
- Optimizes data for transmission to clients

### Frontend

#### Dashboard Components (`frontend/src/components/Dashboard/`)

The dashboard components:
- Display summary information for all nodes
- Show resource usage charts
- Provide filtering and sorting options
- Handle responsive layouts for different screen sizes

#### Resource Monitoring (`frontend/src/components/Resources/`)

These components:
- Display detailed resource information for VMs and containers
- Implement real-time updates via WebSocket
- Provide filtering and search functionality
- Visualize resource usage with charts and graphs

#### Network Display (`frontend/src/components/NetworkDisplay/`)

The network display components:
- Show detailed information about VMs and containers
- Provide filtering by system type and visibility
- Implement search functionality
- Support exporting data with additional fields (Type, ID, Uptime)

#### WebSocket Client (`frontend/src/services/websocket.js`)

The WebSocket client:
- Establishes and maintains connection to the server
- Handles reconnection logic
- Processes incoming messages
- Dispatches updates to the application state

## Design Decisions

### Split Development Architecture

We use a split architecture during development:
- Backend server (port 7655): Handles Proxmox API communication
- Frontend server (port 7654): Provides hot reloading for React
- Mock data server (port 7655): Generates mock data for development

This separation allows for:
- Independent development of frontend and backend
- Better developer experience with hot reloading
- Clear separation of concerns
- Development without a real Proxmox server

In production, these are combined into a single service.

### Mock Data Development

The mock data implementation allows developers to:
- Develop and test without a real Proxmox server
- Work with realistic data that mimics production environments
- Test edge cases and error conditions
- Develop UI components with consistent data

To use mock data during development:
- Run `npm run dev:mock` to start the application with mock data
- Edit `src/mock/templates.ts` to customize the mock data
- Check logs at `/tmp/pulse-mock-server.log` for debugging

### Real-time Updates

We chose WebSockets for real-time updates because:
- They provide lower latency than polling
- They reduce server load compared to frequent HTTP requests
- They enable push notifications for important events
- They work well with the reactive nature of the frontend

### State Management

The frontend uses a combination of:
- React Context for global state
- React Query for server state
- Local component state for UI-specific state

This approach:
- Minimizes unnecessary re-renders
- Separates server and client state concerns
- Provides optimistic updates for better UX

### Error Handling

We implement comprehensive error handling:
- Backend errors are logged and monitored
- API errors are retried with exponential backoff
- User-facing errors are displayed with actionable information
- Critical errors trigger notifications

## Performance Considerations

### Data Optimization

To ensure good performance:
- We minimize data sent over the wire by filtering server-side
- We use compression for WebSocket messages
- We implement pagination for large datasets
- We optimize polling intervals based on data volatility

### Rendering Optimization

The frontend optimizes rendering by:
- Using React.memo for expensive components
- Implementing virtualized lists for large datasets
- Debouncing rapidly changing values
- Using web workers for CPU-intensive operations

## Testing

### Backend Testing

Backend tests focus on:
- Unit tests for business logic
- Integration tests for API endpoints
- Mock tests for external services

### Frontend Testing

Frontend tests include:
- Component tests with React Testing Library
- Hook tests for custom hooks
- End-to-end tests for critical user flows

## Common Development Tasks

### Development Environment Setup

To set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/rcourtman/pulse.git
   cd pulse
   ```

2. Install dependencies:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env
   # Edit .env with your Proxmox details or use mock data
   ```

4. Start the development server:
   ```bash
   # With mock data (local)
   npm run dev
   
   # With mock data (Docker)
   npm run dev:docker
   
   # With real Proxmox servers (local)
   npm run prod
   
   # With real Proxmox servers (Docker)
   npm run prod:docker
   ```

### Environment Configuration

Pulse uses a single `.env` file for configuration. When running in development mode, the application automatically sets development-specific environment variables:

```bash
NODE_ENV=development
USE_MOCK_DATA=true
MOCK_DATA_ENABLED=true
```

You can override these settings in your `.env` file if needed.

### Testing Cluster Mode with Mock Data

When using mock data, Pulse simulates nodes that are part of a cluster by default. This allows you to test the cluster detection and handling functionality without needing a real Proxmox cluster.

You can control this behavior with these environment variables:

```bash
# Set to 'false' to disable mock cluster mode
MOCK_CLUSTER_ENABLED=true
# Custom name for the mock cluster
MOCK_CLUSTER_NAME=mock-cluster
```

### Adding a New Metric

To add a new metric:
1. Add the metric to the Proxmox API client
2. Update the metrics processing service
3. Add the metric to the WebSocket payload
4. Create or update frontend components to display the metric
5. Add tests for the new functionality

### Adding a New Feature

When adding a new feature:
1. Create an issue describing the feature
2. Discuss the implementation approach
3. Implement backend changes
4. Implement frontend changes
5. Add tests
6. Update documentation

### Updating Screenshots

To update the screenshots in the documentation:
1. Make sure the application is running with the desired state
2. Run the screenshot script:
   ```bash
   npm run screenshots
   ```
3. The screenshots will be saved to the `docs/images/` directory

## Troubleshooting

### Common Development Issues

- **WebSocket connection issues**: Check that both servers are running and ports are not blocked
- **Hot reloading not working**: Verify that the Vite dev server is running correctly
- **API errors**: Check the Proxmox API token permissions and server connectivity
- **Build errors**: Ensure all dependencies are installed and compatible
- **Mock data server not starting**: Check the logs at `/tmp/pulse-mock-server.log`

### Debugging Tips

- Use the browser developer tools to inspect network requests and WebSocket messages
- Check the server logs for backend errors
- Use React DevTools to inspect component state and props
- Set `LOG_LEVEL=debug` in your .env file for more verbose logging
- For mock data issues, check the mock server logs at `/tmp/pulse-mock-server.log`

### Killing Running Servers

If you need to kill running servers:
```bash
# Kill all development servers
npm run dev:kill:all

# Kill only backend servers
npm run dev:kill:backend

# Kill only frontend servers
npm run dev:kill:frontend
``` 