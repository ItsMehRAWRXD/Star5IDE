# RawrZ Security Platform - Production Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for security tools
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    openssh-client \
    openssl \
    python3 \
    py3-pip \
    build-base \
    linux-headers

# Create non-root user for security
RUN addgroup -g 1001 -S rawrz && \
    adduser -S rawrz -u 1001

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads data logs && \
    chown -R rawrz:rawrz /app

# Switch to non-root user
USER rawrz

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node rawrz-standalone.js sysinfo > /dev/null || exit 1

# Expose port (if you add web interface later)
EXPOSE 3000

# Default command
CMD ["node", "rawrz-standalone.js", "help"]