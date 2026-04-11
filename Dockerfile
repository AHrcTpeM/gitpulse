FROM node:20-alpine

# Створення директорії додатка
WORKDIR /usr/src/app

# Встановлення залежностей
# Копіюємо package.json та package-lock.json спочатку для кешування шарів Docker
COPY package*.json ./
RUN npm install --only=production

# Копіюємо вихідний код
COPY . .

# Експонуємо порт (за замовчуванням 3000 або з .env)
EXPOSE 3000

# Команда для запуску
CMD [ "npm", "start" ]
