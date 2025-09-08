# Production Dockerfile for RawrZ Security Platform
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package.prod.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY scripts/ ./scripts/

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S rawrz -u 1001

# Set ownership
RUN chown -R rawrz:nodejs /app
USER rawrz

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js

# Start the application
CMD ["node", "src/app.js"]