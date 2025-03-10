# Frontend build stage
FROM node:18-slim AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files for dependency caching
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci

# Copy frontend source files
COPY frontend/src ./src
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY public ./public

# Build the frontend
RUN npm run build

# Backend build stage
FROM node:18-slim AS backend-builder

WORKDIR /app

# Install dependencies for canvas
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python-is-python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy package files for dependency caching
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy backend source files
COPY src ./src
COPY tsconfig*.json ./

# Build the backend
RUN npm run build

# Production stage
FROM node:18-slim

# Add metadata
LABEL version="1.5.3"
LABEL description="Pulse - A lightweight monitoring application for Proxmox VE"
LABEL maintainer="Richard Courtman <richard@courtman.me>"

# Install runtime dependencies for canvas and create a non-root user
RUN apt-get update && apt-get install -y --no-install-recommends \
    dumb-init \
    python3 \
    python-is-python3 \
    make \
    g++ \
    build-essential \
    pkg-config \
    libpixman-1-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r pulse && useradd -r -g pulse pulse

WORKDIR /app

# Copy only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files from builder stages
COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && chown -R pulse:pulse /app/logs

# Set environment variables
ENV PORT=7654
ENV NODE_ENV=production

# Switch to non-root user
USER pulse

# Expose the backend port
EXPOSE 7654

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"] 