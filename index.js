const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();

const SUPABASE_URL = process.env.SUPABASE_URL;

if (!SUPABASE_URL) {
    console.error('Ошибка: Не задана переменная окружения SUPABASE_URL в настройках Render');
    process.exit(1);
}

// Настройка CORS для разрешения ВСЕХ необходимых заголовков Supabase
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'apikey',
        'X-Client-Info',
        'Content-Type',
        'Authorization',
        'Accept',
        'Accept-Language',
        'X-Supabase-Api-Version',
        'Content-Profile',
        'accept-profile',
        'Prefer'
    ]
}));

// Настройка проксирования запросов к Supabase
app.use('/', createProxyMiddleware({
    target: SUPABASE_URL,
    changeOrigin: true,
    ws: true, // Включаем поддержку WebSocket (важно для моментальных сообщений и реакций!)
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        // Убираем Origin, чтобы Supabase не блокировал запросы
        proxyReq.removeHeader('Origin');
        // Добавляем X-Forwarded-Host для корректной работы auth
        proxyReq.setHeader('X-Forwarded-Host', req.headers.host);
    },
}));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Прокси-сервер запущен на порту ${PORT} и проксирует запросы на ${SUPABASE_URL}`);
});
