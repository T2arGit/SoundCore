# ─── Stage 1: Build ───
FROM node:22-alpine AS build

# Указываем рабочую директорию
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем зависимости
# Используем --legacy-peer-deps если возникают конфликты версий
RUN npm install --frozen-lockfile || npm install

# Копируем весь исходный код
COPY . .

# Собираем проект (electron-vite build соберет фронтенд в out/renderer)
RUN npm run build

# ─── Stage 2: Serve ───
FROM nginx:stable-alpine

# Копируем билд фронтенда из папки out/renderer в директорию nginx
COPY --from=build /app/out/renderer /usr/share/nginx/html

# Копируем дефолтный конфиг (если нужен специфический роутинг)
# COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Выставляем порт 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
