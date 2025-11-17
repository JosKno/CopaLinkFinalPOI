# Sistema de Gemas - CopaLink

## 🎮 Descripción

Sistema completo de gestión de gemas para CopaLink que incluye:
- ✅ Balance de gemas por usuario
- ✅ Recompensas por tareas completadas
- ✅ Sistema de apuestas en el simulador
- ✅ Historial de transacciones
- ✅ Transferencias entre usuarios
- ✅ Sistema de logros y recompensas

## 📦 Instalación

### 1. Actualizar la Base de Datos

Ejecuta el script de migración en tu base de datos MySQL:

```sql
-- Opción A: Desde phpMyAdmin
-- Importa el archivo: BD/migration_gems_system.sql

-- Opción B: Desde línea de comandos
mysql -u root -p copalink < BD/migration_gems_system.sql
```

### 2. Verificar Archivos Creados/Modificados

**Nuevos archivos:**
- `CopaLink/php/gems.php` - API para gestión de gemas
- `CopaLink/js/gems-manager.js` - Cliente JavaScript
- `CopaLink/css/gems.css` - Estilos del sistema
- `CopaLink/mis-gemas.php` - Página de historial
- `BD/migration_gems_system.sql` - Script de migración

**Archivos modificados:**
- `BD/database.sql` - Esquema actualizado
- `CopaLink/php/tasks.php` - Incluye recompensas
- `CopaLink/js/simulador.js` - Integra apuestas

### 3. Incluir Scripts en tus Páginas

En `chats.php`, `simulador.php` y otras páginas donde uses gemas:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/gems.css">

<!-- JavaScript (después de Firebase) -->
<script src="js/gems-manager.js"></script>

<!-- Inicializar -->
<script>
// Obtener el user_id de tu sesión
const userId = <?php echo $_SESSION['user_id']; ?>;

// Inicializar el gestor de gemas
gemsManager.initialize(userId).then(() => {
    console.log('Gemas cargadas:', gemsManager.currentBalance);
});
</script>
```

### 4. Agregar Display de Gemas en la UI

```html
<!-- Mostrar balance de gemas -->
<div class="gems-display" data-gems-display>0</div>

<!-- O como badge -->
<span class="gems-badge" data-gems-display>0</span>
```

## 🚀 Uso del API

### Obtener Balance

```javascript
const balance = await gemsManager.getBalance();
console.log('Gemas:', balance);
```

### Crear Apuesta (Simulador)

```javascript
try {
    const bet = await gemsManager.createBet(
        'A',              // Grupo
        'Equipo 01',      // Equipo
        50,               // Cantidad de gemas
        'sim_123456'      // ID de simulación (opcional)
    );
    console.log('Apuesta creada:', bet);
} catch (error) {
    alert(error.message);
}
```

### Resolver Apuesta

```javascript
const result = await gemsManager.resolveBet(
    betId,    // ID de la apuesta
    true      // true = ganó, false = perdió
);

if (result.success) {
    console.log('Recompensa:', result.data.reward);
}
```

### Transferir Gemas

```javascript
await gemsManager.transferGems(
    toUserId,           // ID del usuario destinatario
    100,                // Cantidad
    'Regalo de gemas'   // Descripción
);
```

### Obtener Historial

```javascript
// Transacciones
const transactions = await gemsManager.getTransactions(50);

// Apuestas
const bets = await gemsManager.getUserBets('won'); // pending, won, lost, o null
```

## 📝 API PHP Endpoints

### GET Requests

```
GET php/gems.php?action=get_balance&user_id=1
GET php/gems.php?action=get_transactions&user_id=1&limit=50
GET php/gems.php?action=get_user_bets&user_id=1&status=won
```

### POST Requests

```javascript
// Añadir gemas
POST php/gems.php?action=add_gems
Body: {
    "user_id": 1,
    "amount": 50,
    "type": "earn",
    "description": "Bonus diario"
}

// Restar gemas
POST php/gems.php?action=subtract_gems
Body: {
    "user_id": 1,
    "amount": 30,
    "type": "spend",
    "description": "Compra de item"
}

// Transferir
POST php/gems.php?action=transfer
Body: {
    "from_user_id": 1,
    "to_user_id": 2,
    "amount": 100,
    "description": "Regalo"
}

// Crear apuesta
POST php/gems.php?action=create_bet
Body: {
    "user_id": 1,
    "bet_group": "A",
    "bet_team": "Equipo 01",
    "gems_amount": 50,
    "simulation_id": "sim_123"
}

// Resolver apuesta
POST php/gems.php?action=resolve_bet
Body: {
    "bet_id": 1,
    "won": true
}
```

## 🎯 Sistema de Tareas

Las tareas ahora otorgan recompensas automáticamente:

```php
// Al completar una tarea
POST php/tasks.php?action=update
Body: {
    "task_id": 1,
    "is_completed": true,
    "completed_by": 1  // ID del usuario que completó
}
```

La API automáticamente:
1. Marca la tarea como completada
2. Otorga las gemas al usuario
3. Registra la transacción
4. Retorna el nuevo balance

## 🎨 Personalización

### Cambiar Recompensas de Tareas

Al crear una tarea, especifica las gemas:

```javascript
{
    "group_id": 1,
    "title": "Nueva tarea",
    "creator_id": 1,
    "gems_reward": 25  // Por defecto: 10
}
```

### Modificar Multiplicador de Apuestas

En `CopaLink/php/gems.php`, línea ~360:

```php
// Cambiar de x2 a x3
$reward = $gems_amount * 3;
```

## 📊 Base de Datos

### Tablas Principales

- `users` - Columna `gems` añadida
- `gem_transactions` - Historial de movimientos
- `bets` - Apuestas del simulador
- `tasks` - Columnas de recompensa añadidas

### Vista de Estadísticas

```sql
SELECT * FROM user_gems_stats WHERE id = 1;
```

Muestra:
- Balance actual
- Total ganado
- Total gastado
- Tareas completadas
- Apuestas realizadas/ganadas/perdidas

## 🔧 Troubleshooting

### Las gemas no se actualizan en la UI

Verifica que:
1. El elemento tenga el atributo `data-gems-display`
2. GemsManager esté inicializado
3. La sesión PHP contenga el `user_id`

### Error: "Gemas insuficientes"

```javascript
// Verificar antes de apostar
if (gemsManager.hasEnoughGems(amount)) {
    // Proceder con la apuesta
}
```

### Las transacciones no se registran

Verifica que la tabla `gem_transactions` exista:

```sql
SHOW TABLES LIKE 'gem_transactions';
```

## 🎁 Sistema de Recompensas

Los logros están definidos en la tabla `rewards`. Para otorgar un logro:

```sql
INSERT INTO user_rewards (user_id, reward_id)
VALUES (1, 1);  -- Otorgar "Primer Paso"
```

## 📱 Responsive

El sistema de gemas es totalmente responsive. Las notificaciones se adaptan automáticamente a dispositivos móviles.

## 🔐 Seguridad

- ✅ Validación de balance antes de transacciones
- ✅ Trigger para prevenir gemas negativas
- ✅ Transacciones SQL atómicas
- ✅ Prepared statements para prevenir SQL injection

## 🚧 Próximas Mejoras

- [ ] Sistema de logros automático
- [ ] Tienda de items con gemas
- [ ] Ranking de usuarios por gemas
- [ ] Torneos con premios en gemas
- [ ] Sistema de referidos con bonus

## 📞 Soporte

Si encuentras problemas, revisa:
1. Logs de PHP en `php/gems.php`
2. Console de JavaScript
3. Verificar conexión a BD en `BD/Connection.php`

---

**Desarrollado para CopaLink** 💎⚽
Versión 1.0 - Noviembre 2025
