// js/chats-db.js - Sistema de chat con PHP/MySQL y WebSocket
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
  let currentChatId = null;
  let currentChatType = 'private'; // 'private' o 'group'
  let messageInterval = null;
  let lastMessagesHash = null; // Para detectar cambios en mensajes
  let socket = null;
  let allUsers = []; // Almacenar todos los usuarios
  let allGroups = []; // Almacenar todos los grupos
  let currentFilter = 'all'; // 'all', 'chats', 'groups'
  let searchQuery = ''; // Término de búsqueda actual
  
  // Estado de cifrado (persistente en localStorage)
  let encryptionEnabled = localStorage.getItem('encryptionEnabled') === 'true';
  const ENCRYPTION_KEY = 'CopaLink2026Secret'; // Clave para cifrado (en producción usar una más segura)

  // Selectores
  const chatListContainer = document.getElementById('chatListContainer');
  const promo = document.getElementById('placeholderPromo');
  const convo = document.getElementById('conversation');
  const convName = document.getElementById('convName');
  const convAvatar = document.getElementById('convAvatar');
  const convSub = document.querySelector('.conv-sub');
  const convBody = document.getElementById('convBody');
  const msgInput = document.getElementById('msgInput');
  const sendBtn = document.getElementById('sendBtn');
  const convBack = document.getElementById('convBack');
  const btnHome = document.getElementById('btnHome');
  const menuUserName = document.getElementById('menuUserName');
  const btnLogoutMenu = document.getElementById('btnLogoutMenu');
  const btnEncrypt = document.getElementById('btnEncrypt');
  const btnUserMenu = document.getElementById('btnUserMenu');
  const dropdown = document.getElementById('userDropdown');
  const btnMore = document.getElementById('btnMore');
  const btnVideo = document.getElementById('btnVideo');
  const chatMenu = document.getElementById('chatMenu');
  const mTasks = document.getElementById('mTasks');
  const sidePanel = document.getElementById('sidePanel');
  const spClose = document.getElementById('spClose');
  const spTitle = document.getElementById('spTitle');
  const spTasksBody = document.getElementById('spTasks');
  const taskCreateForm = document.getElementById('taskCreateForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const taskConfirmBtn = document.getElementById('taskConfirmBtn');
  const sidebar = document.querySelector('.sidebar');
  const panel = document.querySelector('.panel');
  const filterTabs = document.querySelectorAll('.sidebar-tabs .tab');
  const searchInput = document.getElementById('searchInput');
  // Video call selectors
  const callOverlay = document.getElementById('callOverlay');
  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  const endCallBtn = document.getElementById('endCallBtn');
  const callStatus = document.getElementById('callStatus');

  // Adjuntos
  const btnAttach = document.getElementById('btnAttach');
  const attachFile = document.getElementById('attachFile');
  const attachImage = document.getElementById('attachImage');
  const fileImage = document.getElementById('fileImage');
  const fileAny = document.getElementById('fileAny');
  const attachMenu = btnAttach?.closest('.input-group')?.querySelector('.attach-menu') || document.querySelector('.attach-menu');

  // === Subida de archivos a Supabase Storage ===
  fileImage?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!window.supabaseClient) {
        alert('Supabase no está configurado. Completa js/supabase-config.js');
        return;
      }
      const { url } = await supabaseUpload(file, 'image');
      sendMessageWithAttachment(url, 'image');
    } catch (err) {
      alert('Error al subir imagen: ' + err.message);
    }
    e.target.value = '';
  });

  const fileVideo = document.getElementById('fileVideo');
  fileVideo?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!window.supabaseClient) {
        alert('Supabase no está configurado. Completa js/supabase-config.js');
        return;
      }
      const { url } = await supabaseUpload(file, 'video');
      sendMessageWithAttachment(url, 'video', file.name);
    } catch (err) {
      alert('Error al subir video: ' + err.message);
    }
    e.target.value = '';
  });

  fileAny?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (!window.supabaseClient) {
        alert('Supabase no está configurado. Completa js/supabase-config.js');
        return;
      }
      const { url } = await supabaseUpload(file, 'file');
      sendMessageWithAttachment(url, 'file', file.name);
    } catch (err) {
      alert('Error al subir archivo: ' + err.message);
    }
    e.target.value = '';
  });

  // Función para enviar mensaje con adjunto (deberás implementarla en el siguiente paso)
  async function sendMessageWithAttachment(url, type, fileName = null) {
    if (!currentChatId) {
      alert('Selecciona un chat antes de enviar un adjunto.');
      return;
    }
    
    let contentText = '[Archivo]';
    if (type === 'image') contentText = '[Imagen]';
    else if (type === 'video') contentText = '[Video]';
    else if (fileName) contentText = fileName;
    
    // Cifrar el texto descriptivo si el cifrado está activado
    const messageContent = encryptionEnabled ? encryptMessage(contentText) : contentText;
    
    const payload = {
      sender_id: currentUser.id,
      recipient_id: currentChatType === 'private' ? currentChatId : undefined,
      group_id: currentChatType === 'group' ? currentChatId : undefined,
      content: messageContent,
      attachment: { url, type, fileName },
      created_at: new Date().toISOString(),
      username: currentUser.username || currentUser.email,
      is_encrypted: encryptionEnabled
    };

    try {
      // Persistir en backend primero
      const messageId = await persistAttachmentMessage(payload);
      payload.message_id = messageId;

      // Emitir por WebSocket para que otros reciban el adjunto
      if (socket && socket.connected) {
        socket.emit('send_message', payload);
      }

      // Recargar mensajes para mostrar el adjunto desde la BD
      await loadMessages();
    } catch (err) {
      console.error('Error al enviar adjunto:', err);
      alert('Error al enviar archivo: ' + err.message);
    }
  }

  // Función para enviar ubicación
  async function sendLocation() {
    if (!currentChatId) {
      alert('Selecciona un chat antes de enviar una ubicación.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    // Mostrar indicador de carga
    const loadingMsg = {
      sender_id: currentUser.id,
      content: '📍 Obteniendo ubicación...',
      created_at: new Date().toISOString(),
      username: currentUser.username || currentUser.email
    };
    addMessageToUI(loadingMsg);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationText = `📍 Ubicación: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        try {
          // Cifrar el texto de ubicación si el cifrado está activado
          const messageContent = encryptionEnabled ? encryptMessage(locationText) : locationText;
          
          const messageData = {
            sender_id: currentUser.id,
            content: messageContent,
            is_encrypted: encryptionEnabled,
            attachment_url: locationUrl,
            attachment_type: 'location',
            attachment_name: 'Ubicación compartida'
          };

          if (currentChatType === 'private') {
            messageData.recipient_id = currentChatId;
          } else {
            messageData.group_id = currentChatId;
          }

          // Enviar al backend
          const res = await fetch('php/messages.php?action=send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
          });

          const data = await res.json();

          if (data.success) {
            // Emitir por WebSocket
            if (socket && socket.connected) {
              socket.emit('send_message', {
                ...messageData,
                message_id: data.data.message_id,
                sender_name: currentUser.username,
                created_at: new Date().toISOString(),
                attachment: { url: locationUrl, type: 'location', fileName: 'Ubicación compartida' }
              });
            }

            // Recargar mensajes
            await loadMessages();
          } else {
            alert('Error al enviar ubicación: ' + data.message);
          }
        } catch (err) {
          console.error('Error al enviar ubicación:', err);
          alert('Error al enviar ubicación');
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        let errorMsg = 'No se pudo obtener tu ubicación.';
        if (error.code === 1) {
          errorMsg = 'Permiso de ubicación denegado. Habilítalo en la configuración de tu navegador.';
        } else if (error.code === 2) {
          errorMsg = 'Ubicación no disponible.';
        } else if (error.code === 3) {
          errorMsg = 'Tiempo de espera agotado al obtener ubicación.';
        }
        alert(errorMsg);
        // Recargar para eliminar el mensaje de "Obteniendo ubicación..."
        loadMessages();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // WebRTC state
  let pc = null;
  let localStream = null;
  let remoteStream = null;
  let callPeerId = null; // ID del usuario con el que se establece la llamada (para señalización)
  let pendingIceCandidates = []; // ICE recibidos antes de tener remoteDescription
  const rtcConfig = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

  // Helpers WebRTC
  function isCallActive() {
    return !!pc;
  }
  function hasSecureContext() {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);
    return window.isSecureContext || isLocalhost;
  }

  function getUserMediaCompat(constraints) {
    return new Promise((resolve, reject) => {
      const nav = navigator;
      if (nav.mediaDevices && nav.mediaDevices.getUserMedia) {
        nav.mediaDevices.getUserMedia(constraints).then(resolve).catch(reject);
        return;
      }
      const legacy = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia || nav.msGetUserMedia;
      if (legacy) {
        legacy.call(nav, constraints, (stream) => resolve(stream), (err) => reject(err));
      } else {
        reject(new Error('getUserMedia no disponible en este navegador.'));
      }
    });
  }

  // Verificar autenticación
  if (!currentUser) {
    window.location.href = 'login.php';
    return;
  }

  // Mostrar nombre del usuario en el menú
  if (menuUserName) {
    menuUserName.textContent = currentUser.username || currentUser.email;
  }

  // Mostrar gemas del usuario en el menú
  const menuUserGems = document.getElementById('menuUserGems');
  if (menuUserGems && currentUser.gems !== undefined) {
    menuUserGems.textContent = currentUser.gems;
  }

  // Cargar lista de usuarios y grupos
  chatListContainer.innerHTML = '';
  loadUsersList();
  loadGroupsList();

  // Inicializar WebSocket
  initializeWebSocket();

  // Event listeners

  // Mostrar/ocultar menú de adjuntos al hacer clic en +
  btnAttach?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (attachMenu) attachMenu.hidden = !attachMenu.hidden;
  });

  // Ocultar menú de adjuntos al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (attachMenu && !btnAttach?.contains(e.target) && !attachMenu.contains(e.target)) {
      attachMenu.hidden = true;
    }
  });

  // Abrir input de archivo al hacer clic en Documento
  attachFile?.addEventListener('click', () => {
    fileAny?.click();
    if (attachMenu) attachMenu.hidden = true;
  });

  // Abrir input de imagen al hacer clic en Foto
  attachImage?.addEventListener('click', () => {
    fileImage?.click();
    if (attachMenu) attachMenu.hidden = true;
  });

  // Abrir input de video al hacer clic en Video
  const attachVideo = document.getElementById('attachVideo');
  attachVideo?.addEventListener('click', () => {
    fileVideo?.click();
    if (attachMenu) attachMenu.hidden = true;
  });

  // Enviar ubicación al hacer clic en Ubicación
  const attachLocation = document.getElementById('attachLocation');
  attachLocation?.addEventListener('click', () => {
    if (attachMenu) attachMenu.hidden = true;
    sendLocation();
  });

  btnHome?.addEventListener('click', () => {
    if (isCallActive()) {
      const ok = confirm('Tienes una llamada en curso. ¿Colgar y salir al inicio?');
      if (ok) endCall(true); else return;
    }
    closeConversation();
  });

  convBack?.addEventListener('click', () => {
    if (isCallActive()) {
      const ok = confirm('Tienes una llamada en curso. ¿Colgar y volver a chats?');
      if (ok) endCall(true); else return;
    }
    closeConversation();
  });

  sendBtn?.addEventListener('click', () => {
    sendMessage();
  });

  msgInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  btnLogoutMenu?.addEventListener('click', async () => {
    await logout();
  });

  // Botón de cifrado/descifrado
  btnEncrypt?.addEventListener('click', () => {
    encryptionEnabled = !encryptionEnabled;
    localStorage.setItem('encryptionEnabled', encryptionEnabled);
    updateEncryptButton();
    
    const status = encryptionEnabled ? 'activado' : 'desactivado';
    const icon = encryptionEnabled ? '🔒' : '🔓';
    
    // Mostrar notificación
    showNotification(`${icon} Cifrado ${status}`, encryptionEnabled ? 'success' : 'info');
  });

  // Actualizar texto del botón según el estado
  function updateEncryptButton() {
    if (btnEncrypt) {
      btnEncrypt.innerHTML = encryptionEnabled 
        ? '🔓 Descifrar chats' 
        : '🔒 Cifrar chats';
      
      // Agregar indicador visual en el input cuando está cifrado
      if (msgInput) {
        if (encryptionEnabled) {
          msgInput.style.borderColor = '#4ade80';
          msgInput.style.boxShadow = '0 0 0 2px rgba(74, 222, 128, 0.2)';
          msgInput.placeholder = '🔒 Escribe un mensaje cifrado';
        } else {
          msgInput.style.borderColor = '';
          msgInput.style.boxShadow = '';
          msgInput.placeholder = 'Escribe un mensaje';
        }
      }
    }
  }

  // Inicializar el botón con el estado correcto
  updateEncryptButton();

  btnUserMenu?.addEventListener('click', () => {
    dropdown.hidden = !dropdown.hidden;
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!btnUserMenu?.contains(e.target) && !dropdown?.contains(e.target)) {
      dropdown.hidden = true;
    }
    if (!btnMore?.contains(e.target) && !chatMenu?.contains(e.target)) {
      chatMenu.hidden = true;
    }
  });

  // Botón "Más acciones" en el chat
  btnMore?.addEventListener('click', () => {
    chatMenu.hidden = !chatMenu.hidden;
  });

  // Iniciar videollamada (solo chats privados)
  btnVideo?.addEventListener('click', async () => {
    try {
      if (currentChatType !== 'private' || !currentChatId) {
        alert('La videollamada solo está disponible en chats privados.');
        return;
      }
      if (!socket || !socket.connected) {
        alert('Servidor en tiempo real no conectado. Asegúrate de que el servidor WebSocket esté en ejecución.');
        return;
      }
      // Advertir si el contexto no es seguro (requerido para cámara en móviles)
      const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname);
      if (!window.isSecureContext && !isLocalhost) {
        alert('Para usar cámara/micrófono en móviles, abre el sitio con HTTPS o desde localhost.');
      }
      console.log('Iniciando videollamada con', currentChatId);
      showCallOverlay('Preparando medios…');
      await startCall(currentChatId);
    } catch (e) {
      console.error('Error al iniciar videollamada:', e);
      alert('No se pudo iniciar la videollamada: ' + (e?.message || e));
      hideCallOverlay();
    }
  });

  endCallBtn?.addEventListener('click', () => {
    endCall(true);
  });

  // Abrir panel de tareas
  mTasks?.addEventListener('click', () => {
    if (currentChatType === 'group') {
      openTasksPanel();
    } else {
      alert('Las tareas solo están disponibles en grupos');
    }
    chatMenu.hidden = true;
  });

  // Filtros de tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover clase active de todos los tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      // Agregar clase active al tab clickeado
      tab.classList.add('active');
      // Obtener el filtro y aplicarlo
      currentFilter = tab.dataset.filter;
      applyFilter();
    });
  });

  // Búsqueda en tiempo real
  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    applyFilter();
  });

  // Cerrar panel lateral
  spClose?.addEventListener('click', () => {
    sidePanel.hidden = true;
  });

  // Crear tarea
  taskCreateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;
    
    await createTask(title);
    taskInput.value = '';
  });

  // Confirmar tareas realizadas
  taskConfirmBtn?.addEventListener('click', async () => {
    const checkboxes = taskList.querySelectorAll('input[type="checkbox"]:checked');
    for (const checkbox of checkboxes) {
      const taskId = parseInt(checkbox.dataset.taskId);
      await updateTask(taskId, true);
    }
    await loadTasks();
  });

  // Funciones
  async function loadUsersList() {
    try {
      const res = await fetch(`php/users.php?action=get_list&user_id=${currentUser.id}`);
      const data = await res.json();
      
      if (data.success) {
        allUsers = data.data;
        applyFilter();
      } else {
        console.error('Error al cargar usuarios:', data.message);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
    }
  }

  async function loadGroupsList() {
    try {
      const res = await fetch(`php/groups.php?action=get_list&user_id=${currentUser.id}`);
      const data = await res.json();
      
      if (data.success) {
        allGroups = data.data;
        applyFilter();
      } else {
        console.error('Error al cargar grupos:', data.message);
      }
    } catch (err) {
      console.error('Error de conexión:', err);
    }
  }

  function applyFilter() {
    chatListContainer.innerHTML = '';
    
    // Filtrar usuarios por búsqueda (solo por nombre)
    const filteredUsers = allUsers.filter(user => {
      if (!searchQuery) return true;
      return user.username.toLowerCase().includes(searchQuery);
    });
    
    // Filtrar grupos por búsqueda (solo por nombre)
    const filteredGroups = allGroups.filter(group => {
      if (!searchQuery) return true;
      return group.name.toLowerCase().includes(searchQuery);
    });
    
    // Aplicar filtro de tabs
    if (currentFilter === 'all') {
      renderUsersList(filteredUsers);
      renderGroupsList(filteredGroups);
    } else if (currentFilter === 'chats') {
      renderUsersList(filteredUsers);
    } else if (currentFilter === 'groups') {
      renderGroupsList(filteredGroups);
    }
    
    // Mostrar mensaje si no hay resultados
    if (chatListContainer.children.length === 0) {
      chatListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">No se encontraron resultados</div>';
    }
  }

  function renderUsersList(users) {
    users.forEach(user => {
      const chatItem = document.createElement('a');
      chatItem.className = 'chatitem';
      chatItem.href = '#';
      chatItem.innerHTML = `
        <div class="avatar ${user.connection_status === 'online' ? 'online' : ''}" data-user-id="${user.id}">${user.username.charAt(0).toUpperCase()}</div>
        <div class="meta">
          <div class="row1">
            <span>${user.username}</span>
          </div>
          <div class="row2">
            <span class="preview">${user.connection_status === 'online' ? 'En línea' : 'Desconectado'}</span>
          </div>
        </div>
      `;
      
      chatItem.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(user.id, user.username, 'private');
      });
      
      chatListContainer.appendChild(chatItem);
    });
  }

  function renderGroupsList(groups) {
    groups.forEach(group => {
      const chatItem = document.createElement('a');
      chatItem.className = 'chatitem';
      chatItem.href = '#';
      chatItem.innerHTML = `
        <div class="avatar grp">👥</div>
        <div class="meta">
          <div class="row1">
            <span>${group.name}</span>
          </div>
          <div class="row2">
            <span class="preview">${group.member_count} miembros</span>
          </div>
        </div>
      `;
      
      chatItem.addEventListener('click', (e) => {
        e.preventDefault();
        openChat(group.id, group.name, 'group');
      });
      
      chatListContainer.appendChild(chatItem);
    });
  }

  async function openChat(userId, userName, type = 'private') {
    console.log('[NAV] Abrir chat', { userId, userName, type, callActive: isCallActive() });
    // Si hay una llamada activa y se cambia de chat, colgar primero para evitar overlay global
    if (isCallActive()) {
      const proceed = confirm('Hay una videollamada activa. ¿Colgar antes de cambiar de chat?');
      if (proceed) {
        endCall(true);
      } else {
        return; // Cancelar cambio de chat
      }
    }
    currentChatId = userId;
    currentChatType = type;
    lastMessagesHash = null; // Reset hash al cambiar de chat
    
    promo.hidden = true;
    convo.hidden = false;
    
    // En móvil: ocultar sidebar y mostrar panel
    if (sidebar) sidebar.classList.add('mobile-hidden');
    if (panel) panel.classList.add('mobile-visible');
    
    convName.textContent = userName;
    convAvatar.textContent = userName.charAt(0).toUpperCase();
    convBody.innerHTML = '';
  // Mostrar botón de videollamada solo en privado
  if (btnVideo) btnVideo.hidden = (type !== 'private');
    // Actualizar subtítulo de estado para chats privados según lista en memoria
    if (type === 'private' && convSub) {
      const u = allUsers.find(u => u.id == userId);
      if (u) {
        convSub.textContent = (u.connection_status === 'online') ? 'en línea' : 'desconectado';
      } else {
        convSub.textContent = '';
      }
    } else if (convSub) {
      convSub.textContent = '';
    }
    
    await loadMessages();
    
    // Actualizar indicador visual de cifrado
    updateEncryptButton();
    
    // Actualizar mensajes cada 3 segundos
    if (messageInterval) clearInterval(messageInterval);
    messageInterval = setInterval(loadMessages, 3000);
  }

  async function loadMessages() {
    if (!currentChatId) return;
    
    try {
      let url;
      if (currentChatType === 'private') {
        url = `php/messages.php?action=get&user_id=${currentUser.id}&recipient_id=${currentChatId}&limit=50`;
      } else {
        url = `php/messages.php?action=get&user_id=${currentUser.id}&group_id=${currentChatId}&limit=50`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        // Calcular hash simple de los mensajes para detectar cambios
        const messagesHash = JSON.stringify(data.data.map(m => ({id: m.id, content: m.content, file_path: m.file_path})));
        
        // Solo re-renderizar si los mensajes cambiaron
        if (messagesHash !== lastMessagesHash) {
          lastMessagesHash = messagesHash;
          renderMessages(data.data);
        }
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  }

  function renderMessages(messages) {
    const shouldScroll = convBody.scrollHeight - convBody.scrollTop <= convBody.clientHeight + 100;
    
    convBody.innerHTML = '';
    
    messages.forEach(msg => {
      const isMe = msg.sender_id === currentUser.id;
      const msgDiv = document.createElement('div');
      msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-peer'}`;
      
      // Descifrar el mensaje si está cifrado
      let displayContent = msg.content;
      if (msg.is_encrypted && encryptionEnabled) {
        displayContent = decryptMessage(msg.content);
      } else if (msg.is_encrypted && !encryptionEnabled) {
        displayContent = '🔒 [Mensaje cifrado - Activa el cifrado para ver]';
      }
      
      let innerHTML = '';
      
      // Si es grupo y el mensaje NO es mío: mostrar nombre + gemas
      if (currentChatType === 'group' && !isMe) {
        innerHTML += `
          <div class="msg-head" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <strong>${msg.sender_name || 'Usuario'}</strong>
            <span class="gems" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;">
              <img src="assets/img/gema.png" alt="Gema" style="width:18px;height:18px;object-fit:contain;">
              0
            </span>
          </div>
        `;
      }
      
      // Renderizar adjuntos desde la base de datos
      if (msg.file_path) {
        // Detectar videos por extensión si file_type no es confiable
        const isVideo = msg.file_type === 'video' || 
                       /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(msg.file_path) ||
                       /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(msg.file_name || '');
        
        if (msg.file_type === 'image') {
          innerHTML += `<img src="${escapeHtml(msg.file_path)}" alt="Imagen adjunta" style="max-width:200px;border-radius:8px;margin-top:6px;">`;
        } else if (isVideo) {
          innerHTML += `<video controls preload="metadata" controlsList="nodownload" style="max-width:300px;border-radius:8px;margin-top:6px;">
            <source src="${escapeHtml(msg.file_path)}" type="video/mp4">
            <source src="${escapeHtml(msg.file_path)}" type="video/webm">
            <source src="${escapeHtml(msg.file_path)}" type="video/ogg">
            Tu navegador no soporta el elemento de video.
          </video>`;
        } else if (msg.file_type === 'location') {
          innerHTML += `<div style="margin-top:6px;">
            ${escapeHtml(displayContent)}<br>
            <a href="${escapeHtml(msg.file_path)}" target="_blank" class="btn btn-sm btn-primary" style="margin-top:4px;">
              🗺️ Ver en Google Maps
            </a>
          </div>`;
        } else {
          innerHTML += `<br><a href="${escapeHtml(msg.file_path)}" target="_blank" style="color:#007bff;text-decoration:underline;">📎 ${escapeHtml(msg.file_name || 'Descargar archivo')}</a>`;
        }
      } else {
        // Solo mostrar el texto si NO hay adjunto
        innerHTML += `${escapeHtml(displayContent)}`;
      }

      innerHTML += `<span class="time">${formatTime(msg.created_at)}</span>`;
      msgDiv.innerHTML = innerHTML;
      
      convBody.appendChild(msgDiv);
    });
    
    if (shouldScroll) {
      convBody.scrollTop = convBody.scrollHeight;
    }
  }

  async function sendMessage() {
    const content = msgInput.value.trim();
    if (!content || !currentChatId) return;
    
    try {
      // Cifrar el mensaje si el cifrado está activado
      const messageContent = encryptionEnabled ? encryptMessage(content) : content;
      
      const messageData = {
        sender_id: currentUser.id,
        content: messageContent,
        is_encrypted: encryptionEnabled
      };
      
      if (currentChatType === 'private') {
        messageData.recipient_id = currentChatId;
      } else {
        messageData.group_id = currentChatId;
      }
      
      const res = await fetch('php/messages.php?action=send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      });
      
      const data = await res.json();
      
      if (data.success) {
        msgInput.value = '';
        
        // Enviar por WebSocket para notificación en tiempo real
        if (socket && socket.connected) {
          socket.emit('send_message', {
            ...messageData,
            message_id: data.data.message_id,
            sender_name: currentUser.username,
            created_at: new Date().toISOString()
          });
        }
        
        await loadMessages();
      } else {
        alert('Error al enviar mensaje: ' + data.message);
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error de conexión al enviar mensaje');
    }
  }

  async function persistAttachmentMessage(payload) {
    const messageData = {
      sender_id: payload.sender_id,
      content: payload.content,
      is_encrypted: encryptionEnabled,
      attachment_url: payload.attachment.url,
      attachment_type: payload.attachment.type,
      attachment_name: payload.attachment.fileName || ''
    };
    
    if (currentChatType === 'private') {
      messageData.recipient_id = payload.recipient_id;
    } else {
      messageData.group_id = payload.group_id;
    }
    
    const res = await fetch('php/messages.php?action=send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messageData)
    });
    
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.message || 'Error al persistir adjunto');
    }
    return data.data.message_id;
  }

  function closeConversation() {
    console.log('[NAV] Cerrar conversación');
    if (messageInterval) clearInterval(messageInterval);
    currentChatId = null;
    convo.hidden = true;
    promo.hidden = false;
    convBody.innerHTML = '';
    hideCallOverlay(); // Asegurar que no quede overlay flotando
    
    // En móvil: mostrar sidebar y ocultar panel
    if (sidebar) sidebar.classList.remove('mobile-hidden');
    if (panel) panel.classList.remove('mobile-visible');
  }

  // ==================== FUNCIONES DE CIFRADO ====================
  
  // Función simple de cifrado usando XOR con la clave
  function encryptMessage(text) {
    if (!encryptionEnabled || !text) return text;
    
    try {
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        encrypted += String.fromCharCode(charCode);
      }
      // Convertir a Base64 para que sea seguro de transmitir
      return btoa(encrypted);
    } catch (e) {
      console.error('Error al cifrar:', e);
      return text;
    }
  }

  // Función de descifrado
  function decryptMessage(encryptedText) {
    if (!encryptionEnabled || !encryptedText) return encryptedText;
    
    try {
      // Decodificar de Base64
      const encrypted = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const charCode = encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
        decrypted += String.fromCharCode(charCode);
      }
      return decrypted;
    } catch (e) {
      console.error('Error al descifrar:', e);
      return encryptedText;
    }
  }

  // Función para mostrar notificaciones temporales
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 10001;
      background: ${type === 'success' ? 'linear-gradient(135deg, #00b09b, #96c93d)' : 'linear-gradient(135deg, #667eea, #764ba2)'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideOutRight {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  async function logout() {
    try {
      await fetch('php/logout.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id })
      });
      
      localStorage.removeItem('currentUser');
      window.location.href = 'login.php';
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
      localStorage.removeItem('currentUser');
      window.location.href = 'login.php';
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==================== WEBSOCKET ====================
  function initializeWebSocket() {
    // Detectar automáticamente el protocolo según la página
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const httpProtocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const wsUrl = `${protocol}://192.168.1.66:3000`;
    const httpUrl = `${httpProtocol}://192.168.1.66:3000`;
    
    console.log(`[WS] Conectando a: ${wsUrl}`);
    
    // Crear iframe invisible para pre-cargar el servidor
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'display:none;width:0;height:0;border:none;position:absolute;';
    iframe.src = httpUrl;
    
    iframe.onerror = () => {
      console.warn('[WS] No se pudo cargar iframe del servidor');
    };
    
    document.body.appendChild(iframe);
    
    // Delay para HTTPS, conexión inmediata para HTTP
    const delay = window.location.protocol === 'https:' ? 500 : 200;
    setTimeout(() => {
      connectWebSocket(wsUrl);
    }, delay);
  }
  
  function connectWebSocket(wsUrl) {
    socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000
    });
    
    setupSocketListeners();
  }
  
  function setupSocketListeners() {
    if (!socket) return;
    
    let connectionAttempts = 0;
    let hasShownAlert = false;
    
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      connectionAttempts = 0; // Reset intentos al conectar exitosamente
      hasShownAlert = false;
      // Registrar usuario en el WebSocket
      socket.emit('user_connected', currentUser);
      // Remover cualquier notificación de error previa
      const existingAlert = document.getElementById('wsConnectionAlert');
      if (existingAlert) existingAlert.remove();
    });

    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor WebSocket');
    });
    
    socket.on('connect_error', (error) => {
      connectionAttempts++;
      console.error('❌ Error de conexión WebSocket:', error);
      
      // Mostrar alerta solo después de varios intentos fallidos
      if (connectionAttempts >= 5 && !hasShownAlert) {
        hasShownAlert = true;
        showWebSocketConnectionAlert();
      }
    });

    // Escuchar nuevos mensajes
    socket.on('new_message', (data) => {
      console.log('📩 Nuevo mensaje recibido:', data);
      // Si el mensaje es para el chat actual, agregarlo
      if ((currentChatType === 'private' && data.recipient_id === currentUser.id && data.sender_id === currentChatId) ||
          (currentChatType === 'private' && data.sender_id === currentUser.id && data.recipient_id === currentChatId) ||
          (currentChatType === 'group' && data.group_id === currentChatId)) {
        addMessageToUI(data);
      }
    });

    // Escuchar cambios de estado de usuarios
    socket.on('user_status_change', (data) => {
      console.log(`👤 ${data.username} está ${data.status}`);
      updateUserStatus(data.userId, data.status);
    });

    // Escuchar nuevas tareas
    socket.on('new_task', (data) => {
      console.log('✓ Nueva tarea:', data);
      if (currentChatType === 'group' && data.group_id === currentChatId) {
        loadTasks();
      }
    });

    // Escuchar actualizaciones de tareas
    socket.on('task_update', (data) => {
      console.log('✓ Tarea actualizada:', data);
      if (currentChatType === 'group') {
        loadTasks();
      }
    });

    // ========== WebRTC signaling ==========
    socket.on('webrtc_offer', async (data) => {
      // data: { from_user_id, from_username, sdp }
      console.log('🔔 OFERTA WEBRTC RECIBIDA:', data);
      console.log('🔔 CurrentUser:', currentUser);
      console.log('🔔 Socket conectado:', socket.connected);
      try {
        // Guardar peer remoto
        callPeerId = data.from_user_id;
        // Auto-navegar al chat del usuario que llama (si no estamos ya ahí)
        if (currentChatId !== data.from_user_id || currentChatType !== 'private') {
          console.log('[CALL] Cambiando automáticamente al chat del usuario que llama');
          // Abrir sin preguntar por llamada activa (no hay aún) -> usar openChat
          await openChat(data.from_user_id, data.from_username, 'private');
        }
        if (!confirm(`Videollamada entrante de ${data.from_username}. ¿Aceptar?`)) {
          console.log('❌ Usuario rechazó la llamada');
          return;
        }
        console.log('✅ Usuario aceptó la llamada, preparando peer...');
        await preparePeer();
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Procesar ICE almacenados si llegaron antes
        await flushPendingIceCandidates();
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc_answer', {
          to_user_id: data.from_user_id,
          from_user_id: currentUser.id,
          sdp: answer
        });
        showCallOverlay(`En llamada con ${data.from_username}`);
      } catch (e) {
        console.error('Error al manejar oferta:', e);
        endCall(false);
      }
    });

    socket.on('webrtc_answer', async (data) => {
      try {
        await pc?.setRemoteDescription(new RTCSessionDescription(data.sdp));
        // Aplicar ICE pendientes
        await flushPendingIceCandidates();
        showCallOverlay('Conectado');
      } catch (e) {
        console.error('Error al manejar answer:', e);
      }
    });

    socket.on('webrtc_ice_candidate', async (data) => {
      try {
        if (data.candidate) {
          await addIceCandidateOrQueue(data.candidate);
        }
      } catch (e) {
        console.error('Error al agregar ICE candidate:', e);
      }
    });

    socket.on('webrtc_end_call', () => {
      endCall(false);
    });
  }

  // Función para mostrar alerta de conexión WebSocket
  function showWebSocketConnectionAlert() {
    const existingAlert = document.getElementById('wsConnectionAlert');
    if (existingAlert) return;
    
    const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
    const wsServerUrl = `${protocol}://192.168.1.66:3000`;
    
    const alertDiv = document.createElement('div');
    alertDiv.id = 'wsConnectionAlert';
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      max-width: 520px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideDown 0.3s ease-out;
    `;
    
    const isHttps = window.location.protocol === 'https:';
    const instruction = isHttps 
      ? 'Para HTTPS, necesitas aceptar el certificado del servidor (solo una vez).'
      : 'Verifica que el servidor WebSocket esté ejecutándose.';
    
    alertDiv.innerHTML = `
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
        ⚠️ Servidor WebSocket Desconectado
      </div>
      <div style="font-size: 14px; margin-bottom: 15px; opacity: 0.95;">
        ${instruction}
      </div>
      <div style="font-size: 13px; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 15px; text-align: left;">
        <strong>Para iniciar el servidor:</strong><br>
        1. Abre terminal en: <code>websocket/</code><br>
        2. Ejecuta: <code>npm start</code>
      </div>
      <a href="${wsServerUrl}" target="_blank" style="
        display: inline-block;
        background: white;
        color: #dc2626;
        padding: 12px 28px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        margin-right: 10px;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ${isHttps ? '🔓 Aceptar Certificado' : '🔍 Verificar Servidor'}
      </a>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.15);
        color: white;
        border: 1px solid rgba(255,255,255,0.5);
        padding: 12px 28px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s;
      " onmouseover="this.style.background='rgba(255,255,255,0.25)'" 
         onmouseout="this.style.background='rgba(255,255,255,0.15)'">
        Cerrar
      </button>
      ${isHttps ? `
        <div style="font-size: 12px; margin-top: 15px; opacity: 0.85; line-height: 1.5;">
          <strong>Paso 1:</strong> Haz clic en "Aceptar Certificado"<br>
          <strong>Paso 2:</strong> Acepta el certificado en la nueva ventana<br>
          <strong>Paso 3:</strong> Regresa y recarga (F5)
        </div>
      ` : ''}
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(alertDiv);
  }

  async function startCall(targetUserId) {
    console.log('📞 Iniciando llamada a usuario:', targetUserId);
    console.log('📞 Usuario actual:', currentUser);
    console.log('📞 Socket conectado:', socket?.connected);
    try {
      // Definir de inmediato el peer remoto para que onicecandidate lo use
      callPeerId = targetUserId;
      await preparePeer();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const payload = {
        to_user_id: targetUserId,
        from_user_id: currentUser.id,
        from_username: currentUser.username,
        sdp: offer
      };
      console.log('📤 Enviando oferta WebRTC:', payload);
      socket.emit('webrtc_offer', payload);
      showCallOverlay('Llamando…');
    } catch (e) {
      console.error('Error al iniciar llamada:', e);
      alert('Error al iniciar llamada: ' + (e?.message || e));
      endCall(false);
    }
  }

  async function preparePeer() {
    if (!pc) {
      pc = new RTCPeerConnection(rtcConfig);
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Usar callPeerId definido durante oferta/respuesta
          if (callPeerId) {
            socket.emit('webrtc_ice_candidate', {
              to_user_id: callPeerId,
              from_user_id: currentUser.id,
              candidate: event.candidate
            });
          }
        }
      };
      pc.ontrack = (event) => {
        if (!remoteStream) {
          remoteStream = new MediaStream();
          if (remoteVideo) remoteVideo.srcObject = remoteStream;
        }
        event.streams[0].getTracks().forEach((t) => remoteStream.addTrack(t));
      };
    }

    if (!localStream) {
      // Requerido HTTPS en móviles (excepto localhost)
      if (!hasSecureContext()) {
        throw new Error('Cámara/micrófono requieren HTTPS o localhost.');
      }
      // Intentar estándar y luego prefijos
      localStream = await getUserMediaCompat({ video: true, audio: true });
      if (localVideo) localVideo.srcObject = localStream;
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }
  }

  function showCallOverlay(statusText = '') {
    if (callOverlay) callOverlay.hidden = false;
    if (callStatus && statusText) callStatus.textContent = statusText;
    // Evitar que aparezca sobre otros chats: fijar al contenedor visible
    if (convo && !convo.hidden) {
      convo.appendChild(callOverlay);
    }
  }

  function hideCallOverlay() {
    if (callOverlay) callOverlay.hidden = true;
    if (callStatus) callStatus.textContent = '';
  }

  // ====== ICE helpers: cola y vaciado seguro ======
  async function addIceCandidateOrQueue(candidate) {
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate aplicado');
      } catch (e) {
        console.error('Error aplicando ICE candidate:', e);
      }
    } else {
      console.log('⏳ ICE candidate en cola (sin remoteDescription)');
      pendingIceCandidates.push(candidate);
    }
  }

  async function flushPendingIceCandidates() {
    if (!pc || !pc.remoteDescription || !pendingIceCandidates.length) return;
    console.log(`🚿 Aplicando ${pendingIceCandidates.length} ICE candidates en cola...`);
    const queued = pendingIceCandidates.slice();
    pendingIceCandidates = [];
    for (const c of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (e) {
        console.error('Error aplicando ICE candidate en flush:', e);
      }
    }
  }

  function endCall(notifyPeer = false) {
    if (notifyPeer && socket && currentChatType === 'private' && currentChatId) {
      // Preferir callPeerId si existe
      const target = callPeerId || currentChatId;
      if (target) {
        socket.emit('webrtc_end_call', { to_user_id: target, from_user_id: currentUser.id });
      }
    }
    try { pc && pc.getSenders().forEach(s => s.track && s.track.stop()); } catch {}
    try { localStream && localStream.getTracks().forEach(t => t.stop()); } catch {}
    try { pc && pc.close(); } catch {}
    pc = null;
    localStream = null;
    remoteStream = null;
    callPeerId = null;
    pendingIceCandidates = [];
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
    hideCallOverlay();
  }

  function addMessageToUI(msg) {
    const isMe = msg.sender_id === currentUser.id;
    const msgDiv = document.createElement('div');
    msgDiv.className = `msg ${isMe ? 'msg-me' : 'msg-peer'}`;
    
    // Descifrar el mensaje si está cifrado y el cifrado está activado
    let displayContent = msg.content;
    if (msg.is_encrypted && encryptionEnabled) {
      displayContent = decryptMessage(msg.content);
    } else if (msg.is_encrypted && !encryptionEnabled) {
      displayContent = '🔒 [Mensaje cifrado - Activa el cifrado para ver]';
    }
    
    let innerHTML = '';
    
    if (currentChatType === 'group' && !isMe) {
      innerHTML += `
        <div class="msg-head" style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <strong>${msg.sender_name || 'Usuario'}</strong>
          <span class="gems" style="display:inline-flex;align-items:center;gap:6px;font-weight:800;">
            <img src="assets/img/gema.png" alt="Gema" style="width:18px;height:18px;object-fit:contain;">
            0
          </span>
        </div>
      `;
    }
    
    // Adjuntos
    if (msg.attachment?.url) {
      if (msg.attachment.type === 'image') {
        innerHTML += `<div class="msg-attachment"><img src="${msg.attachment.url}" alt="img" style="max-width:220px;border-radius:8px;margin-top:6px;" loading="lazy"></div>`;
      } else if (msg.attachment.type === 'video') {
        innerHTML += `<div class="msg-attachment"><video controls preload="metadata" controlsList="nodownload" style="max-width:300px;border-radius:8px;margin-top:6px;">
          <source src="${msg.attachment.url}" type="video/mp4">
          <source src="${msg.attachment.url}" type="video/webm">
          <source src="${msg.attachment.url}" type="video/ogg">
          Tu navegador no soporta el elemento de video.
        </video></div>`;
      } else if (msg.attachment.type === 'location') {
        innerHTML += `<div class="msg-attachment" style="margin-top:6px;">
          ${escapeHtml(displayContent)}<br>
          <a href="${msg.attachment.url}" target="_blank" class="btn btn-sm btn-primary" style="margin-top:4px;">
            🗺️ Ver en Google Maps
          </a>
        </div>`;
      } else {
        const safeName = escapeHtml(msg.attachment.fileName || 'Archivo');
        innerHTML += `<br>${escapeHtml(displayContent)}<br><div class="msg-attachment" style="margin-top:6px;"><a href="${msg.attachment.url}" target="_blank" rel="noopener" class="file-link">📎 ${safeName}</a></div>`;
      }
      innerHTML += `<span class="time">${formatTime(msg.created_at || new Date().toISOString())}</span>`;
    } else {
      // Solo mostrar contenido de texto si no hay adjunto visual
      innerHTML += `${escapeHtml(displayContent)}<span class="time">${formatTime(msg.created_at || new Date().toISOString())}</span>`;
    }
    msgDiv.innerHTML = innerHTML;
    
    convBody.appendChild(msgDiv);
    convBody.scrollTop = convBody.scrollHeight;
  }

  function updateUserStatus(userId, status) {
    // Actualizar el indicador de estado en la lista de chats
    const chatItems = document.querySelectorAll('.chatitem');
    chatItems.forEach(item => {
      const avatar = item.querySelector('.avatar');
      if (avatar && avatar.dataset.userId == userId) {
        if (status === 'online') {
          avatar.classList.add('online');
        } else {
          avatar.classList.remove('online');
        }
        // Actualizar texto preview
        const preview = item.querySelector('.preview');
        if (preview) {
          preview.textContent = status === 'online' ? 'En línea' : 'Desconectado';
        }
      }
    });

    // Si el chat abierto corresponde a este usuario (chat privado), actualizar subtítulo
    if (currentChatType === 'private' && currentChatId == userId && convSub) {
      convSub.textContent = status === 'online' ? 'en línea' : 'desconectado';
    }
  }

  // ==================== FUNCIONES DE TAREAS ====================
  async function openTasksPanel() {
    sidePanel.hidden = false;
    spTitle.textContent = 'Administrador de tareas';
    spTasksBody.hidden = false;
    await loadTasks();
  }

  async function createTask(title) {
    try {
      const res = await fetch('php/tasks.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_id: currentChatId,
          title: title,
          creator_id: currentUser.id
        })
      });
      
      const data = await res.json();
      if (data.success) {
        // Notificar por WebSocket
        if (socket && socket.connected) {
          socket.emit('task_created', {
            group_id: currentChatId,
            task_id: data.data.task_id,
            title: title,
            creator_name: currentUser.username
          });
        }
        await loadTasks();
      } else {
        alert('Error al crear tarea: ' + data.message);
      }
    } catch (err) {
      console.error('Error al crear tarea:', err);
    }
  }

  async function loadTasks() {
    if (!currentChatId || currentChatType !== 'group') return;
    
    try {
      const res = await fetch(`php/tasks.php?action=get_list&group_id=${currentChatId}`);
      const data = await res.json();
      
      if (data.success) {
        renderTasks(data.data);
      }
    } catch (err) {
      console.error('Error al cargar tareas:', err);
    }
  }

  function renderTasks(tasks) {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
      taskList.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,.5);padding:20px;">No hay tareas aún</p>';
      return;
    }
    
    tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      taskItem.style.cssText = 'padding:10px;border-bottom:1px solid rgba(255,255,255,.08);display:flex;align-items:center;gap:10px;';
      
      taskItem.innerHTML = `
        <input type="checkbox" ${task.is_completed ? 'checked disabled' : ''} data-task-id="${task.id}" style="width:18px;height:18px;cursor:${task.is_completed ? 'not-allowed' : 'pointer'};">
        <div style="flex:1;">
          <div style="font-weight:600;${task.is_completed ? 'text-decoration:line-through;color:rgba(255,255,255,.5);' : ''}">${escapeHtml(task.title)}</div>
          <div style="font-size:.85rem;color:rgba(255,255,255,.6);">Creada por: ${escapeHtml(task.creator_name)}</div>
        </div>
        ${task.is_completed ? '<span style="color:#22c55e;font-weight:700;">✓ Completada</span>' : ''}
      `;
      
      taskList.appendChild(taskItem);
    });
  }

  async function updateTask(taskId, isCompleted) {
    try {
      const res = await fetch('php/tasks.php?action=update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          is_completed: isCompleted ? 1 : 0,
          completed_by: currentUser.id
        })
      });
      
      const data = await res.json();
      if (!data.success) {
        console.error('Error al actualizar tarea:', data.message);
      } else {
        // Si se completó una tarea y se ganaron gemas, actualizar el balance localmente
        if (data.data && data.data.gems_earned) {
          console.log(`✓ ¡Tarea completada! Ganaste ${data.data.gems_earned} gemas. Nuevo balance: ${data.data.new_balance}`);
          
          // Actualizar el balance de gemas en currentUser
          currentUser.gems = data.data.new_balance;
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          
          // Actualizar la UI
          const menuUserGems = document.getElementById('menuUserGems');
          if (menuUserGems) {
            menuUserGems.textContent = currentUser.gems;
          }
        }
        
        // Notificar por WebSocket
        if (socket && socket.connected) {
          socket.emit('task_updated', {
            task_id: taskId,
            is_completed: isCompleted
          });
        }
      }
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
    }
  }
});
