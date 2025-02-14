# Pulse

## Description

Pulse is a monitoring dashboard application built with React, Vite, and Tailwind CSS. It provides real-time insights into your Proxmox server, allowing you to track key metrics and identify potential issues.

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

## Architecture

The application consists of two main components:
- A React application served by Vite's development server on port 5173
- An Express backend server running on port 3001 that proxies requests to your Proxmox server

The React application communicates with the backend through a configured proxy, allowing seamless API interactions while avoiding CORS issues.

## Installation

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

4. Create a .env file in the root directory with the following variables:
    ```
    PROXMOX_URL=https://your-proxmox-server:8006
    PROXMOX_AUTH=PVEAPIToken=root@pam!monitoring=your-token-here
    PORT=3001
    ```

## Usage

1. Start the development environment:

    You can start both the frontend and backend servers concurrently:
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

2. Open your browser and navigate to `http://localhost:5173`.

3. Build for production:
    ```bash
    npm run build
    ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.