FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy minimal runtime files
COPY server/ server/
COPY tools/ tools/

# App Platform provides $PORT; the server will bind to it.
CMD ["node", "server/encrypt_server.js"]

