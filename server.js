const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Разрешаем CORS для твоего GitHub Pages
app.use(cors());

// Твой проект Supabase
const SUPABASE_URL = "https://dxoyyflsqrzgzjfihgcx.supabase.co";

app.use('/', createProxyMiddleware({
  target: SUPABASE_URL,
  changeOrigin: true, // Подменяем хост для обхода защиты
  ws: true,           // ВАЖНО: Включает проксирование WebSockets (моментальные сообщения)
  onProxyReq: (proxyReq, req, res) => {
    // Удаляем заголовки, чтобы ограничения Supabase не сработали
    proxyReq.removeHeader('origin');
    proxyReq.removeHeader('referer');
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    proxyReq.removeHeader('origin');
  }
}));

const PORT = process.env.PORT || 10000;
app.server = app.listen(PORT, () => {
  console.log(`Node.js Proxy is running on port ${PORT}`);
});
