<?php // Puedes agregar lógica PHP aquí si lo necesitas en el futuro ?>
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CopaLink — Simulador</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/landing.css" />
  <link rel="stylesheet" href="css/chats.css" />
  <link rel="stylesheet" href="css/simulador.css" />
  <link rel="stylesheet" href="css/gems.css" />
</head>
<body>
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="hero__overlay" aria-hidden="true"></div>
  <header class="topbar">
    <a class="brand btn-reset" href="chats.php" title="Volver a chats">CopaLink</a>
    <div class="topbar-actions">
      <div class="gems-balance-display" style="margin-right: 15px; display: flex; align-items: center; gap: 8px;">
        <img class="gem-icon" src="assets/img/gema.png" alt="Gemas" />
        <span class="gem-count" data-gems-display>0</span>
      </div>
      <a href="simulador.php" class="btn-simulador">Simulador</a>
    </div>
  </header>
  <main class="sim-wrap">
    <section class="sim-hero card glass">
      <h1 class="sim-title">Simulador del torneo</h1>
      <p class="sim-sub">
        Genera la fase de grupos. Luego apuesta por un equipo y simulamos clasificación (top 2 por grupo).
      </p>
      <div class="d-flex gap-2 flex-wrap">
        <button id="btnGenerate" class="btn btn-success fw-bold px-4">Generar torneo</button>
        <button id="btnClear" class="btn btn-outline-light fw-bold px-4">Limpiar</button>
        <button id="btnToggleBet" class="btn btn-primary fw-bold px-4">Apuestas</button>
      </div>
    </section>
    <section id="groupsGrid" class="groups-grid"><!-- relleno por JS --></section>
    
    <!-- Panel de Apuestas -->
    <aside id="betPanel" class="bet-panel card glass" hidden>
      <header class="bet-head">
        <h3>Realizar Apuesta</h3>
        <button id="betClose" class="sp-close" title="Cerrar">✕</button>
      </header>
      <div class="bet-body">
        <div class="mb-3">
          <label class="form-label">Grupo</label>
          <select id="betGroup" class="form-select">
            <option value="">Selecciona un grupo</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Equipo</label>
          <select id="betTeam" class="form-select" disabled>
            <option value="">Selecciona grupo primero</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Gemas a apostar</label>
          <input type="number" id="betGems" class="form-control" min="1" placeholder="Cantidad de gemas">
        </div>
        <button id="betSubmit" class="btn btn-primary w-100">Apostar</button>
      </div>
    </aside>

    <!-- Overlay de simulación -->
    <div id="simOverlay" class="sim-overlay" hidden>
      <div class="sim-spinner"></div>
      <p>Simulando torneo...</p>
    </div>

    <section id="resultsCard" class="results card glass" hidden>
      <header class="results-head">
        <h3 class="results-title">Clasificados (Top 2 por grupo)</h3>
        <small id="resultsHint" class="muted"></small>
      </header>
      <div id="resultsBody" class="results-body"><!-- relleno por JS --></div>
    </section>
    <section id="bracketCard" class="bracket card glass" hidden>
      <header class="bracket-head">
        <h3 class="bracket-title">Fase eliminatoria</h3>
        <div class="d-flex gap-2 flex-wrap">
          <button id="btnBuildBracket" class="btn btn-success">Generar llaves</button>
          <button id="btnSimBracket" class="btn btn-primary" disabled>Simular llaves</button>
        </div>
      </header>
      <div id="bracketGrid" class="bracket-grid"><!-- relleno por JS --></div>
      <div id="championBox" class="champion-box" hidden>
        <h2>🏆 Campeón</h2>
        <h3 id="championName"></h3>
      </div>
    </section>

    <!-- Modal de Resultados Finales -->
    <div id="resultsModal" class="results-modal" hidden>
      <div class="results-modal-content">
        <div class="results-modal-header">
          <h2 id="resultsModalTitle">🏆 Resultado de tu Apuesta</h2>
        </div>
        <div class="results-modal-body">
          <div class="results-team-info">
            <h3 id="resultsBetTeam"></h3>
            <p id="resultsElimination"></p>
          </div>
          <div class="results-stats">
            <div class="stat-item">
              <span class="stat-label">Apuesta</span>
              <span class="stat-value" id="resultsBetAmount"></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Multiplicador</span>
              <span class="stat-value" id="resultsMultiplier"></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Recompensa</span>
              <span class="stat-value" id="resultsReward"></span>
            </div>
            <div class="stat-item final">
              <span class="stat-label">Ganancia/Pérdida</span>
              <span class="stat-value" id="resultsNetGain"></span>
            </div>
          </div>
          <div class="results-balance">
            <p>Nuevo balance: <strong id="resultsNewBalance"></strong> 💎</p>
          </div>
        </div>
        <div class="results-modal-footer">
          <button id="resultsModalClose" class="btn btn-primary">Cerrar</button>
        </div>
      </div>
    </div>

  </main>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <!-- Inicializar sistema de gemas y validación de sesión -->
  <script>
    // Verificar autenticación desde localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
      // Redirigir a login si no está autenticado
      window.location.href = 'login.php';
    } else {
      // Usuario autenticado, actualizar UI con sus gemas
      const gemsDisplay = document.querySelector('[data-gems-display]');
      if (gemsDisplay && currentUser.gems !== undefined) {
        gemsDisplay.textContent = currentUser.gems;
      }
      console.log('Usuario autenticado:', currentUser.username, 'Gemas:', currentUser.gems);
    }
  </script>
  <script src="js/simulador.js"></script>
</body>
</html>
