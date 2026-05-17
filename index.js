const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error("Ошибка: Не задана переменная окружения SUPABASE_URL в настройках Render");
  process.exit(1);
}

// 1. Настраиваем CORS и разрешаем ВСЕ заголовки, чтобы не было никаких блокировок
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'apikey',
    'Prefer',
    'x-client-info',
    'content-profile',
    'x-supabase-api-version', // Исправляет ошибку с твоего последнего скрина!
    'x-retry-count'
  ]
}));

// 2. Настраиваем сам прокси
const proxyMiddleware = createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  ws: true, // Включаем поддержку WebSockets (КРИТИЧЕСКИ ВАЖНО для мгновенных сообщений!)
  logLevel: 'error',
});

app.use('/', proxyMiddleware);

// 3. Запускаем сервер
const server = app.listen(PORT, () => {
  console.log(`Proxy is running on port ${PORT}`);
});

// 4. Проксируем обновления WebSocket, чтобы постоянные соединения не обрывались
server.on('upgrade', proxyMiddleware.upgrade);
