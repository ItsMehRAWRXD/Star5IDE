FROM node:20-alpine

WORKDIR /app

# Install runtime tools used by some CLI commands (ping, traceroute alternatives, whois)
RUN apk add --no-cache iputils bind-tools whois traceroute procps coreutils

COPY package.json package-lock.json* ./
RUN npm ci || npm install --no-audit --no-fund

COPY . .

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]

