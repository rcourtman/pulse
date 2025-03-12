#!/bin/bash

# Make script executable if it isn't already
chmod +x "$0"

# Default values
BUILD=false
RUN=false
DETACHED=false
CLEANUP=false
HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --build)
      BUILD=true
      shift
      ;;
    --run)
      RUN=true
      shift
      ;;
    --detached)
      DETACHED=true
      shift
      ;;
    --cleanup)
      CLEANUP=true
      shift
      ;;
    --help)
      HELP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      HELP=true
      shift
      ;;
  esac
done

# Display help
if [ "$HELP" = true ]; then
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --build     Build the Docker image"
  echo "  --run       Run the Docker container"
  echo "  --detached  Run in detached mode (background)"
  echo "  --cleanup   Remove existing containers and images"
  echo "  --help      Display this help message"
  exit 0
fi

# Ensure we're in the project root directory
if [ ! -f "docker-compose.yml" ]; then
  echo "Error: docker-compose.yml not found. Please run this script from the project root directory."
  exit 1
fi

# Ensure .env file exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
  else
    echo "Error: .env file not found and .env.example is missing."
    exit 1
  fi
fi

# Cleanup if requested
if [ "$CLEANUP" = true ]; then
  echo "Cleaning up Docker resources..."
  docker compose down --rmi all --volumes --remove-orphans
  exit 0
fi

# Build if requested
if [ "$BUILD" = true ]; then
  echo "Building Docker image..."
  docker compose build
fi

# Run if requested
if [ "$RUN" = true ]; then
  # Stop any existing containers
  echo "Stopping any existing containers..."
  docker compose down
  
  # Run the container
  if [ "$DETACHED" = true ]; then
    echo "Starting container in detached mode..."
    docker compose up -d
  else
    echo "Starting container..."
    docker compose up
  fi
fi

# If no action specified, show help
if [ "$BUILD" = false ] && [ "$RUN" = false ] && [ "$CLEANUP" = false ]; then
  echo "No action specified. Use --build, --run, or --cleanup."
  echo "Run with --help for more information."
  exit 1
fi 