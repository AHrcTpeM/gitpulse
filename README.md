# 🧬 GitPulse

GitPulse — сервіс для відстеження релізів у репозиторіях GitHub та надсилання сповіщень користувачам на електронну пошту.

🚀 **Production:** [https://gitpulse.duckdns.org/](https://gitpulse.duckdns.org/)

- **Веб-інтерфейс**: `https://gitpulse.duckdns.org/`
- **Документація API**: `https://gitpulse.duckdns.org/api-docs`
- **Панель Prometheus**: `https://gitpulse.duckdns.org/prometheus/` (Логін: `admin`, пароль: `admin`)

---

## ✨ Можливості

- **Відстеження репозиторіїв**: Підписка на публічні репозиторії GitHub через веб-інтерфейс.
- **Валідація**: Перевірка формату `owner/repo` та існування репозиторію через GitHub API.
- **Двоэтапне підтвердження**: Після підписки користувач отримує лист для підтвердження своєї пошти.
- **Сповіщення про релізи**: Сервіс автоматично перевіряє оновлення та надсилає листи про нові релізи.
- **Обробка лімітів**: Коректна робота з GitHub API.
- **Redis Caching**: Кешування відповідей від GitHub API в Redis з TTL 10 хвилин.
- **Безпека API**: Доступ до методів управління підписками обмежено ключем `x-api-key`.
- **Сканер релізів**: Фоновий сервіс, який періодично перевіряє GitHub на нових тегів.
- **gRPC інтерфейс**: Сервер для внутрішньої взаємодії та керування.
- **Моніторинг**: Метрики Prometheus та захищена панель для перегляду стану системи.
- **CI Pipeline**: Автоматизована перевірка коду та запуск тестів через GitHub Actions.
- **Хостинг**: Проєкт розгорнуто на AWS (Amazon EC2).
- **Архітектура**: Використовує Redis для черг/стану та PostgreSQL для даних.

---

## 🛠 Технологічний стек

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL + Knex.js
- **Caching**: Redis
- **Reverse Proxy**: Caddy (SSL)
- **Monitoring**: Prometheus + prom-client
- **Communication**: gRPC
- **Testing**: Jest + Supertest

---

## 🚀 Швидкий запуск (Docker)

Запуск всього стеку (API, DB, Redis, Prometheus, Caddy):

```bash
# Побудувати та запустити
docker-compose -f docker-compose.prod.yml up --build -d

# Стан сервісів
docker-compose ps
```

---

## 👨‍💻 Розробка

### 1. Інфраструктура

Тільки база та redis:

```bash
docker-compose up -d db redis
```

### 2. Додаток

Налаштуйте `.env` та запустіть:

```bash
npm install
npm run dev
```

---

## 📈 Моніторинг

Метрики доступні за адресою `/metrics`.

- `gitpulse_http_requests_total`: Кількість HTTP запитів.
- `gitpulse_http_request_duration_seconds_bucket`: Гістограма часу обробки запитів.
- `gitpulse_http_request_duration_seconds_sum`: Сума часу обробки запитів.
- `gitpulse_http_request_duration_seconds_count`: Кількість запитів.

---

## 🧪 Тестування

```bash
# Unit-тести
npm test

# Інтеграційні тести (потрібна тестова БД)
npm run test:integration
```

---

## 📂 База даних

- **Статус міграцій**: `npx knex migrate:status --knexfile src/db/knexfile.js`
- **Запуск сідів**: `npx knex seed:run --knexfile src/db/knexfile.js`
- **Docker Seed**: `docker compose exec app npx knex seed:run --knexfile src/db/knexfile.js`

---

## 🧹 Docker

- **Логи**: `docker-compose logs -f app`
- **Очищення**: `docker-compose down -v`
- **Консоль БД**: `docker compose exec db psql -U postgres -d gitpulse`
