const http = require('http');
const httpProxy = require('http-proxy');

// Ваш URL от Supabase (обязательно с https://)
const SUPABASE_URL = "https://dxoyyflsqrzgzjfihgcx.supabase.co"; 

// Создаем прокси-сервер с поддержкой WebSockets (ws: true)
const proxy = httpProxy.createProxyServer({
  target: SUPABASE_URL,
  secure: true,
  changeOrigin: true, // Крайне важно для подмены Host
  ws: true,           // Включаем поддержку WebSockets!
});

// Перехватываем ответы прокси для добавления CORS заголовков
proxy.on('proxyRes', function (proxyRes, req, res) {
  proxyRes.headers['access-control-allow-origin'] = '*';
  proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
  proxyRes.headers['access-control-allow-headers'] = 'apikey, X-Client-Info, Content-Type, Authorization, Prefer, accept-profile, x-supabase-api-version';
});

const server = http.createServer((req, res) => {
  // Обработка предварительных OPTIONS запросов (браузерный CORS)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'apikey, X-Client-Info, Content-Type, Authorization, Prefer, accept-profile, x-supabase-api-version');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.writeHead(204);
    res.end();
    return;
  }

  // Проксируем обычные HTTP запросы (логин, получение сообщений и профилей)
  proxy.web(req, res, { target: SUPABASE_URL }, (e) => {
    res.writeHead(502);
    res.end('Proxy error: ' + e.message);
  });
});

// Важнейшая часть: проксирование WebSockets (для МОМЕНТАЛЬНЫХ сообщений!)
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { target: SUPABASE_URL }, (e) => {
    socket.destroy();
  });
});

// Render.com автоматически задает переменную окружения PORT, слушаем ее
const PORT = process.env.PORT || 10000; 

server.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});
