const http = require('http');
const httpProxy = require('http-proxy');

// 👇 Сюда вставлен твой настоящий URL от Supabase
const targetUrl = process.env.TARGET_URL || 'https://dxoyyflsqrzgzjfihgcx.supabase.co';

console.log(`Starting proxy to ${targetUrl}`);

// Опция ws: true КРИТИЧЕСКИ ВАЖНА для мгновенных сообщений (Realtime)
const proxy = httpProxy.createProxyServer({
  target: targetUrl,
  changeOrigin: true,
  ws: true, 
  secure: true
});

// Добавляем CORS заголовки ко всем ответам, чтобы браузер не ругался
proxy.on('proxyRes', function (proxyRes, req, res) {
  proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
  proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, apikey, x-client-info, Prefer, content-profile';
});

// Если Supabase возвращает ошибку, не даем нашему прокси "упасть"
proxy.on('error', function (err, req, res) {
  console.error('Proxy Error:', err);
  if (res && res.writeHead) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Proxy Error');
  }
});

const server = http.createServer((req, res) => {
  // Браузер перед сложными запросами отправляет предварительный запрос OPTIONS. Отвечаем, что все разрешено
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey, x-client-info, Prefer, content-profile');
    res.writeHead(204);
    res.end();
    return;
  }

  // Обычные HTTP запросы (войти, загрузить список чатов и тд)
  proxy.web(req, res);
});

// === САМАЯ ВАЖНАЯ ЧАСТЬ ДЛЯ МГНОВЕННЫХ СООБЩЕНИЙ ===
// Node.js "перехватывает" апгрейд соединения до WebSocket и перенаправляет в Supabase
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head);
});

const port = process.env.PORT || 10000;
server.listen(port, () => {
  console.log(`Proxy listening on port ${port} with WebSockets enabled`);
});
