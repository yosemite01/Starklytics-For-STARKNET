# Dockerfile for Starklytics backend
FROM node:18-alpine
WORKDIR /app

# install dependencies
COPY package*.json ./
RUN npm ci --only=production

# copy source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

# start the server
CMD ["node", "server.js"]
