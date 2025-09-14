# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies separately for better caching
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy app source
COPY . .

# Create runtime dirs
RUN mkdir -p uploads logs

EXPOSE 8080
CMD ["npm", "start"]

