# Use Puppeteer's official base image with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:24.8.2

USER root

# Optional: Install xvfb for headless display
RUN apt-get update && \
    apt-get install -y xvfb

USER node

ENV DISPLAY=:99

# Prevent puppeteer from downloading its own Chrome
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Start the server using xvfb and nodemon or node
CMD xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" node index.js
