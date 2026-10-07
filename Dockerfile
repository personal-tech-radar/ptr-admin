FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.30.5-alpine
COPY --from=builder /app/dist/ptr-admin/browser /usr/share/nginx/html
COPY deploy/nginx/nginx.conf /etc/nginx/nginx.conf
COPY deploy/nginx/conf.d /etc/nginx/conf.d
COPY deploy/runtime-config-entrypoint.sh /docker-entrypoint.d/20-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/20-runtime-config.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD wget --quiet --spider http://127.0.0.1/nginx-health || exit 1
