FROM node:20-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# No services are started from this image. It is inert by default.
CMD ["node", "-e", "console.log('inert image - no endpoints')"]

