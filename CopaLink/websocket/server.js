const express = require('express');
const http = require('http');
const https = require('https');
const socketIO = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Usar HTTP simple - ngrok maneja el SSL
let protocolServer;
let usingHttps = false;

protocolServer = http.createServer(app);
console.log('[WS] ℹ️  Usando HTTP (ngrok maneja SSL)');

const io = socketIO(protocolServer, {
  cors: {
    origin: [
      "https://copalink-app.ngrok.app",
      "https://copalink-ws.ngrok.app",
      "http://localhost",
      "https://localhost"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Almacenar usuarios conectados
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userData

// ===== Helper: Notificar a PHP para actualizar estado en DB =====
// Actualiza users.connection_status y last_seen mediante endpoint PHP
function updateUserStatusInDB(userId, status = 'offline') {
  return new Promise((resolve) => {
    try {
      const postData = JSON.stringify({ user_id: userId, status });
      const options = {
        hostname: 'localhost',
        port: 80,
        path: '/CopaLink/CopaLink/php/users.php?action=update_status',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = http.request(options, (res) => {
        // Consumir respuesta para liberar el socket HTTP
        res.on('data', () => {});
        res.on('end', () => resolve(true));
      });

      req.on('error', (err) => {
        console.error('[WS->PHP] Error al actualizar estado en DB:', err.message);
        resolve(false);
      });

      req.write(postData);
      req.end();
    } catch (e) {
      console.error('[WS->PHP] Excepción al actualizar estado en DB:', e.message);
      resolve(false);
    }
  });
}

// Ruta de prueba - Servir HTML simple para iframe
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CopaLink WebSocket Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { margin: 0 0 10px 0; }
        p { opacity: 0.9; margin: 5px 0; }
        .status { 
          display: inline-block;
          width: 10px;
          height: 10px;
          background: #4ade80;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔌 CopaLink WebSocket</h1>
        <p><span class="status"></span>Servidor activo</p>
        <p>Usuarios conectados: ${connectedUsers.size}</p>
        <p style="font-size: 12px; margin-top: 20px; opacity: 0.7;">
          Este servidor maneja mensajes en tiempo real y videollamadas
        </p>
      </div>
    </body>
    </html>
  `);
});

// API endpoint para verificar estado
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'Servidor WebSocket de CopaLink funcionando',
    connectedUsers: connectedUsers.size
  });
});

io.on('connection', (socket) => {
  console.log(`[CONEXIÓN] Nuevo cliente conectado: ${socket.id}`);

  // Evento: Usuario se registra en el WebSocket
  socket.on('user_connected', (userData) => {
    const userId = userData.id;
    
    console.log(`[WS] Registrando usuario. ID: ${userId}, Tipo: ${typeof userId}, Username: ${userData.username}`);
    connectedUsers.set(userId, socket.id);
    userSockets.set(socket.id, userData);
    
    console.log(`[USUARIO CONECTADO] ${userData.username} (ID: ${userId})`);
    console.log(`[DEBUG] Usuarios conectados ahora:`, Array.from(connectedUsers.keys()));
    
    // Actualizar presencia en la base de datos
    updateUserStatusInDB(userId, 'online');
    
    // Notificar a todos que este usuario está online
    io.emit('user_status_change', {
      userId: userId,
      username: userData.username,
      status: 'online'
    });
  });

  // Evento: Enviar mensaje
  socket.on('send_message', (data) => {
    console.log(`[MENSAJE] De: ${data.sender_id}, Contenido: ${data.content.substring(0, 30)}...`);
    
    // Si es mensaje privado
    if (data.recipient_id) {
      const recipientSocketId = connectedUsers.get(data.recipient_id);
      
      if (recipientSocketId) {
        // Enviar solo al destinatario
        io.to(recipientSocketId).emit('new_message', data);
      }
      
      // También enviar de vuelta al remitente para confirmación
      socket.emit('message_sent', { success: true, messageId: data.message_id });
    }
    // Si es mensaje de grupo
    else if (data.group_id) {
      // Broadcast a todos los conectados (en producción filtrarías por miembros del grupo)
      io.emit('new_message', data);
      socket.emit('message_sent', { success: true, messageId: data.message_id });
    }
  });

  // Evento: Usuario está escribiendo
  socket.on('typing', (data) => {
    if (data.recipient_id) {
      const recipientSocketId = connectedUsers.get(data.recipient_id);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user_typing', {
          userId: data.userId,
          username: data.username,
          isTyping: true
        });
      }
    } else if (data.group_id) {
      socket.broadcast.emit('user_typing', {
        userId: data.userId,
        username: data.username,
        groupId: data.group_id,
        isTyping: true
      });
    }
  });

  // Evento: Nueva tarea creada
  socket.on('task_created', (data) => {
    console.log(`[TAREA CREADA] En grupo: ${data.group_id}`);
    // Broadcast a todos los miembros del grupo
    io.emit('new_task', data);
  });

  // Evento: Tarea actualizada
  socket.on('task_updated', (data) => {
    console.log(`[TAREA ACTUALIZADA] ID: ${data.task_id}`);
    io.emit('task_update', data);
  });

  // =================== WebRTC Signaling (1:1) ===================
  socket.on('webrtc_offer', (data) => {
    // data: { to_user_id, from_user_id, from_username, sdp }
    console.log(`[📞 WEBRTC OFFER] De ${data.from_username} (ID: ${data.from_user_id}) para usuario ${data.to_user_id}`);
    console.log(`[📞 DEBUG] Tipo de to_user_id: ${typeof data.to_user_id}`);
    console.log(`[📞 DEBUG] Usuarios conectados:`, Array.from(connectedUsers.keys()));
    
    const toSocket = connectedUsers.get(data.to_user_id);
    console.log(`[📞 DEBUG] Socket destino encontrado:`, toSocket ? 'SÍ' : 'NO');
    
    if (toSocket) {
      io.to(toSocket).emit('webrtc_offer', data);
      console.log(`[📞 ✅] Oferta enviada al socket ${toSocket}`);
    } else {
      console.log(`[📞 ❌] Usuario ${data.to_user_id} no conectado o no encontrado`);
    }
  });

  socket.on('webrtc_answer', (data) => {
    // data: { to_user_id, from_user_id, sdp }
    const toSocket = connectedUsers.get(data.to_user_id);
    if (toSocket) {
      io.to(toSocket).emit('webrtc_answer', data);
    }
  });

  socket.on('webrtc_ice_candidate', (data) => {
    // data: { to_user_id, from_user_id, candidate }
    const toSocket = connectedUsers.get(data.to_user_id);
    if (toSocket) {
      io.to(toSocket).emit('webrtc_ice_candidate', data);
    }
  });

  socket.on('webrtc_end_call', (data) => {
    // data: { to_user_id, from_user_id }
    const toSocket = connectedUsers.get(data.to_user_id);
    if (toSocket) {
      io.to(toSocket).emit('webrtc_end_call', data);
    }
  });

  // Evento: Usuario se desconecta
  socket.on('disconnect', () => {
    const userData = userSockets.get(socket.id);
    
    if (userData) {
      const userId = userData.id;
      connectedUsers.delete(userId);
      userSockets.delete(socket.id);
      
      console.log(`[DESCONEXIÓN] ${userData.username} (ID: ${userId})`);
      // Actualizar presencia en la base de datos
      updateUserStatusInDB(userId, 'offline');
      
      // Notificar a todos que este usuario está offline
      io.emit('user_status_change', {
        userId: userId,
        username: userData.username,
        status: 'offline'
      });
    } else {
      console.log(`[DESCONEXIÓN] Cliente desconocido: ${socket.id}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
protocolServer.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================`);
  console.log(`🚀 Servidor WebSocket iniciado`);
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http${usingHttps ? 's' : ''}://localhost:${PORT}`);
  console.log(`🔐 Modo: ${usingHttps ? 'HTTPS/WSS' : 'HTTP/WS'}`);
  console.log(`====================================`);
});
