# ─── Stage 1: Build ───
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx vite build src/renderer --outDir out/renderer

# ─── Stage 2: Serve ───
FROM nginx:stable-alpine

# Создаем конфиг Nginx прямо здесь, чтобы не плодить файлы
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Копируем файлы (Vite кладет их в src/renderer/out/renderer)
COPY --from=build /app/src/renderer/out/renderer /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
