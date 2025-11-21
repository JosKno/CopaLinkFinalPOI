# 🚂 Deploy CopaLink en Railway

## 📋 Requisitos previos
- Cuenta en Railway.app (gratis)
- Cuenta en GitHub con tu fork actualizado

---

## 🚀 Método 1: Deploy desde GitHub (Recomendado)

### Paso 1: Preparar el repositorio
```bash
# Asegúrate de que todos los cambios estén en GitHub
git add .
git commit -m "Preparar para deploy en Railway"
git push origin actualizaciones
```

### Paso 2: Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Click en **"Start a New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway a acceder a GitHub
5. Busca y selecciona: **JosKno/CopaLinkFinalPOI**
6. Selecciona la rama: **actualizaciones**

### Paso 3: Agregar base de datos MySQL
1. En tu proyecto de Railway, click en **"New"**
2. Selecciona **"Database"** → **"Add MySQL"**
3. Railway creará automáticamente las variables de entorno

### Paso 4: Importar la base de datos
```bash
# Descarga railway CLI
npm install -g @railway/cli

# Login
railway login

# Conectar a tu proyecto
railway link

# Importar base de datos
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < BD/database.sql
```

### Paso 5: Configurar variables de entorno
En el dashboard de Railway, ve a **Variables** y agrega:

```
WEBSOCKET_PORT=3000
NODE_ENV=production
```

### Paso 6: Desplegar WebSocket (servicio separado)
1. Click en **"New"** → **"Empty Service"**
2. Nombra el servicio: **"websocket"**
3. En Settings → **"Build Command"**: `cd CopaLink/websocket && npm install`
4. En Settings → **"Start Command"**: `cd CopaLink/websocket && npm start`

---

## 🚀 Método 2: Deploy con Railway CLI

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Inicializar proyecto
railway init

# 4. Conectar base de datos
railway add --database mysql

# 5. Deploy
railway up
```

---

## 📱 URLs generadas

Después del deploy, Railway te dará:
- **App URL**: `https://tu-proyecto.up.railway.app`
- **WebSocket URL**: `https://tu-proyecto-websocket.up.railway.app`

---

## 🔧 Actualizar la configuración

### 1. Actualizar URL de WebSocket en el código
En `CopaLink/js/chats-db.js`, cambia:
```javascript
const ngrokUrl = 'https://tu-proyecto-websocket.up.railway.app';
```

### 2. Configurar Firebase authorized domains
1. Ve a Firebase Console
2. Authentication → Settings → Authorized domains
3. Agrega: `tu-proyecto.up.railway.app`

### 3. Configurar Supabase allowed origins
1. Ve a Supabase Dashboard
2. Settings → API → URL Configuration
3. Agrega: `https://tu-proyecto.up.railway.app`

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verifica las variables de entorno
railway variables

# Importa la base de datos
railway run mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE < BD/database.sql
```

### Error: "WebSocket not connecting"
- Verifica que el servicio WebSocket esté corriendo
- Actualiza la URL en `chats-db.js`
- Revisa los logs: `railway logs`

### Ver logs en tiempo real
```bash
railway logs
```

---

## 💰 Costos

Railway ofrece:
- **$5 de crédito gratis/mes** (suficiente para desarrollo)
- **Plan Hobby**: ~500 horas/mes de ejecución
- Si necesitas más: **$5/mes por servicio adicional**

---

## ✅ Checklist de deploy

- [ ] Código en GitHub actualizado
- [ ] Proyecto creado en Railway
- [ ] MySQL database agregado
- [ ] Base de datos importada
- [ ] Variables de entorno configuradas
- [ ] Servicio WebSocket creado
- [ ] URL actualizada en chats-db.js
- [ ] Firebase domains autorizados
- [ ] Supabase origins configurados
- [ ] Aplicación funcionando ✨
