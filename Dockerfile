# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

ENV NODE_ENV=production \
    PORT=8080

WORKDIR /app

# Install dependencies only
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci --omit=dev || npm i --omit=dev

# Copy source
COPY . .

# Create runtime directories (uploads/data/logs)
RUN node -e "try{fs=require('fs');['uploads','data','logs'].forEach(d=>{if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});});}catch(e){process.exit(0)}"

EXPOSE 8080

CMD ["npm","start"]

