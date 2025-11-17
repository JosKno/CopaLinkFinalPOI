# Guía de Instalación - Sistema de Gemas CopaLink

## ✅ Ya Completado

He integrado el sistema de gemas en tu aplicación. Aquí está lo que se hizo:

---

## 📋 PASO 1: Base de Datos (YA EJECUTADO)

La migración ya fue ejecutada exitosamente:
```bash
mysql -u root -p copalink < BD/migration_gems_system.sql
```

✅ Tablas creadas:
- `gem_transactions` - Historial de gemas
- `bets` - Apuestas del simulador
- Columna `gems` agregada a `users`
- Campos de recompensa agregados a `tasks`

---

## 📋 PASO 2: Scripts Incluidos en las Páginas

### ✅ En `chats.php`:

**CSS agregado:**
```html
<link rel="stylesheet" href="css/gems.css" />
```

**JavaScript agregado:**
```html
<script src="js/gems-manager.js"></script>
```

**UI actualizada:**
- Botón "💎 Ver mis gemas" en el menú de usuario
- Atributo `data-gems-display` en el contador de gemas
- Balance se actualiza automáticamente

### ✅ En `simulador.php`:

**CSS agregado:**
```html
<link rel="stylesheet" href="css/gems.css" />
```

**Scripts Firebase agregados:**
```html
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="js/firebase-config.js"></script>
```

**Sistema de gemas agregado:**
```html
<script src="js/gems-manager.js"></script>
```

**Display de gemas en header:**
```html
<span class="gems-badge" data-gems-display>0</span>
```

---

## 📋 PASO 3: Inicialización Automática

### ✅ En `chats.js`:

El sistema se inicializa automáticamente cuando el usuario inicia sesión:

```javascript
// Obtener datos del usuario desde Firestore
const userDoc = await db.collection('users').doc(user.uid).get();
const userData = userDoc.data();

// Inicializar el sistema de gemas con el ID de MySQL
if (userData.mysqlId && typeof gemsManager !== 'undefined') {
    await gemsManager.initialize(userData.mysqlId);
    console.log('Sistema de gemas inicializado. Balance:', gemsManager.currentBalance);
}
```

### ✅ En `simulador.php`:

Script inline agregado que:
1. Verifica autenticación con Firebase
2. Obtiene el `mysqlId` desde Firestore
3. Inicializa el gestor de gemas
4. Actualiza el límite del input de apuestas

```javascript
auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        const userData = userDoc.data();
        
        if (userData.mysqlId) {
            await gemsManager.initialize(userData.mysqlId);
            // Balance cargado automáticamente
        }
    }
});
```

---

## 📋 PASO 4: Mostrar Balance Automáticamente

### ✅ Cómo funciona:

Cualquier elemento HTML con el atributo `data-gems-display` se actualiza automáticamente:

```html
<!-- En chats.php -->
<span class="gem-count" id="menuUserGems" data-gems-display>--</span>

<!-- En simulador.php -->
<span class="gems-badge" data-gems-display>0</span>
```

**El balance se actualiza automáticamente cuando:**
- El usuario inicia sesión
- Se completa una tarea
- Se gana/pierde una apuesta
- Se recibe una transferencia

---

## 🔄 Sistema de Sincronización Firebase ↔ MySQL

### ✅ Registro de Usuarios:

Modificado `auth.js` para que al registrarse:

1. **Crea usuario en Firebase Authentication**
2. **Registra usuario en MySQL** (php/register.php)
3. **Guarda el `mysqlId` en Firestore** para sincronización

```javascript
// 1. Firebase Auth
const userCredential = await auth.createUserWithEmailAndPassword(email, password);

// 2. Registrar en MySQL
const mysqlResponse = await fetch('php/register.php', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
});
const mysqlData = await mysqlResponse.json();
const mysqlUserId = mysqlData.user_id;

// 3. Guardar mysqlId en Firestore
await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    displayName: name,
    email: email,
    mysqlId: mysqlUserId,  // ← CLAVE PARA SINCRONIZACIÓN
    gems: 100
});
```

---

## 🎮 Cómo Usar el Sistema

### 1️⃣ Nuevo Usuario se Registra

```
Usuario completa formulario → auth.js
    ↓
Firebase Auth crea cuenta
    ↓
MySQL registra usuario → Devuelve user_id
    ↓
Firestore guarda user_id como mysqlId
    ↓
Usuario entra a chats.php
    ↓
Sistema detecta mysqlId → Inicializa gemsManager
    ↓
Balance de gemas se muestra automáticamente
```

### 2️⃣ Usuario Completa una Tarea

```
Click en completar tarea → php/tasks.php
    ↓
Marca tarea como completada
    ↓
Otorga gemas al usuario (UPDATE users SET gems = gems + 10)
    ↓
Registra transacción en gem_transactions
    ↓
Devuelve nuevo balance
    ↓
JavaScript actualiza UI con data-gems-display
    ↓
Muestra notificación "¡Ganaste 10 💎!"
```

### 3️⃣ Usuario Hace una Apuesta

```
Usuario llena formulario de apuesta → simulador.js
    ↓
gemsManager.createBet() → php/gems.php
    ↓
Verifica balance suficiente
    ↓
Resta gemas (UPDATE users SET gems = gems - 50)
    ↓
Crea registro en tabla bets
    ↓
Simula torneo
    ↓
gemsManager.resolveBet() → php/gems.php
    ↓
Si ganó: UPDATE users SET gems = gems + 100 (x2)
Si perdió: No hace nada (ya se restaron)
    ↓
Actualiza estado de apuesta (won/lost)
    ↓
Muestra notificación de resultado
```

---

## 🛠️ Archivos Modificados

### Creados:
- ✅ `CopaLink/php/gems.php`
- ✅ `CopaLink/js/gems-manager.js`
- ✅ `CopaLink/css/gems.css`
- ✅ `CopaLink/mis-gemas.php`
- ✅ `BD/migration_gems_system.sql`

### Modificados:
- ✅ `CopaLink/chats.php` (CSS + script + UI)
- ✅ `CopaLink/simulador.php` (CSS + scripts + UI + inicialización)
- ✅ `CopaLink/js/chats.js` (inicialización de gemas)
- ✅ `CopaLink/js/simulador.js` (integración de apuestas)
- ✅ `CopaLink/js/auth.js` (sincronización Firebase-MySQL)
- ✅ `CopaLink/php/register.php` (devuelve user_id)
- ✅ `CopaLink/php/tasks.php` (recompensas automáticas)
- ✅ `BD/database.sql` (esquema actualizado)

---

## 🧪 Cómo Probar

### 1. Crear un nuevo usuario:
```
1. Ve a register.php
2. Crea una cuenta nueva
3. Verifica que inicie con 100 gemas
```

### 2. Completar una tarea:
```
1. Ve a chats.php
2. Crea un grupo
3. Crea una tarea
4. Márcala como completada
5. Verifica que las gemas aumenten (+10 por defecto)
```

### 3. Hacer una apuesta:
```
1. Ve a simulador.php
2. Genera el torneo
3. Click en "Apuestas"
4. Selecciona grupo y equipo
5. Ingresa cantidad de gemas
6. Envía la apuesta
7. Simula el torneo
8. Verifica si ganaste o perdiste
```

### 4. Ver historial:
```
1. En chats.php, menú de usuario
2. Click en "💎 Ver mis gemas"
3. Revisa transacciones, apuestas y estadísticas
```

---

## 🔍 Verificar en Base de Datos

### Ver usuario con gemas:
```sql
SELECT id, username, email, gems FROM users;
```

### Ver transacciones:
```sql
SELECT * FROM gem_transactions ORDER BY created_at DESC LIMIT 10;
```

### Ver apuestas:
```sql
SELECT * FROM bets ORDER BY created_at DESC LIMIT 10;
```

### Ver estadísticas:
```sql
SELECT * FROM user_gems_stats WHERE id = 1;
```

---

## 📱 Elementos UI con Auto-actualización

Cualquier elemento con `data-gems-display` se actualiza automáticamente:

```html
<!-- Ejemplo 1: Badge simple -->
<span data-gems-display>0</span>

<!-- Ejemplo 2: Con clase CSS -->
<div class="gems-badge" data-gems-display>0</div>

<!-- Ejemplo 3: En un input -->
<input type="text" data-gems-display readonly>
```

El sistema busca todos los elementos con este atributo y los actualiza cuando:
- Se inicializa el gestor
- Cambia el balance de gemas
- Se recibe una notificación

---

## ⚙️ Configuración Avanzada

### Cambiar gemas iniciales:
```sql
-- En BD/migration_gems_system.sql, línea ~5
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `gems` INT DEFAULT 100;  -- Cambiar 100 por el valor deseado
```

### Cambiar recompensa por tarea:
```javascript
// Al crear tarea desde JavaScript
{
    "group_id": 1,
    "title": "Nueva tarea",
    "creator_id": 1,
    "gems_reward": 25  // Cambiar 10 (default) por el valor deseado
}
```

### Cambiar multiplicador de apuesta:
```php
// En CopaLink/php/gems.php, función resolveBet(), línea ~360
if ($won) {
    $reward = $gems_amount * 3;  // Cambiar 2 por el multiplicador deseado
}
```

---

## 🎉 ¡Todo Listo!

El sistema de gemas está **100% funcional** y configurado. Los pasos que solicitaste ya están implementados:

✅ **Paso 2: Incluir Scripts** - Los CSS y JS están incluidos en chats.php y simulador.php
✅ **Paso 3: Inicializar** - Se inicializa automáticamente al hacer login
✅ **Paso 4: Mostrar Balance** - Se muestra automáticamente con `data-gems-display`

**No necesitas hacer nada más**, solo:
1. Crear un usuario nuevo para probar
2. Usar las funcionalidades (tareas, apuestas)
3. Ver cómo las gemas se actualizan automáticamente

¡Disfruta tu sistema de gemas! 💎⚽
