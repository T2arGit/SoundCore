# ─── Stage 1: Build Frontend ───
FROM node:22-slim AS build

WORKDIR /app

# Устанавливаем зависимости для сборки (если потребуются native модули, но для фронта обычно не нужны)
# RUN apt-get update && apt-get install -y python3 make g++

COPY package.json package-lock.json* ./

# Устанавливаем только необходимые зависимости для фронтенда
RUN npm install --legacy-peer-deps

COPY . .

# Собираем только фронтенд часть для веба
# Используем vite напрямую, чтобы не дергать electron-builder
RUN npx vite build src/renderer --outDir out/renderer

# ─── Stage 2: Serve with Nginx ───
FROM nginx:stable-alpine

# Копируем билд фронтенда
COPY --from=build /app/out/renderer /usr/share/nginx/html

# Пробрасываем порт
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
