const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
// Твой Supabase URL с https://
const SUPABASE_URL = 'https://dxoyyflsqrzgzjfihgcx.supabase.co'; 

// 1. Эндпоинт для cron-job.org (чтобы сервер не засыпал на Render)
app.get('/health', (req, res) => {
  res.status(200).send('OK Proxy is awake');
});

// 2. Универсальная настройка CORS (динамически разрешает любые заголовки от Supabase)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

  // Если клиент запрашивает кастомные заголовки (например, content-profile), мы их разрешаем
  if (req.headers['access-control-request-headers']) {
    res.header("Access-Control-Allow-Headers", req.headers['access-control-request-headers']);
  }

  // Быстрый ответ на предварительный запрос браузера (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 3. Настройка прокси
const proxy = createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true,
  ws: true, // ВАЖНО: Включает проксирование WebSockets (для моментальных сообщений)
  logLevel: 'warn',
  onProxyRes: function (proxyRes, req, res) {
     // Добавляем CORS к ответам самого Supabase
     proxyRes.headers['access-control-allow-origin'] = '*';
  }
});

// Все запросы направляем в прокси
app.use('/', proxy);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Proxy is running on port ${PORT}`);
});

// ВАЖНО: обрабатываем апгрейд до WebSockets для работы моментальных чатов!
server.on('upgrade', proxy.upgrade);
