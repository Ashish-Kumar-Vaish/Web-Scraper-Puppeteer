FROM node:18

WORKDIR /usr/src/app

# Use root to avoid permission issues
USER root

COPY package*.json ./

RUN npm install --verbose

COPY . .

CMD ["node", "index.js"]
