# 🔒 Sistema de Cifrado de Mensajes - CopaLink

## ✨ Funcionalidad implementada

El sistema permite **cifrar todos los mensajes** (chats privados y grupos) con un solo click.

### 🎯 Características:

- ✅ **Activación/Desactivación simple**: Un botón en el menú de usuario
- ✅ **Cifrado automático**: Todos los mensajes nuevos se cifran automáticamente
- ✅ **Persistente**: El estado se guarda en localStorage
- ✅ **Indicador visual**: El input cambia de color cuando el cifrado está activo
- ✅ **Compatible con adjuntos**: Funciona con imágenes, videos, archivos y ubicaciones
- ✅ **Mensajes protegidos**: Los mensajes cifrados no se pueden leer sin activar el cifrado

---

## 🚀 Cómo usar:

### Activar el cifrado:

1. Haz click en el **icono de usuario** (esquina superior derecha)
2. Haz click en **🔒 Cifrar chats**
3. ✅ Ahora todos tus mensajes se envían cifrados
4. 📝 El input mostrará: **"🔒 Escribe un mensaje cifrado"**

### Desactivar el cifrado:

1. Haz click en el **icono de usuario**
2. Haz click en **🔓 Descifrar chats**
3. ✅ Ahora los mensajes se envían sin cifrar

---

## 🔐 Seguridad:

### Algoritmo de cifrado:
- **XOR cipher** con clave personalizada
- **Base64 encoding** para transporte seguro
- Clave configurable en el código

### Importante:
⚠️ **Este es un cifrado básico para desarrollo**. Para producción se recomienda:
- Usar **AES-256** con Web Crypto API
- Implementar **intercambio de claves** (Diffie-Hellman)
- Usar **salt** y **IV** únicos por mensaje
- Implementar **cifrado end-to-end** real

---

## 📋 Comportamiento:

### Cuando el cifrado está activado:
- ✅ Mensajes nuevos se cifran automáticamente
- ✅ Mensajes cifrados se descifran al mostrarlos
- ✅ Input tiene borde verde y icono 🔒
- ✅ Notificación: "🔒 Cifrado activado"

### Cuando el cifrado está desactivado:
- ✅ Mensajes nuevos se envían en texto plano
- ⚠️ Mensajes cifrados anteriores muestran: "🔒 [Mensaje cifrado - Activa el cifrado para ver]"
- ✅ Input normal
- ✅ Notificación: "🔓 Cifrado desactivado"

---

## 🎨 Indicadores visuales:

### Input de mensaje:
```
Cifrado ON:  [🔒 Escribe un mensaje cifrado      ] (borde verde)
Cifrado OFF: [Escribe un mensaje                ] (borde normal)
```

### Botón en menú:
```
Cifrado OFF: 🔒 Cifrar chats
Cifrado ON:  🔓 Descifrar chats
```

### Mensajes:
```
Mensaje cifrado (cifrado OFF): 🔒 [Mensaje cifrado - Activa el cifrado para ver]
Mensaje cifrado (cifrado ON):  Hola, ¿cómo estás? (texto descifrado)
Mensaje normal:                Hola, ¿cómo estás?
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
- `encryptMessage(text)`: Cifra un mensaje
- `decryptMessage(encryptedText)`: Descifra un mensaje
- `updateEncryptButton()`: Actualiza UI según estado

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
