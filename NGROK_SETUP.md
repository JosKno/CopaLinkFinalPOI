# 🌐 Deployar CopaLink con ngrok

## ✅ Opción 1: Túnel simple (Más fácil)

### Paso 1: Configurar variable de entorno para WebSocket
Modifica `chats-db.js` para usar variable de entorno:

```javascript
// Detectar si estamos en ngrok o local
const WS_HOST = window.location.hostname; // Usa el mismo dominio
const wsUrl = `${protocol}://${WS_HOST}:3000`;
```

### Paso 2: Ejecutar servicios
```bash
# Terminal 1: WebSocket Server
cd CopaLink\websocket
npm start

# Terminal 2: Apache (XAMPP ya lo hace)
# Solo asegúrate que Apache esté corriendo

# Terminal 3: ngrok para app principal
ngrok http 443 --region us

# Terminal 4: ngrok para WebSocket
ngrok http 3000 --region us
```

### URLs resultantes:
- App: `https://abc123.ngrok-free.app`
- WebSocket: `https://xyz789.ngrok-free.app`

**Importante:** Actualiza la URL del WebSocket en `chats-db.js` con la URL de ngrok del WebSocket.

---

## ✅ Opción 2: Proxy inverso (Recomendado)

Usa **un solo túnel ngrok** con un proxy que redirija al WebSocket.

### Configuración:

#### 1. Instalar http-proxy (si no lo tienes)
```bash
npm install -g http-proxy-cli
```

#### 2. Crear archivo proxy.js
```javascript
const http = require('http');
const httpProxy = require('http-proxy');

const proxy = httpProxy.createProxyServer({});

const server = http.createServer((req, res) => {
  // Si la ruta es /ws/ redirigir al WebSocket
  if (req.url.startsWith('/socket.io/')) {
    proxy.web(req, res, { target: 'http://localhost:3000' });
  } else {
    // Todo lo demás va a Apache
    proxy.web(req, res, { target: 'http://localhost:80' });
  }
});

server.on('upgrade', (req, socket, head) => {
  // Manejar upgrade de WebSocket
  proxy.ws(req, socket, head, { target: 'ws://localhost:3000' });
});

server.listen(8080);
console.log('Proxy corriendo en puerto 8080');
```

#### 3. Ejecutar:
```bash
# Terminal 1: WebSocket
cd CopaLink\websocket
npm start

# Terminal 2: Proxy
node proxy.js

# Terminal 3: ngrok (un solo túnel)
ngrok http 8080
```

---

## 🎯 Opción 3: Usar dominio de ngrok en el código

Modifica `chats-db.js` para usar el mismo dominio:

```javascript
function initializeWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname; // Obtiene el dominio actual
  const port = window.location.hostname.includes('ngrok') ? '' : ':3000';
  const wsUrl = `${protocol}://${host}${port}`;
  
  console.log(`[WS] Conectando a: ${wsUrl}`);
  // ... resto del código
}
```

Luego en ngrok config, usa subdominios:
- App: `https://app.tu-dominio.ngrok.io`
- WS: `https://ws.tu-dominio.ngrok.io`

---

## ✅ La opción MÁS SIMPLE para ngrok:

**Usar la misma URL pero puerto diferente en ngrok:**

```bash
# Terminal 1: WebSocket (puerto 3000)
npm start

# Terminal 2: ngrok con múltiples túneles
# Crea archivo ngrok.yml:
```

**ngrok.yml:**
```yaml
version: "2"
authtoken: TU_TOKEN_AQUI
tunnels:
  app:
    proto: http
    addr: 80
  websocket:
    proto: http
    addr: 3000
```

**Ejecutar:**
```bash
ngrok start --all --config ngrok.yml
```

Esto te dará 2 URLs:
- `https://abc123.ngrok-free.app` → Apache (app)
- `https://xyz789.ngrok-free.app` → WebSocket

Solo actualiza la URL del WebSocket en el código con la segunda URL.

---

## 🎯 Respuesta directa a tu pregunta:

**Sí, con ngrok funcionará 100% automático SIN clicks** porque:
- ✅ ngrok proporciona HTTPS con certificado válido
- ✅ Tu código ya detecta automáticamente el protocolo
- ✅ No hay advertencias de seguridad

**Único paso adicional:**
Actualizar la URL del WebSocket en `chats-db.js` con la URL pública de ngrok.
