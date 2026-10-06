FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
RUN apk add --no-cache logrotate fail2ban
COPY --from=builder /app/dist/ptr-admin/browser /usr/share/nginx/html
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/conf.d /etc/nginx/conf.d
COPY deploy/logrotate/ptr-admin-nginx /etc/logrotate.d/ptr-admin-nginx
COPY deploy/fail2ban /etc/fail2ban
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget --quiet --spider http://127.0.0.1/nginx-health || exit 1
