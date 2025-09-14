# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    net-tools \
    iputils \
    bind-tools \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S rawrz -u 1001 -G nodejs

# Change ownership of the app directory
RUN chown -R rawrz:nodejs /app

# Switch to non-root user
USER rawrz

# Expose port (if needed for web interface)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node rawrz-standalone.js sysinfo || exit 1

# Default command
CMD ["node", "rawrz-standalone.js", "help"]