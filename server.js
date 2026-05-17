const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// 1. Ручное решение проблем с CORS (чтобы браузер пропускал запросы)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', '*'); // Разрешаем любые заголовки

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

const SUPABASE_URL = 'https://dxoyyflsqrzgzjfihgcx.supabase.co';

// 2. Настройка прокси
const proxy = createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true, // Подменяет Origin на Supabase 
  ws: true,           // ВАЖНО: Разрешает WebSocket (Именно это дает МОМЕНТАЛЬНЫЕ сообщения)
  on: {
    proxyRes: (proxyRes, req, res) => {
        // Убеждаемся, что ответы от самого Supabase тоже не блокируются браузером
        proxyRes.headers['access-control-allow-origin'] = '*';
    }
  }
});

app.use('/', proxy);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Proxy listening on port ${PORT}`);
});

// 3. Жесткая привязка WebSockets (для чата) к серверу
server.on('upgrade', proxy.upgrade);
