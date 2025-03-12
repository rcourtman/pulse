#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Define colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}       Pulse Application Launcher      ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Function to display options
show_options() {
  echo -e "\n${GREEN}Please select an environment to start:${NC}"
  echo -e "${YELLOW}1)${NC} Development (with real Proxmox data)"
  echo -e "${YELLOW}2)${NC} Development (with mock data)"
  echo -e "${YELLOW}3)${NC} Production"
  echo -e "${YELLOW}4)${NC} Docker Development"
  echo -e "${YELLOW}5)${NC} Docker Production"
  echo -e "${YELLOW}q)${NC} Quit"
  echo -e "\n${GREEN}Enter your choice:${NC} "
}

# Main menu loop
while true; do
  show_options
  read -r choice
  
  case $choice in
    1)
      echo -e "\n${BLUE}Starting development environment with real Proxmox data...${NC}"
      node scripts/start.js dev
      break
      ;;
    2)
      echo -e "\n${BLUE}Starting development environment with mock data...${NC}"
      node scripts/start.js mock
      break
      ;;
    3)
      echo -e "\n${BLUE}Starting production environment...${NC}"
      node scripts/start.js prod
      break
      ;;
    4)
      echo -e "\n${BLUE}Starting Docker development environment...${NC}"
      cp .env.example .env
      sed -i '' 's/NODE_ENV=production/NODE_ENV=development/' .env
      sed -i '' 's/DOCKERFILE=docker\/Dockerfile/DOCKERFILE=docker\/Dockerfile.dev/' .env
      sed -i '' 's/# DEV_SRC_MOUNT/DEV_SRC_MOUNT/' .env
      sed -i '' 's/# DEV_FRONTEND_SRC_MOUNT/DEV_FRONTEND_SRC_MOUNT/' .env
      sed -i '' 's/# DEV_FRONTEND_PUBLIC_MOUNT/DEV_FRONTEND_PUBLIC_MOUNT/' .env
      sed -i '' 's/# DEV_FRONTEND_INDEX_MOUNT/DEV_FRONTEND_INDEX_MOUNT/' .env
      sed -i '' 's/# DEV_FRONTEND_CONFIG_MOUNT/DEV_FRONTEND_CONFIG_MOUNT/' .env
      sed -i '' 's/# DEV_SCRIPTS_MOUNT/DEV_SCRIPTS_MOUNT/' .env
      sed -i '' 's/# DEV_ENV_MOUNT/DEV_ENV_MOUNT/' .env
      docker compose up --build
      break
      ;;
    5)
      echo -e "\n${BLUE}Starting Docker production environment...${NC}"
      cp .env.example .env
      docker compose up --build
      break
      ;;
    q|Q)
      echo -e "\n${BLUE}Exiting...${NC}"
      exit 0
      ;;
    *)
      echo -e "\n${YELLOW}Invalid option. Please try again.${NC}"
      ;;
  esac
done 