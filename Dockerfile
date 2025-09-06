FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy minimal runtime files
COPY server/ server/
COPY tools/ tools/

# Default to binding only to localhost and denying requests unless configured
ENV HOST=127.0.0.1
ENV ALLOWED_ORIGINS=https://lionfish-app-ey7kn.ondigitalocean.app
# Must be set via environment at runtime
ENV BEARER_TOKEN=

# App Platform provides $PORT; the server will bind to it.
CMD ["node", "server/encrypt_server.js"]

