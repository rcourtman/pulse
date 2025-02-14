# Pulse

## Description

Pulse is a monitoring dashboard application built with React, Vite, and Tailwind CSS. It provides real-time insights into your Proxmox server, allowing you to track key metrics and identify potential issues.

## Technologies Used

*   React
*   Vite
*   Tailwind CSS
*   Node.js
*   @radix-ui/react-dialog
*   @radix-ui/react-icons
*   @radix-ui/react-label
*   @radix-ui/react-select
*   @radix-ui/react-slider
*   @radix-ui/react-slot
*   @radix-ui/react-switch
*   @radix-ui/react-tooltip
*   axios
*   chart.js
*   class-variance-authority
*   clsx
*   dotenv
*   express
*   http-proxy-middleware
*   lucide-react
*   node-fetch
*   react-chartjs-2
*   tailwind-merge

## Architecture

The application consists of two main components:
- A React application served by Vite's development server on port 5173
- An Express backend server running on port 3001 that proxies requests to your Proxmox server

The React application communicates with the backend through a configured proxy, allowing seamless API interactions while avoiding CORS issues.

## Installation

1.  Clone the repository:

    ```bash
    git clone <repository_url>
    ```
2.  Navigate to the project directory:

    ```bash
    cd pulse
    ```
3.  Install the dependencies:

    ```bash
    npm install
    ```
4.  Create a .env file in the root directory with the following variables:

    ```
    PROXMOX_URL=https://your-proxmox-server:8006
    PROXMOX_AUTH=PVEAPIToken=root@pam!monitoring=your-token-here
    PORT=3001
    ```

## Usage

1.  Start the development environment:

    ```bash
    npm run dev
    ```
    This command will start:
    - Vite's development server serving the React application at `http://localhost:5173`
    - The Express backend server at `http://localhost:3001`

2.  Open your browser and navigate to `http://localhost:5173`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.