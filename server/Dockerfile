# Use official Node.js 18 as the base image
FROM node:18

# Install dependencies required for Puppeteer to run headless Chromium
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  libu2f-udev \
  xvfb \
  xauth \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy dependency files and install packages
COPY package*.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Expose the port (informational; Render uses PORT env var)
EXPOSE $PORT

# Start the app using xvfb (required for headless Puppeteer)
CMD ["xvfb-run", "--", "node", "index.js"]
