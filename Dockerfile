# RawrZ Security Platform - Docker Container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    curl \
    wget \
    net-tools \
    bind-tools \
    iputils \
    tcpdump \
    nmap \
    openssl \
    ca-certificates

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p uploads data logs

# Set permissions
RUN chmod +x rawrz-standalone.js

# Expose port for web interface (if needed)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node rawrz-standalone.js sysinfo || exit 1

# Default command
CMD ["node", "rawrz-standalone.js", "help"]