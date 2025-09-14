FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# System deps for networking utilities
RUN apk add --no-cache iputils bind-tools traceroute whois procps

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . .

EXPOSE 8080
CMD ["node", "server.js"]

