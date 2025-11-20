# 🔌 WebSocket Server - CopaLink

## ⚡ Solución al Error "Mixed Content"

Cuando accedes a la app con **HTTPS**, debes usar **WSS** (WebSocket Secure). Tienes dos opciones:

### 🎯 Opción 1: Usar HTTP (Recomendado para desarrollo local)

**Cambia la URL en tu navegador:**
- ❌ `https://192.168.1.70/CopaLink/CopaLink/chats.php`
- ✅ `http://192.168.1.70/CopaLink/CopaLink/chats.php`

**Ventajas:**
- ✅ Conexión 100% automática
- ✅ Sin necesidad de aceptar certificados
- ✅ Cero configuración adicional

### 🔐 Opción 2: Usar HTTPS (Para producción)

**Si necesitas HTTPS:**
1. Accede con: `https://192.168.1.70/CopaLink/CopaLink/chats.php`
2. El servidor detectará automáticamente y usará WSS
3. **Primera vez:** Aceptarás el certificado una sola vez
4. **Siguientes veces:** Conexión automática

---

## 🚀 Cómo usar

### Iniciar el servidor:
```bash
cd CopaLink\websocket
npm start
```

El servidor detecta automáticamente si hay certificados:
- **Con certificados** → HTTPS/WSS
- **Sin certificados** → HTTP/WS

### 🌐 Acceder a la aplicación:

**Para desarrollo local (más simple):**
```
http://192.168.1.70/CopaLink/CopaLink/index.php
```

**Para producción o pruebas con SSL:**
```
https://192.168.1.70/CopaLink/CopaLink/index.php
```

---

## 📋 Características

- **Mensajería en tiempo real**: Los mensajes llegan instantáneamente
- **Videollamadas**: WebRTC integrado para llamadas entre usuarios
- **Notificaciones**: Alertas automáticas de nuevos mensajes
- **Presencia**: Ver quién está online/offline
- **Tareas de grupo**: Sincronización en tiempo real
- **Detección automática**: El cliente se adapta a HTTP o HTTPS

---

## 🔧 Tecnologías

- **Servidor**: Node.js + Express + Socket.IO
- **Protocolo**: WS/WSS (auto-detectado)
- **Puerto**: 3000
- **CORS**: Habilitado para todas las IPs

---

## 📝 Notas importantes

### ¿Por qué el error "Mixed Content"?

Los navegadores modernos **bloquean** contenido HTTP cuando la página es HTTPS por seguridad. Es como mezclar una conexión segura con una insegura.

**Solución rápida:** Usa HTTP para todo (desarrollo local)
**Solución completa:** Usa HTTPS para todo (producción)

### Sobre los certificados

- **Desarrollo local con HTTP**: No necesitas certificados
- **Desarrollo local con HTTPS**: Certificados autofirmados (aceptar una vez)
- **Producción**: Certificados válidos de Let's Encrypt o similar

---

## 🐛 Solución de problemas

### El WebSocket no conecta:

1. **Verifica el servidor**: Abre `http://192.168.1.70:3000` (o `https://` si usas SSL)
2. **Revisa la consola**: Abre F12 → Console para ver errores
3. **Verifica el protocolo**: HTTP → WS, HTTPS → WSS (deben coincidir)
4. **Firewall**: Asegúrate que el puerto 3000 esté abierto

### Error "Mixed Content":

- **Causa**: Página HTTPS intentando conectar a WS (HTTP)
- **Solución**: Cambia a `http://` en la URL o acepta el certificado HTTPS del servidor

---

## ✅ Resumen rápido

| Escenario | URL Aplicación | Servidor WebSocket | Certificado |
|-----------|----------------|-------------------|-------------|
| **Desarrollo simple** | `http://192.168.1.70/...` | HTTP/WS | ❌ No necesario |
| **Desarrollo con SSL** | `https://192.168.1.70/...` | HTTPS/WSS | ⚠️ Aceptar una vez |
| **Producción** | `https://tudominio.com/...` | HTTPS/WSS | ✅ Certificado válido |
