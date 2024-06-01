FROM node:20.14.0-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install -g npm@10.8.1
RUN npm install
COPY . .
RUN npm run build-standard

EXPOSE 3000
ENTRYPOINT ["npm", "start"]