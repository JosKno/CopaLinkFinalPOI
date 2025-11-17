# Sistema de Simulación del Mundial 2026

## Resumen de Implementación

Se ha implementado un sistema completo de simulación del Mundial de Fútbol 2026 con los 48 equipos clasificados, sistema de poder, y recompensas progresivas por rendimiento.

---

## 🗂️ Archivos Creados/Modificados

### Nuevos Archivos

1. **BD/teams_migration.sql**
   - Tabla `teams` con 48 equipos clasificados
   - Cada equipo tiene: nombre, nivel de poder (50-100), código FIFA, confederación
   - Equipos ordenados por nivel realista basado en ranking FIFA

2. **CopaLink/php/teams.php**
   - API para obtener equipos desde la base de datos
   - Endpoint: `GET php/teams.php?action=get_all`
   - Retorna todos los equipos con shuffle aleatorio

### Archivos Modificados

3. **CopaLink/js/simulador.js**
   - Carga equipos desde BD en lugar de array dummy
   - Sistema de simulación basado en poder + suerte
   - Fase de grupos con partidos reales (todos contra todos)
   - Sistema de clasificación por puntos, diferencia de goles
   - Fase eliminatoria con simulación realista
   - Sistema de recompensas progresivas

4. **CopaLink/simulador.php**
   - Validación de sesión usando localStorage (sin Firebase)
   - Display de gemas del usuario autenticado

---

## ⚽ Mecánica de Simulación

### Fase de Grupos

1. **Distribución**: 48 equipos distribuidos aleatoriamente en 12 grupos (A-L) de 4 equipos
2. **Partidos**: Cada equipo juega contra todos en su grupo (round-robin)
3. **Simulación de Partidos**:
   ```javascript
   Poder Efectivo = Nivel de Poder (50-100) + Suerte (0-20)
   Probabilidad Victoria = Poder Efectivo A / (Poder A + Poder B)
   Goles = Calculados según probabilidad y azar
   ```
4. **Clasificación**: Top 2 de cada grupo según:
   - Puntos (Victoria: 3, Empate: 1, Derrota: 0)
   - Diferencia de goles
   - Goles a favor

### Fase Eliminatoria

1. **Ronda de 32**: 24 clasificados (top 2) + 8 mejores terceros
2. **Simulación**: Cada partido basado en poder + suerte
3. **Empates**: En caso de empate, simulación de penales (50/50 con leve ventaja al más fuerte)
4. **Progresión**: R32 → Octavos → Cuartos → Semifinales → Final → Campeón

---

## 💎 Sistema de Apuestas y Recompensas

### Mecánica de Apuesta

1. Usuario selecciona **grupo** y **equipo**
2. Ingresa cantidad de **gemas a apostar**
3. Sistema valida balance suficiente
4. **Descuenta gemas inmediatamente** al confirmar
5. Apuesta es por **clasificación del equipo a la siguiente ronda**

### Sistema de Recompensas Progresivas

| Etapa de Eliminación | Multiplicador | Ejemplo (100 gemas) |
|---------------------|---------------|---------------------|
| **Fase de Grupos** | 0% | Pierde 100 💎 |
| **Dieciseisavos** | 50% | Recupera 50 💎 |
| **Octavos** | 100% | Recupera 100 💎 |
| **Cuartos** | 150% | Gana 150 💎 (+50) |
| **Semifinales** | 200% | Gana 200 💎 (+100) |
| **Subcampeón** | 250% | Gana 250 💎 (+150) |
| **Campeón** | 300% | Gana 300 💎 (+200) |

### Cálculo de Ganancia

```javascript
Recompensa = Apuesta × Multiplicador
Ganancia Neta = Recompensa - Apuesta

Ejemplo: Apuesta 100 gemas por Brasil
- Si Brasil es Campeón → Recompensa: 300, Ganancia: +200
- Si Brasil pierde en Cuartos → Recompensa: 150, Ganancia: +50
- Si Brasil no clasifica → Recompensa: 0, Ganancia: -100
```

---

## 🎮 Flujo de Juego Completo

### Paso 1: Generar Torneo
- Click en **"Generar torneo"**
- Sistema carga 48 equipos desde BD
- Distribuye aleatoriamente en 12 grupos
- Muestra equipos con su nivel de poder (⚡)

### Paso 2: Realizar Apuesta
- Click en **"Apuestas"**
- Seleccionar grupo y equipo
- Ingresar cantidad de gemas
- Click en **"Apostar"**
- Gemas se descuentan inmediatamente

### Paso 3: Simular Fase de Grupos
- Al apostar, automáticamente simula grupos
- Muestra clasificados (top 2 por grupo)
- Indica si el equipo apostado clasificó o no
- **Si NO clasificó**: Pierde apuesta, fin del torneo

### Paso 4: Generar Llaves (si clasificó)
- Click en **"Generar llaves"**
- Sistema construye bracket de 32 equipos
- Muestra emparejamientos de Ronda de 32

### Paso 5: Simular Fase Eliminatoria
- Click en **"Simular llaves"**
- Sistema simula: R32 → Octavos → Cuartos → Semis → Final
- Muestra ganadores y perdedores en cada ronda
- Determina campeón del torneo

### Paso 6: Recibir Recompensas
- Sistema detecta en qué ronda fue eliminado el equipo apostado
- Calcula multiplicador según rendimiento
- Otorga recompensa automáticamente
- Actualiza balance de gemas del usuario
- Muestra notificación con detalles

---

## 📊 Equipos Clasificados (Ejemplos)

### Poder 90-100 (Elite)
- Brasil (98), Argentina (97), Francia (96), Inglaterra (95), España (94)
- Alemania (93), Portugal (92), Países Bajos (91), Bélgica (90), Italia (90)

### Poder 80-89 (Alto Nivel)
- Uruguay (88), Croacia (87), Colombia (86), México (85), Estados Unidos (84)
- Dinamarca (83), Suiza (82), Senegal (81), Japón (80), Corea del Sur (80)

### Poder 70-79 (Medio-Alto)
- Polonia (78), Serbia (77), Marruecos (76), Canadá (75), Gales (74)
- Ucrania (73), Ecuador (72), Suecia (71), Irán (70), Perú (70)

### Poder 60-69 (Medio)
- Chile (68), Nigeria (67), Costa Rica (66), Túnez (65), Australia (64)
- Camerún (63), Argelia (62), Arabia Saudita (61), Catar (60), Irak (60)

### Poder 50-59 (Base)
- Egipto (58), Ghana (57), Panamá (56), Jamaica (55), Paraguay (55)
- Venezuela (55), Uzbekistán (54), Nueva Zelanda (53), Islandia (52)
- Eslovaquia (52), Honduras (51), Bolivia (50)

---

## 🔧 Configuración Técnica

### Base de Datos
```sql
-- Tabla teams
CREATE TABLE teams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  power_level INT CHECK (power_level >= 50 AND power_level <= 100),
  fifa_code VARCHAR(3) NOT NULL UNIQUE,
  confederation ENUM('UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC')
);
```

### API Endpoints

**Obtener Equipos**
```
GET php/teams.php?action=get_all
Response: { success: true, data: [{ id, name, power_level, fifa_code, confederation }] }
```

**Descontar Gemas (Apuesta)**
```
POST php/gems.php?action=subtract
Body: { user_id, amount, transaction_type, description }
Response: { success: true, data: { new_balance } }
```

**Otorgar Gemas (Recompensa)**
```
POST php/gems.php?action=add
Body: { user_id, amount, transaction_type, description }
Response: { success: true, data: { new_balance } }
```

---

## ✅ Estado de Implementación

- [x] Tabla de equipos con 48 selecciones
- [x] API para obtener equipos
- [x] Carga de equipos desde BD
- [x] Simulación basada en nivel de poder
- [x] Fase de grupos con partidos reales
- [x] Sistema de clasificación realista
- [x] Fase eliminatoria con penales
- [x] Sistema de apuestas
- [x] Descuento inmediato de gemas
- [x] Sistema de recompensas progresivas
- [x] Actualización automática de balance
- [x] Notificaciones de resultados
- [x] Tracking de eliminación por ronda

---

## 🚀 Cómo Usar

1. **Iniciar sesión** en la aplicación
2. Navegar a **Simulador**
3. Click en **"Generar torneo"**
4. Click en **"Apuestas"** y seleccionar equipo
5. Ingresar gemas y confirmar
6. Ver resultados de fase de grupos
7. Si clasificó: Click en **"Generar llaves"**
8. Click en **"Simular llaves"**
9. Ver campeón y recibir recompensas

---

## 📝 Notas Importantes

- **Las gemas se descuentan al apostar**, no al finalizar
- **Solo se apuesta por clasificación a siguiente ronda**, no por campeón
- **Las recompensas dependen de qué tan lejos llegue el equipo**
- **La simulación es automática**, el usuario no controla los partidos
- **Nivel de poder influye pero no garantiza victoria** (factor suerte)
- **Todos los resultados son guardados en la base de datos**

---

## 🎯 Estrategia Recomendada

1. **Equipos Elite (90+)**: Alta probabilidad de llegar lejos, recompensa probable
2. **Equipos Medio-Alto (70-79)**: Riesgo moderado, pueden sorprender
3. **Equipos Bajo (50-69)**: Alto riesgo, pero si llegan lejos, grandes ganancias

**Balance óptimo**: Apostar equipos con poder 85-92 para equilibrio riesgo/recompensa
