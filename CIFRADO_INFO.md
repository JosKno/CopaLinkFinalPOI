# 🔒 Sistema de Cifrado de Mensajes - CopaLink

## ✨ Funcionalidad implementada

El sistema permite **cifrar mensajes en la base de datos** con un solo click, mientras que en la interfaz siempre se ven en texto plano.

### 🎯 Características:

- ✅ **Activación/Desactivación simple**: Un botón en el menú de usuario
- ✅ **Cifrado transparente**: Los mensajes se cifran en BD pero se ven normales en la UI
- ✅ **Persistente**: El estado se guarda en localStorage
- ✅ **Indicador visual**: El input cambia de estilo cuando el cifrado está activo
- ✅ **Compatible con adjuntos**: Funciona con imágenes, videos, archivos y ubicaciones
- ✅ **Descifrado automático**: Los mensajes cifrados se descifran al cargar

---

## 🚀 Cómo usar:

### Activar el cifrado:

1. Haz click en el **icono de usuario** (esquina superior derecha)
2. Haz click en **🔒 Cifrar chats**
3. ✅ Ahora todos tus mensajes se guardan cifrados en la BD
4. 📝 El input mostrará: **"🔒 Escribe un mensaje cifrado"** (borde verde)
5. 💬 Los mensajes se ven normales en la conversación

### Desactivar el cifrado:

1. Haz click en el **icono de usuario**
2. Haz click en **🔓 Descifrar chats**
3. ✅ Ahora los mensajes se guardan sin cifrar en la BD

---

## 🔐 Seguridad:

### Algoritmo de cifrado:
- **XOR cipher** con clave personalizada
- **Base64 encoding** para almacenamiento seguro
- Clave configurable en el código
- **Descifrado automático** al mostrar mensajes

### Importante:
⚠️ **Este es un cifrado básico para desarrollo**. Para producción se recomienda:
- Usar **AES-256** con Web Crypto API
- Implementar **intercambio de claves** (Diffie-Hellman)
- Usar **salt** y **IV** únicos por mensaje
- Implementar **cifrado end-to-end** real

---

## 📋 Comportamiento:

### Cuando el cifrado está activado:
- ✅ Mensajes nuevos se cifran en la BD automáticamente
- ✅ Mensajes se ven en texto plano en la UI (descifrados)
- ✅ Input tiene borde verde y icono 🔒
- ✅ Notificación: "🔒 Cifrado activado - Los mensajes se guardan cifrados en la base de datos"

### Cuando el cifrado está desactivado:
- ✅ Mensajes nuevos se guardan sin cifrar en la BD
- ✅ Mensajes anteriores (cifrados) se descifran automáticamente al mostrar
- ✅ Input normal
- ✅ Notificación: "🔓 Cifrado desactivado - Los mensajes se guardan en texto plano"

---

## 🎨 Indicadores visuales:

### Input de mensaje:
```
Cifrado ON:  [🔒 Escribe un mensaje cifrado      ] (borde verde brillante)
Cifrado OFF: [Escribe un mensaje                ] (borde normal)
```

### Botón en menú:
```
Cifrado OFF: 🔒 Cifrar chats
Cifrado ON:  🔓 Descifrar chats
```

### Mensajes en conversación:
```
SIEMPRE se ven en texto plano, sin importar si están cifrados en la BD
Ejemplo: "Hola, ¿cómo estás?"
```

### En la base de datos:
```
Cifrado OFF: "Hola, ¿cómo estás?"
Cifrado ON:  "SGVsbG8sIMKvcXXDqSBlc3TDoXM/" (Base64)
```

---

## 🔧 Configuración técnica:

### Clave de cifrado:
La clave se define en `chats-db.js`:
```javascript
const ENCRYPTION_KEY = 'CopaLink2026Secret';
```

### Estado persistente:
El estado se guarda en localStorage:
```javascript
localStorage.getItem('encryptionEnabled') // 'true' o 'false'
```

### Funciones principales:
- `encryptMessage(text)`: Cifra un mensaje antes de guardarlo
- `decryptMessage(encryptedText)`: Descifra un mensaje al cargarlo
- `updateEncryptButton()`: Actualiza UI según estado

### Flujo de datos:

**Al enviar mensaje:**
```
Usuario escribe: "Hola mundo"
         ↓
Si cifrado ON: encryptMessage("Hola mundo") → "SGVsbG8gbXVuZG8="
         ↓
Se guarda en BD: {content: "SGVsbG8gbXVuZG8=", is_encrypted: true}
         ↓
Se muestra en UI: "Hola mundo" (descifrado automáticamente)
```

**Al cargar mensajes:**
```
BD devuelve: {content: "SGVsbG8gbXVuZG8=", is_encrypted: true}
         ↓
decryptMessage("SGVsbG8gbXVuZG8=") → "Hola mundo"
         ↓
Se muestra en UI: "Hola mundo"
```

---

## ⚠️ Limitaciones actuales:

1. **Clave compartida**: Todos usan la misma clave (no es seguro)
2. **No es end-to-end**: El servidor puede ver los mensajes
3. **Sin rotación de claves**: La clave nunca cambia
4. **Cifrado simple**: XOR es débil contra ataques

---

## 🚀 Mejoras futuras recomendadas:

### Para producción real:

1. **Implementar Web Crypto API**:
```javascript
// Ejemplo de AES-GCM
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);
```

2. **Intercambio de claves Diffie-Hellman**:
- Cada par de usuarios genera claves únicas
- Las claves nunca se envían al servidor

3. **Signal Protocol**:
- Implementar Double Ratchet Algorithm
- Perfect Forward Secrecy
- Deniability

4. **Verificación de identidad**:
- QR codes para verificar claves
- Safety numbers
- Key fingerprints

---

## 📝 Ejemplo de uso:

### Usuario 1:
1. Activa cifrado: "🔒 Cifrar chats"
2. Envía: "Hola secreto"
3. Se guarda cifrado: "SGVsbG8gc2VjcmV0bw==" (ejemplo)

### Usuario 2:
1. **Sin cifrado**: Ve "🔒 [Mensaje cifrado - Activa el cifrado para ver]"
2. **Con cifrado**: Ve "Hola secreto"

---

## 🎯 Conclusión:

Este sistema proporciona una **capa básica de privacidad** útil para desarrollo y demos. Para aplicaciones de producción con requisitos de seguridad reales, se debe implementar un sistema de cifrado más robusto (AES-256, Signal Protocol, etc.).

El código está estructurado para facilitar la actualización a un sistema más seguro en el futuro. 🚀
