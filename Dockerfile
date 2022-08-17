FROM node:16.17.0-alpine3.16
WORKDIR /app
ADD package*.json ./
RUN npm install
ADD src/index.js ./
CMD [ "node", "index.js"]