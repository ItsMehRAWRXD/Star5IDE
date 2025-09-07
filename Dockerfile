FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends \
  openssl curl wget git nano vim-tiny perl python3 unzip zip jq ca-certificates tzdata procps \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy runtime files
COPY server/ server/
COPY tools/ tools/

# App Platform provides $PORT; the server will bind to it.
CMD ["node", "server/encrypt_server.js"]
