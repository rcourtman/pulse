#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to print a section header
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to print a success message
print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Function to print a warning message
print_warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print an error message
print_error() {
  echo -e "${RED}✗ $1${NC}"
}

# Function to print a step
print_step() {
  echo -e "${BLUE}$1${NC}"
}

# Welcome message
clear
echo -e "${BLUE}"
echo "  _____      _            _____           _        _ _           "
echo " |  __ \    | |          |_   _|         | |      | | |          "
echo " | |__) |   | |___  ___    | |  _ __  ___| |_ __ _| | | ___ _ __ "
echo " |  ___/ | | / __|/ _ \   | | | '_ \/ __| __/ _\` | | |/ _ \ '__|"
echo " | |   | |_| \__ \  __/  _| |_| | | \__ \ || (_| | | |  __/ |   "
echo " |_|    \__,_|___/\___| |_____|_| |_|___/\__\__,_|_|_|\___|_|   "
echo -e "${NC}"
echo -e "Welcome to the Pulse installation script!\n"

# Ask for installation type
print_header "Installation Type"
echo "Please select the type of installation:"
echo "1) Production - connect to a real Proxmox server"
echo "2) Development - use with mock data (no Proxmox server needed)"
read -p "Enter your choice (1/2) [1]: " install_type
install_type=${install_type:-1}

# Set environment variables based on installation type
if [ "$install_type" = "1" ]; then
  # Production with real Proxmox
  NODE_ENV="production"
  USE_MOCK_DATA="false"
  MOCK_DATA_ENABLED="false"
  echo "Set up for production with real Proxmox server"
elif [ "$install_type" = "2" ]; then
  # Development with mock data
  NODE_ENV="development"
  USE_MOCK_DATA="true"
  MOCK_DATA_ENABLED="true"
  echo "Set up for development with mock data"
else
  print_error "Invalid choice. Exiting."
  exit 1
fi

# Check for Docker
print_header "Checking System Requirements"
if command_exists docker; then
  print_success "Docker is installed ($(docker --version))"
else
  print_error "Docker is not installed. Please install Docker before continuing."
  echo "Visit https://docs.docker.com/get-docker/ for installation instructions."
  exit 1
fi

# Check for Docker Compose
if command_exists docker-compose; then
  print_success "Docker Compose is installed ($(docker-compose --version))"
elif docker compose version >/dev/null 2>&1; then
  print_success "Docker Compose plugin is installed ($(docker compose version))"
else
  print_warning "Docker Compose is not installed. It's recommended for easier management."
  echo "Visit https://docs.docker.com/compose/install/ for installation instructions."
fi

# Create .env file if it doesn't exist
print_header "Environment Configuration"
if [ -f ".env" ]; then
  print_warning "An existing .env file was found."
  read -p "Do you want to create a new one? This will overwrite the existing file. (y/n) [n]: " create_new_env
  create_new_env=${create_new_env:-n}
else
  create_new_env="y"
fi

if [ "$create_new_env" = "y" ] || [ "$create_new_env" = "Y" ]; then
  echo "Creating new .env file..."
  
  # Copy the example file
  cp .env.example .env
  
  # Update the .env file with the installation type
  sed -i.bak "s/NODE_ENV=.*/NODE_ENV=$NODE_ENV/" .env
  sed -i.bak "s/USE_MOCK_DATA=.*/USE_MOCK_DATA=$USE_MOCK_DATA/" .env
  sed -i.bak "s/MOCK_DATA_ENABLED=.*/MOCK_DATA_ENABLED=$MOCK_DATA_ENABLED/" .env
  rm -f .env.bak
  
  print_success "Created new .env file with $NODE_ENV configuration"
  
  # If using real Proxmox, ask for server details
  if [ "$install_type" = "1" ]; then
    print_step "Please enter your Proxmox server details:"
    
    read -p "Proxmox Host URL (e.g., https://proxmox.local:8006): " proxmox_host
    read -p "Proxmox Node Name (e.g., pve): " proxmox_node
    read -p "Proxmox API Token ID (e.g., root@pam!pulse): " proxmox_token_id
    read -p "Proxmox API Token Secret: " proxmox_token_secret
    
    # Update the .env file with Proxmox details if provided
    if [ -n "$proxmox_host" ]; then
      sed -i.bak "s|PROXMOX_HOST=.*|PROXMOX_HOST=$proxmox_host|" .env
    fi
    
    if [ -n "$proxmox_node" ]; then
      sed -i.bak "s/PROXMOX_NODE=.*/PROXMOX_NODE=$proxmox_node/" .env
    fi
    
    if [ -n "$proxmox_token_id" ]; then
      sed -i.bak "s/PROXMOX_TOKEN_ID=.*/PROXMOX_TOKEN_ID=$proxmox_token_id/" .env
    fi
    
    if [ -n "$proxmox_token_secret" ]; then
      sed -i.bak "s/PROXMOX_TOKEN_SECRET=.*/PROXMOX_TOKEN_SECRET=$proxmox_token_secret/" .env
    fi
    
    rm -f .env.bak
    print_success "Updated .env file with Proxmox configuration"
  fi
else
  print_success "Using existing .env file"
fi

# Ask if the user wants to run the setup script
print_header "Setup"
read -p "Do you want to run the application now? (y/n) [y]: " run_setup
run_setup=${run_setup:-y}

if [ "$run_setup" = "y" ] || [ "$run_setup" = "Y" ]; then
  if [ "$install_type" = "1" ]; then
    echo "Starting Pulse with Proxmox connection..."
    npm run prod:docker
  else
    echo "Starting Pulse with mock data..."
    npm run dev:docker
  fi
else
  echo -e "\nTo start Pulse later, run one of the following commands:"
  echo -e "  - For production: ${GREEN}npm run prod:docker${NC}"
  echo -e "  - For development with mock data: ${GREEN}npm run dev:docker${NC}"
fi

print_header "Installation Complete"
echo "Thank you for installing Pulse!"
echo "Access the dashboard at http://localhost:7654"
echo -e "For more information, see the ${BLUE}README.md${NC} file or visit ${BLUE}https://github.com/rcourtman/pulse${NC}" 