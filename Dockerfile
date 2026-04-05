# ─── Stage 1: Build ───
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx vite build src/renderer --outDir out/renderer

# ─── Stage 2: Serve ───
FROM nginx:stable-alpine

# Настраиваем Nginx на порт 3000
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Копируем билд фронтенда
COPY --from=build /app/src/renderer/out/renderer /usr/share/nginx/html

# Открываем порт 3000
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
