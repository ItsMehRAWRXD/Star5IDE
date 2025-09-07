# Use Node.js 18 LTS
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm install

# Copy source code
COPY . .

# Create public directory and copy IDE dashboard
RUN mkdir -p public && \
    cp rawraw-site/ide-dashboard.html public/index.html

# Install frontend dependencies for TypeScript platform
RUN cd "rawraw-site/SaaS Crypting Platform/SaaSEncryptionSecurity/1" && npm install

# Build the frontend
RUN cd "rawraw-site/SaaS Crypting Platform/SaaSEncryptionSecurity/1" && npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]