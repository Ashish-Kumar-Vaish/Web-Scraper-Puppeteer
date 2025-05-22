FROM ghcr.io/puppeteer/puppeteer:24.8.2

USER root

RUN apt-get update && \
    apt-get install -y xvfb

USER node

ENV DISPLAY=:99

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .

# Start xvfb and run the application
CMD xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npx nodemon app.js
