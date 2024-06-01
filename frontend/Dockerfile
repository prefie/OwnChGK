FROM node:20.14.0-alpine as builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install -g npm@10.8.1
RUN npm install
COPY . .
RUN npm run build-standard

FROM nginx:mainline-alpine

COPY --from=builder /app/dist /var/www
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443
ENTRYPOINT ["nginx", "-g", "daemon off;"]