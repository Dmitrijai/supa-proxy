const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000; 
const SUPABASE_URL = "https://dxoyyflsqrzgzjfihgcx.supabase.co"; // Ваш URL Supabase

// 1. Маршрут для cron-job.org (чтобы сервер не засыпал). 
// ВАЖНО: Должен быть перед прокси!
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// 2. Настройка CORS: мы добавили 'content-profile', чтобы исправить ошибку на скрине
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "apikey",
    "X-Client-Info",
    "Content-Type",
    "Authorization",
    "Prefer",
    "x-supabase-api-version",
    "accept-profile",
    "x-retry-count",
    "content-profile" // <-- Именно это исправит ошибки в консоли
  ],
}));

// 3. Настройка прокси
const proxyOptions = {
  target: SUPABASE_URL,
  changeOrigin: true,
  ws: true, // Включаем поддержку WebSockets
  onProxyRes: function (proxyRes, req, res) {
    proxyRes.headers["Access-Control-Allow-Origin"] = "*";
  }
};

const proxy = createProxyMiddleware(proxyOptions);

// Проксируем все остальные запросы (кроме /ping)
app.use("/", proxy);

// 4. Запуск сервера с правильной обработкой WebSockets (для моментальных сообщений!)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server is running on port ${PORT}`);
});

// КРИТИЧЕСКИ ВАЖНО ДЛЯ МОМЕНТАЛЬНЫХ СООБЩЕНИЙ В NODE.JS!
// Express сам не прокидывает WebSockets в прокси, это нужно сделать вручную:
server.on('upgrade', proxy.upgrade);
