# Pulse

## Description

Pulse is a monitoring dashboard application built with React, Vite, and Tailwind CSS. It provides real-time insights into your Proxmox server, allowing you to track key metrics and identify potential issues.

## Features

### Real-time Monitoring
- CPU, Memory, Disk, and Network usage tracking
- Color-coded thresholds for quick status identification
- Configurable alert thresholds with toggle option
- Service pinning for priority monitoring

### Customizable Settings
- Adjustable threshold values for all metrics
- Enable/disable threshold indicators
- Pin important services to the top
- Sort by any metric

### Easy Onboarding
- Interactive setup wizard
- Step-by-step guide for creating Proxmox API tokens
- Automatic token validation
- Secure credential storage

## Quick Start

1. Clone the repository:
    ```bash
    git clone <repository_url>
    ```

2. Navigate to the project directory:
    ```bash
    cd pulse
    ```

3. Install the dependencies:
    ```bash
    npm install
    ```

4. Start the development environment:
    ```bash
    npm run dev
    ```

5. Open your browser and navigate to `http://localhost:5173`

6. Follow the onboarding wizard to connect to your Proxmox server

## Connecting to Proxmox

The application includes an interactive setup wizard that will guide you through:

1. Creating a Proxmox API token
2. Configuring your connection
3. Validating your credentials

### Manual Token Creation

If you prefer to create the token manually:

1. Log in to your Proxmox VE web interface
2. Navigate to Datacenter → Permissions → API Tokens
3. Click "Add" to create a new API token
4. Select a user (e.g., root@pam)
5. Enter "monitoring" as the token ID
6. ⚠️ IMPORTANT: Uncheck "Privilege Separation"
7. Click "Add" and save the token value securely

## Architecture

The application consists of two main components:
- A React application served by Vite's development server on port 5173
- An Express backend server running on port 3001 that proxies requests to your Proxmox server

The React application communicates with the backend through a configured proxy, allowing seamless API interactions while avoiding CORS issues.

## Technologies Used

### Core Dependencies
* React ^18.2.0
* React DOM ^18.2.0
* Vite ^5.1.4
* Tailwind CSS ^3.4.17
* Node.js with Express ^4.21.2

### UI Components & Styling
* @radix-ui/react-dialog ^1.1.6
* @radix-ui/react-icons ^1.3.0
* @radix-ui/react-label ^2.1.2
* @radix-ui/react-select ^2.1.6
* @radix-ui/react-slider ^1.2.3
* @radix-ui/react-slot ^1.1.2
* @radix-ui/react-switch ^1.1.3
* @radix-ui/react-tooltip ^1.1.8
* lucide-react ^0.350.0
* class-variance-authority ^0.7.1
* clsx ^2.1.1
* tailwind-merge ^3.0.1

### Data Visualization & API
* chart.js ^4.4.7
* react-chartjs-2 ^5.3.0
* axios ^1.6.7
* node-fetch ^3.3.2
* http-proxy-middleware ^3.0.3
* dotenv ^16.4.7

### Development Dependencies
* @vitejs/plugin-react ^4.2.1
* autoprefixer ^10.4.20
* concurrently ^9.1.2
* postcss ^8.5.2
* @types/react ^18.2.56
* @types/react-dom ^18.2.19

## Development

To start both the frontend and backend servers concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Start Vite development server
npm run dev:vite

# Start Express backend server
npm run dev:server
```

The servers will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Production Build

To build for production:
```bash
npm run build
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.