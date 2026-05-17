require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
  console.error("Ошибка: Не задана переменная окружения SUPABASE_URL в настройках Render");
  process.exit(1);
}

const targetUrl = new URL(SUPABASE_URL);

// Настройка CORS. Разрешаем запросы с любого источника и добавляем ВСЕ нужные заголовки Supabase
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'apikey', 
    'x-client-info', 
    'content-profile', 
    'accept-profile', 
    'x-supabase-api-version', 
    'prefer'
  ]
}));

// Настройка проксирования с поддержкой WebSockets (для Realtime)
app.use('/', createProxyMiddleware({
  target: targetUrl.origin,
  changeOrigin: true,
  ws: true, // ВАЖНО: Включает поддержку WebSockets для моментальных сообщений и реакций!
  on: {
    proxyReq: (proxyReq, req, res) => {
      // Дополнительная логика запроса, если нужна
    },
    error: (err, req, res) => {
      console.error('Proxy Error:', err);
      if (!res.headersSent) {
          res.status(500).send('Proxy Error');
      }
    }
  }
}));

const server = app.listen(PORT, () => {
  console.log(`Прокси сервер запущен на порту ${PORT}. Проксирует на ${targetUrl.origin}`);
});
