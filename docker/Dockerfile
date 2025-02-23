# Multi-stage build for production
FROM node:18-alpine as builder

# Build client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Build server
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built client files
COPY --from=builder /app/client/dist ./client/dist

# Copy server files and install production dependencies
COPY --from=builder /app/server/dist ./server/dist
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

EXPOSE 3000
CMD ["node", "dist/server.js"]