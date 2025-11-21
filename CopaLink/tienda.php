<?php // Tienda de Recompensas ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Tienda de Recompensas</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/landing.css" />
  <link rel="stylesheet" href="css/chats.css" />
  <link rel="stylesheet" href="css/gems.css" />
  <style>
    .store-container {
      min-height: 100vh;
      padding: 100px 20px 40px;
      position: relative;
      z-index: 1;
    }

    .store-header {
      text-align: center;
      margin-bottom: 40px;
      animation: fadeInDown 0.6s ease-out;
    }

    .active-reward-selector {
      max-width: 500px;
      margin: 30px auto 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 2px solid rgba(255,255,255,0.2);
      padding: 20px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }

    .selector-label {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      margin-bottom: 12px;
      display: block;
    }

    .selector-wrapper {
      position: relative;
    }

    .custom-select {
      width: 100%;
      padding: 14px 40px 14px 16px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      appearance: none;
      transition: all 0.3s ease;
      outline: none;
    }

    .custom-select:hover {
      border-color: rgba(255,255,255,0.5);
      background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.08));
    }

    .custom-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }

    .custom-select option {
      background: #1e293b;
      color: white;
      padding: 12px;
    }

    .selector-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: rgba(255,255,255,0.7);
      font-size: 1.2rem;
    }

    .btn-apply {
      margin-top: 12px;
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border: none;
      border-radius: 12px;
      color: white;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    }

    .btn-apply:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
    }

    .btn-apply:active {
      transform: translateY(0);
    }

    .store-header h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: white;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      margin-bottom: 10px;
    }

    .store-header p {
      font-size: 1.1rem;
      color: rgba(255,255,255,0.9);
      margin-bottom: 20px;
    }

    .gems-balance {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
      backdrop-filter: blur(10px);
      padding: 12px 24px;
      border-radius: 50px;
      border: 2px solid rgba(255,255,255,0.3);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      font-size: 1.2rem;
      font-weight: 700;
      color: white;
    }

    .gems-balance img {
      width: 28px;
      height: 28px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .rewards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
      animation: fadeInUp 0.6s ease-out 0.2s both;
    }

    .reward-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05));
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 2px solid rgba(255,255,255,0.2);
      padding: 24px;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .reward-card.purchased {
      opacity: 0.6;
      cursor: not-allowed;
      border-color: rgba(255,255,255,0.1);
    }

    .reward-card.purchased::after {
      content: '✓ COMPRADO';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(34, 197, 94, 0.9);
      color: white;
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 1.1rem;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
      z-index: 10;
    }

    .reward-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .reward-card:hover {
      transform: translateY(-8px);
      border-color: rgba(255,255,255,0.4);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .reward-card:hover::before {
      opacity: 1;
    }

    .reward-icon {
      width: 100%;
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 6rem;
      margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
      border-radius: 16px;
      position: relative;
      overflow: hidden;
    }

    .reward-icon::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255,255,255,0.1) 50%,
        transparent 70%
      );
      animation: shine 3s infinite;
    }

    @keyframes shine {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }

    .reward-name {
      font-size: 1.3rem;
      font-weight: 700;
      color: white;
      margin-bottom: 8px;
      text-align: center;
    }

    .reward-description {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.8);
      margin-bottom: 16px;
      text-align: center;
      min-height: 40px;
      flex-grow: 1;
    }

    .reward-price {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 800;
      color: white;
      box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
      transition: all 0.3s ease;
    }

    .reward-card:hover .reward-price {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(251, 191, 36, 0.6);
    }

    .reward-price img {
      width: 24px;
      height: 24px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .btn-back {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1));
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255,255,255,0.3);
      color: white;
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    .btn-back:hover {
      background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.2));
      transform: translateX(-4px);
      color: white;
    }

    .rarity-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .rarity-common {
      background: linear-gradient(135deg, #9ca3af, #6b7280);
      color: white;
    }

    .rarity-rare {
      background: linear-gradient(135deg, #60a5fa, #3b82f6);
      color: white;
    }

    .rarity-epic {
      background: linear-gradient(135deg, #a78bfa, #8b5cf6);
      color: white;
    }

    .rarity-legendary {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      animation: glow 2s infinite;
    }

    @keyframes glow {
      0%, 100% { box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3); }
      50% { box-shadow: 0 2px 20px rgba(251, 191, 36, 0.8); }
    }

    @keyframes fadeInDown {
      from {
        opacity: 0;
        transform: translateY(-30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .store-header h1 {
        font-size: 2rem;
      }
      
      .rewards-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="hero__overlay" aria-hidden="true"></div>

  <a href="chats.php" class="btn-back">
    ← Volver al Chat
  </a>

  <div class="store-container">
    <div class="store-header">
      <h1>🏆 Tienda de Recompensas</h1>
      <p>Personaliza tu perfil con marcos y avatares exclusivos</p>
      <div class="gems-balance">
        <img src="assets/img/gema.png" alt="Gemas" />
        <span id="userGems">--</span>
        <span>Gemas</span>
      </div>

      <!-- Selector de recompensa activa -->
      <div class="active-reward-selector">
        <label class="selector-label">Marco Activo</label>
        <div class="selector-wrapper">
          <select id="activeRewardSelect" class="custom-select">
            <option value="">Sin marco (predeterminado)</option>
          </select>
          <span class="selector-icon">▼</span>
        </div>
        <button id="btnApplyReward" class="btn-apply">Aplicar Marco</button>
      </div>
    </div>

    <div class="rewards-grid">
      <!-- Recompensa 1: Marco Dorado -->
      <div class="reward-card" data-reward-id="1" data-price="150">
        <span class="rarity-badge rarity-common">Común</span>
        <div class="reward-icon">
          🖼️
        </div>
        <h3 class="reward-name">Marco Dorado</h3>
        <p class="reward-description">Marco circular dorado clásico alrededor de tu foto de perfil</p>
        <div class="reward-price">
          <img src="assets/img/gema.png" alt="Gemas" />
          <span>150</span>
        </div>
      </div>

      <!-- Recompensa 2: Marco Plateado -->
      <div class="reward-card" data-reward-id="2" data-price="300">
        <span class="rarity-badge rarity-rare">Raro</span>
        <div class="reward-icon">
          🔲
        </div>
        <h3 class="reward-name">Marco Plateado</h3>
        <p class="reward-description">Marco cuadrado plateado elegante con borde brillante para tu avatar</p>
        <div class="reward-price">
          <img src="assets/img/gema.png" alt="Gemas" />
          <span>300</span>
        </div>
      </div>

      <!-- Recompensa 3: Marco Arcoíris -->
      <div class="reward-card" data-reward-id="3" data-price="500">
        <span class="rarity-badge rarity-epic">Épico</span>
        <div class="reward-icon">
          🟨
        </div>
        <h3 class="reward-name">Marco Arcoíris</h3>
        <p class="reward-description">Marco cuadrado con gradiente arcoíris animado alrededor de tu foto</p>
        <div class="reward-price">
          <img src="assets/img/gema.png" alt="Gemas" />
          <span>500</span>
        </div>
      </div>

      <!-- Recompensa 4: Marco Neón -->
      <div class="reward-card" data-reward-id="4" data-price="750">
        <span class="rarity-badge rarity-epic">Épico</span>
        <div class="reward-icon">
          🟦
        </div>
        <h3 class="reward-name">Marco Neón</h3>
        <p class="reward-description">Marco cuadrado moderno con efecto neón azul para tu perfil</p>
        <div class="reward-price">
          <img src="assets/img/gema.png" alt="Gemas" />
          <span>750</span>
        </div>
      </div>

      <!-- Recompensa 5: Marco Diamante -->
      <div class="reward-card" data-reward-id="5" data-price="1000">
        <span class="rarity-badge rarity-legendary">Legendario</span>
        <div class="reward-icon">
          💎
        </div>
        <h3 class="reward-name">Marco Diamante</h3>
        <p class="reward-description">Marco exclusivo con cristales brillantes y efecto de lujo absoluto</p>
        <div class="reward-price">
          <img src="assets/img/gema.png" alt="Gemas" />
          <span>1000</span>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/gems-manager.js"></script>
  <script>
    let currentUser = null;
    let purchasedRewards = [];
    let activeRewardId = null;

    // Mapeo de IDs de recompensas a nombres
    const rewardNames = {
      1: '🖼️ Marco Dorado',
      2: '🔲 Marco Plateado',
      3: '🟨 Marco Arcoíris',
      4: '🟦 Marco Neón',
      5: '💎 Marco Diamante'
    };

    // Cargar gemas del usuario
    document.addEventListener('DOMContentLoaded', async () => {
      currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      if (!currentUser) {
        window.location.href = 'login.php';
        return;
      }

      // Inicializar gestor de gemas
      try {
        await gemsManager.initialize(currentUser.id);
        const balance = await gemsManager.getBalance();
        document.getElementById('userGems').textContent = balance;
      } catch (err) {
        console.error('Error al cargar gemas:', err);
        document.getElementById('userGems').textContent = '0';
      }

      // Cargar recompensas ya compradas
      await loadPurchasedRewards();

      // Cargar recompensa activa
      await loadActiveReward();

      // Event listener para aplicar recompensa
      document.getElementById('btnApplyReward').addEventListener('click', applyReward);

      // Event listeners para las tarjetas
      const rewardCards = document.querySelectorAll('.reward-card');
      
      rewardCards.forEach(card => {
        card.addEventListener('click', async () => {
          const rewardId = parseInt(card.dataset.rewardId);
          const price = parseInt(card.dataset.price);
          const name = card.querySelector('.reward-name').textContent;
          
          // Verificar si ya está comprada
          if (purchasedRewards.includes(rewardId)) {
            showNotification('Ya posees esta recompensa', 'info');
            return;
          }

          // Confirmar compra
          const confirm = window.confirm(`¿Deseas comprar "${name}" por ${price} gemas?`);
          if (!confirm) return;

          // Procesar compra
          await purchaseReward(rewardId, price, name, card);
        });
      });
    });

    // Cargar recompensas compradas
    async function loadPurchasedRewards() {
      try {
        const res = await fetch(`php/rewards.php?action=get_user_rewards&user_id=${currentUser.id}`);
        const data = await res.json();
        
        if (data.success) {
          purchasedRewards = data.data.map(r => r.reward_id);
          
          // Marcar tarjetas como compradas
          purchasedRewards.forEach(rewardId => {
            const card = document.querySelector(`.reward-card[data-reward-id="${rewardId}"]`);
            if (card) {
              card.classList.add('purchased');
            }
          });

          // Poblar selector con recompensas compradas
          populateRewardSelector();
        }
      } catch (err) {
        console.error('Error al cargar recompensas:', err);
      }
    }

    // Poblar selector de recompensas
    function populateRewardSelector() {
      const select = document.getElementById('activeRewardSelect');
      
      // Limpiar opciones existentes (excepto la primera)
      select.innerHTML = '<option value="">Sin marco (predeterminado)</option>';
      
      // Agregar recompensas compradas
      purchasedRewards.forEach(rewardId => {
        const option = document.createElement('option');
        option.value = rewardId;
        option.textContent = rewardNames[rewardId] || `Recompensa ${rewardId}`;
        select.appendChild(option);
      });
    }

    // Cargar recompensa activa
    async function loadActiveReward() {
      try {
        const res = await fetch(`php/rewards.php?action=get_active_reward&user_id=${currentUser.id}`);
        const data = await res.json();
        
        if (data.success) {
          activeRewardId = data.data.active_reward_id;
          const select = document.getElementById('activeRewardSelect');
          select.value = activeRewardId || '';
        }
      } catch (err) {
        console.error('Error al cargar recompensa activa:', err);
      }
    }

    // Aplicar recompensa seleccionada
    async function applyReward() {
      const select = document.getElementById('activeRewardSelect');
      const selectedValue = select.value;
      const rewardId = selectedValue === '' ? null : parseInt(selectedValue);

      try {
        const res = await fetch('php/rewards.php?action=set_active_reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            reward_id: rewardId
          })
        });

        const data = await res.json();
        
        if (data.success) {
          activeRewardId = rewardId;
          const message = rewardId 
            ? `Marco "${rewardNames[rewardId]}" activado 🎨`
            : 'Marco desactivado';
          showNotification(message, 'success');
        } else {
          showNotification(data.message, 'error');
        }
      } catch (err) {
        console.error('Error al aplicar recompensa:', err);
        showNotification('Error al aplicar el marco', 'error');
      }
    }

    // Comprar recompensa
    async function purchaseReward(rewardId, price, name, cardElement) {
      try {
        // Verificar saldo local
        const currentBalance = await gemsManager.getBalance();
        if (currentBalance < price) {
          showNotification('No tienes suficientes gemas', 'error');
          return;
        }

        const res = await fetch('php/rewards.php?action=purchase_reward', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            reward_id: rewardId,
            price: price,
            reward_name: name
          })
        });

        const data = await res.json();
        
        if (data.success) {
          // Actualizar balance
          document.getElementById('userGems').textContent = data.data.new_balance;
          gemsManager.currentBalance = data.data.new_balance;
          gemsManager.updateUI(data.data.new_balance);
          
          // Marcar como comprada
          purchasedRewards.push(rewardId);
          cardElement.classList.add('purchased');
          
          // Actualizar selector
          populateRewardSelector();
          
          showNotification('¡Recompensa comprada exitosamente! 🎉', 'success');
        } else {
          showNotification(data.message, 'error');
        }
      } catch (err) {
        console.error('Error al comprar recompensa:', err);
        showNotification('Error al procesar la compra', 'error');
      }
    }

    // Mostrar notificación
    function showNotification(message, type = 'info') {
      const colors = {
        success: '#22c55e',
        error: '#ef4444',
        info: '#3b82f6'
      };

      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
      `;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Agregar animaciones
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  </script>
</body>
</html>
