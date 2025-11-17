// simulador.js — Parte 1/5
document.addEventListener('DOMContentLoaded', () => {
  // ===== Refs UI =====
  const groupsGrid   = document.getElementById('groupsGrid');
  const btnGenerate  = document.getElementById('btnGenerate');
  const btnClear     = document.getElementById('btnClear');

  const btnToggleBet = document.getElementById('btnToggleBet');
  const betPanel     = document.getElementById('betPanel');
  const betClose     = document.getElementById('betClose');
  const betGroupSel  = document.getElementById('betGroup');
  const betTeamSel   = document.getElementById('betTeam');
  const betGemsInp   = document.getElementById('betGems');
  const betSubmitBtn = document.getElementById('betSubmit');

  const resultsCard  = document.getElementById('resultsCard');
  const resultsBody  = document.getElementById('resultsBody');
  const resultsHint  = document.getElementById('resultsHint');

  const simOverlay   = document.getElementById('simOverlay');

  // --- Bracket / llaves ---
  const bracketCard   = document.getElementById('bracketCard');
  const bracketGrid   = document.getElementById('bracketGrid');
  const btnBuildBrkt  = document.getElementById('btnBuildBracket');
  const btnSimBrkt    = document.getElementById('btnSimBracket');
  const championBox   = document.getElementById('championBox');
  const championName  = document.getElementById('championName');

  // --- Modal de Resultados ---
  const resultsModal = document.getElementById('resultsModal');
  const resultsModalClose = document.getElementById('resultsModalClose');
  const resultsModalTitle = document.getElementById('resultsModalTitle');
  const resultsBetTeam = document.getElementById('resultsBetTeam');
  const resultsElimination = document.getElementById('resultsElimination');
  const resultsBetAmount = document.getElementById('resultsBetAmount');
  const resultsMultiplier = document.getElementById('resultsMultiplier');
  const resultsReward = document.getElementById('resultsReward');
  const resultsNetGain = document.getElementById('resultsNetGain');
  const resultsNewBalance = document.getElementById('resultsNewBalance');

  // ===== Config =====
  const GROUPS = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)); // A..L
  const TEAMS_PER_GROUP = 4;

  // Equipos reales de la base de datos
  let baseTeams = [];

  // ===== Estado =====
  const state = {
    teamsByGroup: {},       // { A: [{ name, power_level }, ...], ... }
    teamsData: {},          // { 'Brasil': { name, power_level, fifa_code }, ... }
    qualifiers: {},         // Clasificados de fase de grupos (guardar para bracket)
    bet: null,              // { group, team, gems, betId }
    generated: false,
    bracket: { r32: [], r16: [], qf: [], sf: [], final: [], champion: null },
    currentSimulationId: null,
    betTeamEliminated: null // Ronda en la que fue eliminado el equipo apostado
  };

    // simulador.js — Parte 2/5

  // Render inicial: tarjetas de grupos vacías
  function renderEmptyGroups() {
    groupsGrid.innerHTML = '';
    GROUPS.forEach(letter => {
      const card = document.createElement('article');
      card.className = 'group-card';
      card.innerHTML = `
        <header class="group-head">
          <div class="group-title">Grupo ${letter}</div>
          <span class="group-badge">${TEAMS_PER_GROUP} equipos</span>
        </header>
        <table class="group-table">
          <thead><tr><th style="width:50px;">#</th><th>Equipo</th></tr></thead>
          <tbody>
            ${Array.from({ length: TEAMS_PER_GROUP }, (_, i) => `
              <tr><td>${i + 1}</td><td class="empty">—</td></tr>
            `).join('')}
          </tbody>
        </table>
      `;
      groupsGrid.appendChild(card);
    });

    state.generated = false;
    state.teamsByGroup = {};
    if (resultsCard) resultsCard.hidden = true;
    if (bracketCard) bracketCard.hidden = true;
    if (btnSimBrkt) btnSimBrkt.disabled = true;

    // reset apuestas
    fillBetGroups();
    if (betTeamSel) {
      betTeamSel.innerHTML = `<option value="">— Selecciona grupo primero —</option>`;
      betTeamSel.disabled = true;
    }
  }

  // Fisher–Yates shuffle
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Llenar grupos con nombres
  function fillGroupsWithTeams(teams) {
    if (teams.length < 48) {
      alert('Error: No hay suficientes equipos cargados');
      return;
    }
    
    const t = teams.slice(0, GROUPS.length * TEAMS_PER_GROUP); // 48
    const shuffled = shuffle(t);
    state.teamsByGroup = {};
    let idx = 0;

    const cards = groupsGrid.querySelectorAll('.group-card');
    cards.forEach((card, gIdx) => {
      const letter = GROUPS[gIdx];
      const rows   = card.querySelectorAll('tbody tr');
      state.teamsByGroup[letter] = [];

      rows.forEach(row => {
        const teamObj = shuffled[idx++];
        if (!teamObj) return;
        
        const cell = row.children[1];
        cell.classList.remove('empty');
        // Mostrar nombre y nivel de poder
        cell.innerHTML = `
          <span style="font-weight: 600;">${teamObj.name}</span>
          <span style="color: #fbbf24; font-size: 0.85rem; margin-left: 8px;">⚡${teamObj.power_level}</span>
        `;
        state.teamsByGroup[letter].push(teamObj);
      });
    });

    state.generated = true;
    fillBetGroups();
    if (betGroupSel && betGroupSel.value) populateBetTeams(betGroupSel.value);
  }

    // simulador.js — Parte 3/5

  // Apuestas: poblar selects
  function fillBetGroups() {
    if (!betGroupSel) return;
    betGroupSel.innerHTML = GROUPS.map(g => `<option value="${g}">${g}</option>`).join('');
  }
  function populateBetTeams(groupLetter) {
    if (!betTeamSel) return;
    const teams = state.teamsByGroup[groupLetter] || [];
    if (!teams.length) {
      betTeamSel.innerHTML = `<option value="">— Aún no hay equipos generados —</option>`;
      betTeamSel.disabled = true;
      return;
    }
    betTeamSel.innerHTML = teams.map(t => `<option value="${t.name}">${t.name} (⚡${t.power_level})</option>`).join('');
    betTeamSel.disabled = false;
  }

  // Clasificados (top-2 por grupo) - Ahora con simulación de partidos
  function getQualifiers() {
    const out = {};
    GROUPS.forEach(g => {
      const teams = state.teamsByGroup[g] || [];
      if (teams.length < 2) {
        out[g] = teams;
        return;
      }
      
      // Simular mini-torneo de grupo (todos contra todos)
      const standings = simulateGroupPhase(teams);
      
      // Guardar todos los equipos ordenados (para poder usar 3º lugar después)
      out[g] = standings;
    });
    
    // Guardar clasificados en el estado para usarlos en bracket
    state.qualifiers = out;
    return out;
  }

  // Simular fase de grupos (todos contra todos)
  function simulateGroupPhase(teams) {
    // Inicializar tabla de posiciones
    const standings = teams.map(team => ({
      ...team,
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      played: 0
    }));

    // Simular todos los partidos (cada equipo juega con todos)
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const result = simulateMatch(standings[i], standings[j]);
        
        standings[i].goalsFor += result.goalsA;
        standings[i].goalsAgainst += result.goalsB;
        standings[j].goalsFor += result.goalsB;
        standings[j].goalsAgainst += result.goalsA;
        
        standings[i].played++;
        standings[j].played++;
        
        if (result.goalsA > result.goalsB) {
          standings[i].points += 3; // Victoria
        } else if (result.goalsA < result.goalsB) {
          standings[j].points += 3; // Victoria
        } else {
          standings[i].points += 1; // Empate
          standings[j].points += 1;
        }
      }
    }

    // Calcular diferencia de goles
    standings.forEach(team => {
      team.goalDiff = team.goalsFor - team.goalsAgainst;
    });

    // Ordenar por: 1) Puntos, 2) Diferencia de goles, 3) Goles a favor
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });

    return standings;
  }

  // Simular un partido basado en nivel de poder + suerte
  function simulateMatch(teamA, teamB) {
    const powerA = teamA.power_level || 75;
    const powerB = teamB.power_level || 75;
    
    // Factor de suerte (0-20 puntos adicionales aleatorios)
    const luckA = Math.random() * 20;
    const luckB = Math.random() * 20;
    
    // Poder efectivo = poder base + suerte
    const effectivePowerA = powerA + luckA;
    const effectivePowerB = powerB + luckB;
    
    // Calcular probabilidad de victoria para cada equipo
    const totalPower = effectivePowerA + effectivePowerB;
    const probA = effectivePowerA / totalPower;
    
    // Determinar goles basados en poder y probabilidad
    let goalsA, goalsB;
    
    // El equipo más fuerte tiene más probabilidad de anotar más goles
    const rand = Math.random();
    
    if (rand < probA) {
      // TeamA gana o empata con ventaja
      goalsA = Math.floor(Math.random() * 3) + 1; // 1-3 goles
      goalsB = Math.floor(Math.random() * goalsA); // 0 a goalsA-1
    } else {
      // TeamB gana o empata con ventaja
      goalsB = Math.floor(Math.random() * 3) + 1; // 1-3 goles
      goalsA = Math.floor(Math.random() * goalsB); // 0 a goalsB-1
    }
    
    // Pequeña probabilidad de empate (10%)
    if (Math.random() < 0.1) {
      const tieGoals = Math.floor(Math.random() * 3); // 0-2
      goalsA = tieGoals;
      goalsB = tieGoals;
    }
    
    return { goalsA, goalsB };
  }

  // Pintar clasificados y habilitar sección de llaves
  async function renderResultsWithBet(qualifiers, bet) {
    if (!resultsBody) return;
    
    resultsBody.innerHTML = '';
    let betWon = false;
    let betPosition = -1;
    
    GROUPS.forEach(g => {
      const card = document.createElement('div');
      card.className = 'result-card';
      const q = qualifiers[g] || [];
      card.innerHTML = `
        <h4>Grupo ${g}</h4>
        <ol class="result-list">
          ${q.map((team, index) => {
            const teamName = typeof team === 'object' ? team.name : team;
            let cls = '';
            // Verificar si es el equipo apostado
            if (bet && bet.group === g && bet.team === teamName) {
              betPosition = index + 1; // 1, 2, 3 o 4
              
              // 1º y 2º clasifican directamente
              if (index < 2) {
                cls = 'win';
                betWon = true;
              } 
              // 3º lugar: aún no sabemos si clasifica (se decide al generar llaves)
              else if (index === 2) {
                cls = 'pending'; // Marcamos como pendiente
              } 
              // 4º lugar: no clasifica
              else {
                cls = 'lose';
              }
            }
            return `<li class="${cls}">${teamName}</li>`;
          }).join('')}
        </ol>
      `;
      resultsBody.appendChild(card);
    });

    // Mostrar resultado de clasificación
    if (bet) {
      console.log('🎲 Resultado de apuesta:', { team: bet.team, group: bet.group, position: betPosition, betWon, qualifiers: qualifiers[bet.group]?.map((t, i) => `${i+1}º ${typeof t === 'object' ? t.name : t}`) });
      
      if (betWon) {
        if (resultsHint) {
          resultsHint.textContent = `¡${bet.team} clasificó a la siguiente ronda! ✔`;
          resultsHint.style.color = '#10b981';
        }
      } else if (betPosition === 3) {
        // Tercer lugar: esperar a ver si está en los 8 mejores
        if (resultsHint) {
          resultsHint.textContent = `${bet.team} quedó 3º. Genera las llaves para ver si clasifica como mejor tercero.`;
          resultsHint.style.color = '#f59e0b'; // Naranja (pendiente)
        }
        state.betTeamEliminated = null; // Aún no se sabe
      } else if (betPosition === 4) {
        if (resultsHint) {
          resultsHint.textContent = `${bet.team} NO clasificó. Eliminado en fase de grupos.`;
          resultsHint.style.color = '#ef4444';
        }
        state.betTeamEliminated = 'groups';
      } else {
        // No encontrado o error
        if (resultsHint) resultsHint.textContent = '';
      }
    } else {
      if (resultsHint) resultsHint.textContent = '';
    }

    if (resultsCard) resultsCard.hidden = false;
    // mostrar tarjeta de llaves
    if (bracketCard) bracketCard.hidden = false;
    if (btnSimBrkt) btnSimBrkt.disabled = true; // hasta construir emparejamientos
  }

  // Pintar clasificados (versión sin apuesta)
  function renderResults(qualifiers, bet) {
    return renderResultsWithBet(qualifiers, bet);
  }

  // Overlay helpers
  function showOverlay() { if (simOverlay) simOverlay.hidden = false; }
  function hideOverlay() { if (simOverlay) simOverlay.hidden = true; }

    // simulador.js — Parte 4/5

  // Construir listado de 32 equipos:
  // 24 (top-2 por grupo) + 8 terceros aleatorios
  function buildTop32() {
    const top2 = [];
    const thirds = [];
    
    // Usar los clasificados ya calculados en lugar de simular de nuevo
    if (Object.keys(state.qualifiers).length === 0) {
      // Si no hay clasificados guardados, calcularlos
      getQualifiers();
    }
    
    GROUPS.forEach(g => {
      const standings = state.qualifiers[g] || [];
      if (standings.length >= 2) {
        top2.push(standings[0], standings[1]);      // Top 2
      }
      if (standings.length >= 3) {
        thirds.push(standings[2]); // Tercero lugar ya calculado
      }
    });
    
    const best8thirds = shuffle(thirds).slice(0, 8);
    state.best8thirds = best8thirds; // Guardar cuáles terceros clasificaron
    const top32 = shuffle(top2.concat(best8thirds)); // barajar para emparejar
    
    console.log('🥉 8 mejores terceros:', best8thirds.map(t => typeof t === 'object' ? t.name : t));
    console.log('👥 Top 32 equipos:', top32.map(t => typeof t === 'object' ? t.name : t));
    return top32;
  }

  // Emparejar 2 en 2
  function pairTeams(list){
    const pairs = [];
    for (let i = 0; i < list.length; i += 2) {
      pairs.push([ list[i] || { name: '—', power_level: 50 }, list[i+1] || { name: '—', power_level: 50 } ]);
    }
    return pairs;
  }

  // Simular ronda eliminatoria (ganador basado en poder, en caso de empate se simula penales)
  function simulateRound(pairs){
    return pairs.map(([teamA, teamB]) => {
      const result = simulateMatch(teamA, teamB);
      
      // Si hay empate en eliminatorias, simular penales (50/50 con leve ventaja al más fuerte)
      if (result.goalsA === result.goalsB) {
        const powerDiff = teamA.power_level - teamB.power_level;
        const penaltyProb = 0.5 + (powerDiff / 200); // Ventaja muy leve
        return Math.random() < penaltyProb ? teamA : teamB;
      }
      
      return result.goalsA > result.goalsB ? teamA : teamB;
    });
  }

  // Pintar una columna de ronda
  function renderRoundColumn(title, pairs, winners = []){
    if (!bracketGrid) return;
    
    const col = document.createElement('div');
    col.className = 'round-col';
    col.innerHTML = `<h4>${title}</h4>`;
    pairs.forEach((p, idx) => {
      const [teamA, teamB] = p;
      const w = winners[idx];
      
      const nameA = typeof teamA === 'object' ? teamA.name : teamA;
      const nameB = typeof teamB === 'object' ? teamB.name : teamB;
      const winnerName = typeof w === 'object' ? w.name : w;
      
      // Resaltar equipo apostado
      const betTeamName = state.bet ? state.bet.team : null;
      const isABetTeam = betTeamName === nameA;
      const isBBetTeam = betTeamName === nameB;
      
      const m = document.createElement('div');
      m.className = 'match';
      m.innerHTML = `
        <div class="team ${winnerName === nameA ? 'winner' : (winnerName ? 'loser' : '')} ${isABetTeam ? 'bet-team' : ''}">${nameA}</div>
        <div class="team ${winnerName === nameB ? 'winner' : (winnerName ? 'loser' : '')} ${isBBetTeam ? 'bet-team' : ''}">${nameB}</div>
      `;
      col.appendChild(m);
    });
    bracketGrid.appendChild(col);
  }

  // Construir llaves (solo emparejamientos R32)
  function buildBracket() {
    const teams32 = buildTop32();
    state.bracket.r32 = pairTeams(teams32);
    state.bracket.r16 = [];
    state.bracket.qf  = [];
    state.bracket.sf  = [];
    state.bracket.final = [];
    state.bracket.champion = null;

    if (bracketGrid) bracketGrid.innerHTML = '';
    renderRoundColumn('Ronda de 32', state.bracket.r32);
    renderRoundColumn('Octavos', []);
    renderRoundColumn('Cuartos', []);
    renderRoundColumn('Semifinales', []);
    renderRoundColumn('Final', []);
    renderRoundColumn('Campeón', []);
    if (btnSimBrkt) btnSimBrkt.disabled = false;
    if (championBox) championBox.hidden = true;
  }

  // Simular todas las rondas y pintar
  function simulateBracket() {
    const r16winners  = simulateRound(state.bracket.r32);
    state.bracket.r16 = pairTeams(r16winners);

    const qfwinners   = simulateRound(state.bracket.r16);
    state.bracket.qf  = pairTeams(qfwinners);

    const sfwinners   = simulateRound(state.bracket.qf);
    state.bracket.sf  = pairTeams(sfwinners);

    const finalWins   = simulateRound(state.bracket.sf);
    state.bracket.final = pairTeams(finalWins);

    const champArr    = simulateRound(state.bracket.final);
    state.bracket.champion = champArr[0];

    // Verificar en qué ronda fue eliminado el equipo apostado
    if (state.bet && state.bet.team) {
      checkBetTeamElimination(r16winners, qfwinners, sfwinners, finalWins, champArr);
    }

    // re-render completo con winners marcados
    if (bracketGrid) bracketGrid.innerHTML = '';
    renderRoundColumn('Ronda de 32', state.bracket.r32, r16winners);
    renderRoundColumn('Octavos',     state.bracket.r16, qfwinners);
    renderRoundColumn('Cuartos',     state.bracket.qf,  sfwinners);
    renderRoundColumn('Semifinales', state.bracket.sf,  finalWins);
    renderRoundColumn('Final',       state.bracket.final, champArr);

    if (bracketGrid) {
      const champCol = document.createElement('div');
      champCol.className = 'round-col';
      const championNameText = typeof state.bracket.champion === 'object' ? state.bracket.champion.name : state.bracket.champion;
      champCol.innerHTML = `<h4>Campeón</h4>
        <div class="match"><div class="team winner">${championNameText}</div></div>`;
      bracketGrid.appendChild(champCol);
    }

    if (championName) championName.textContent = typeof state.bracket.champion === 'object' ? state.bracket.champion.name : state.bracket.champion;
    if (championBox) championBox.hidden = false;

    // Calcular y otorgar recompensas (con await para asegurar que se complete)
    if (state.bet && state.bet.team) {
      console.log('🎯 Iniciando cálculo de recompensas...');
      calculateAndAwardRewards().then(() => {
        console.log('✅ Recompensas procesadas');
      }).catch(err => {
        console.error('❌ Error al procesar recompensas:', err);
      });
    }
  }

  // Verificar en qué ronda fue eliminado el equipo apostado
  function checkBetTeamElimination(r16winners, qfwinners, sfwinners, finalWinners, champion) {
    const betTeamName = state.bet.team;
    
    // Si ya fue eliminado en fase de grupos, no verificar más
    if (state.betTeamEliminated === 'groups') {
      console.log('🚫 Equipo ya eliminado en fase de grupos');
      return;
    }
    
    // Verificar si clasificó a R32 (revisar en los equipos de R32)
    const r32Teams = state.bracket.r32 ? state.bracket.r32.flat() : [];
    const qualifiedToR32 = r32Teams.some(t => 
      (typeof t === 'object' ? t.name : t) === betTeamName
    );
    
    console.log('🔍 Verificando clasificación a R32:', { betTeamName, qualifiedToR32, r32Teams: r32Teams.map(t => typeof t === 'object' ? t.name : t) });
    
    if (!qualifiedToR32) {
      state.betTeamEliminated = 'groups';
      console.log('❌ No clasificó a R32, eliminado en grupos');
      return;
    }
    
    // Verificar R16 (dieciseisavos)
    const inR16 = r16winners.some(t => (typeof t === 'object' ? t.name : t) === betTeamName);
    if (!inR16) {
      state.betTeamEliminated = 'r32';
      return;
    }
    
    // Verificar QF (octavos)
    const inQF = qfwinners.some(t => (typeof t === 'object' ? t.name : t) === betTeamName);
    if (!inQF) {
      state.betTeamEliminated = 'r16';
      return;
    }
    
    // Verificar SF (cuartos)
    const inSF = sfwinners.some(t => (typeof t === 'object' ? t.name : t) === betTeamName);
    if (!inSF) {
      state.betTeamEliminated = 'qf';
      return;
    }
    
    // Verificar Final (semifinales)
    const inFinal = finalWinners.some(t => (typeof t === 'object' ? t.name : t) === betTeamName);
    if (!inFinal) {
      state.betTeamEliminated = 'sf';
      return;
    }
    
    // Verificar Campeón
    const championName = typeof champion[0] === 'object' ? champion[0].name : champion[0];
    if (championName === betTeamName) {
      state.betTeamEliminated = 'champion';
      console.log('🏆 ¡Campeón!');
    } else {
      state.betTeamEliminated = 'final';
      console.log('🥈 Subcampeón');
    }
    
    console.log('📍 Etapa final de eliminación:', state.betTeamEliminated);
  }

  // Calcular recompensas según el rendimiento del equipo
  function calculateRewardMultiplier() {
    const elimination = state.betTeamEliminated;
    
    switch(elimination) {
      case 'groups':
        return 0; // Pierde todo
      case 'r32':
        return 0.5; // 50% - Eliminado en dieciseisavos
      case 'r16':
        return 1.0; // 100% - Eliminado en octavos (recupera apuesta)
      case 'qf':
        return 1.5; // 150% - Eliminado en cuartos
      case 'sf':
        return 2.0; // 200% - Eliminado en semifinales
      case 'final':
        return 2.5; // 250% - Subcampeón
      case 'champion':
        return 3.0; // 300% - Campeón
      default:
        return 0;
    }
  }

  // Otorgar recompensa final
  async function awardFinalReward() {
    console.log('💰 Iniciando awardFinalReward...', { bet: state.bet, elimination: state.betTeamEliminated });
    
    if (!state.bet || !state.bet.gems) {
      console.warn('⚠️ No hay apuesta activa');
      return;
    }

    const multiplier = calculateRewardMultiplier();
    const betAmount = state.bet.gems;
    const reward = Math.floor(betAmount * multiplier);
    // La apuesta ya fue descontada al apostar, solo sumamos la recompensa
    const amountToAdd = reward; // Esto será 0 si pierde, betAmount si recupera, más si gana
    const netGain = reward - betAmount; // Para mostrar al usuario (ganancia/pérdida real)

    console.log('📊 Cálculos:', { multiplier, betAmount, reward, amountToAdd, netGain });

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      console.error('❌ No hay usuario en localStorage');
      return;
    }

    try {
      console.log('🌐 Enviando petición a gems.php...');
      // Actualizar gemas en la base de datos (sumar la recompensa)
      const res = await fetch('php/gems.php?action=add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          amount: amountToAdd,
          transaction_type: 'tournament_reward',
          description: `Apuesta por ${state.bet.team} - Eliminado en ${getEliminationStageName()}`
        })
      });

      console.log('📡 Respuesta recibida:', res.status);
      const data = await res.json();
      console.log('📦 Data:', data);
      
      if (data.success) {
        // Actualizar localStorage
        currentUser.gems = data.data.new_balance;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Actualizar UI
        const gemsDisplay = document.querySelectorAll('[data-gems-display]');
        gemsDisplay.forEach(el => el.textContent = currentUser.gems);

        console.log('✨ Mostrando modal de resultados...');
        // Mostrar modal de resultados
        showResultsModal(multiplier, betAmount, reward, netGain, data.data.new_balance);
      } else {
        console.error('❌ Error en la respuesta:', data.message);
        alert('Error al procesar recompensa: ' + (data.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error al otorgar recompensa:', error);
      alert('Error de conexión al procesar recompensa');
    }
  }

  // Mostrar modal de resultados
  function showResultsModal(multiplier, betAmount, reward, netGain, newBalance) {
    console.log('📊 Mostrando resultados:', { multiplier, betAmount, reward, netGain, newBalance, stage: state.betTeamEliminated });
    console.log('🔍 Verificando elementos del modal:', { 
      resultsModal: !!resultsModal, 
      resultsModalTitle: !!resultsModalTitle,
      resultsBetTeam: !!resultsBetTeam,
      resultsElimination: !!resultsElimination
    });
    
    if (!resultsModal) {
      console.error('❌ resultsModal no encontrado en el DOM');
      return;
    }

    const percentage = Math.floor(multiplier * 100);
    const stageName = getEliminationStageName();
    const isWin = netGain > 0;
    const isBreakEven = netGain === 0;
    
    // Título del modal
    if (resultsModalTitle) {
      if (state.betTeamEliminated === 'champion') {
        resultsModalTitle.textContent = '🏆 ¡CAMPEÓN! ¡Felicidades!';
      } else if (isWin) {
        resultsModalTitle.textContent = '✅ ¡Ganaste!';
      } else if (isBreakEven) {
        resultsModalTitle.textContent = '➡️ Recuperaste tu apuesta';
      } else {
        resultsModalTitle.textContent = '❌ Apuesta perdida';
      }
    }

    // Información del equipo
    if (resultsBetTeam) resultsBetTeam.textContent = state.bet.team;
    if (resultsElimination) resultsElimination.textContent = `Eliminado en: ${stageName}`;

    // Estadísticas
    if (resultsBetAmount) resultsBetAmount.textContent = `${betAmount} 💎`;
    if (resultsMultiplier) resultsMultiplier.textContent = `${percentage}%`;
    if (resultsReward) resultsReward.textContent = `${reward} 💎`;
    
    if (resultsNetGain) {
      if (netGain > 0) {
        resultsNetGain.textContent = `+${netGain} 💎`;
        resultsNetGain.className = 'stat-value positive';
        resultsNetGain.parentElement.classList.add('final');
        resultsNetGain.parentElement.classList.remove('loss');
      } else if (netGain < 0) {
        resultsNetGain.textContent = `${netGain} 💎`;
        resultsNetGain.className = 'stat-value negative';
        resultsNetGain.parentElement.classList.add('loss');
        resultsNetGain.parentElement.classList.remove('final');
      } else {
        resultsNetGain.textContent = `0 💎`;
        resultsNetGain.className = 'stat-value';
      }
    }

    if (resultsNewBalance) resultsNewBalance.textContent = newBalance;

    // Mostrar modal
    resultsModal.hidden = false;
  }

  // Cerrar modal
  if (resultsModalClose) {
    resultsModalClose.addEventListener('click', () => {
      if (resultsModal) resultsModal.hidden = true;
    });
  }

  // Obtener nombre de la etapa de eliminación
  function getEliminationStageName() {
    const stages = {
      'groups': 'Fase de Grupos',
      'r32': 'Dieciseisavos de Final',
      'r16': 'Octavos de Final',
      'qf': 'Cuartos de Final',
      'sf': 'Semifinales',
      'final': 'Final (Subcampeón)',
      'champion': 'Campeón'
    };
    return stages[state.betTeamEliminated] || 'Desconocido';
  }

  // Mostrar notificación de recompensa
  // Llamar a calculateAndAwardRewards al final de la simulación
  async function calculateAndAwardRewards() {
    await awardFinalReward();
  }

    // simulador.js — Parte 5/5

  // Botones principales
  if (btnGenerate) {
    btnGenerate.addEventListener('click', () => {
      if (baseTeams.length === 0) {
        alert('Cargando equipos... Por favor espera un momento y vuelve a intentar.');
        return;
      }
      fillGroupsWithTeams(baseTeams);
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      renderEmptyGroups();
    });
  }

  // Apuestas: abrir/cerrar + selects
  if (btnToggleBet) {
    btnToggleBet.addEventListener('click', () => { 
      if (betPanel) betPanel.hidden = false; 
    });
  }
  
  if (betClose) {
    betClose.addEventListener('click', () => { 
      if (betPanel) betPanel.hidden = true; 
    });
  }

  if (betGroupSel) {
    betGroupSel.addEventListener('change', (e) => {
      populateBetTeams(e.target.value);
    });
  }

  betSubmitBtn.addEventListener('click', async () => {
    if (!state.generated) {
      alert('Primero genera el torneo (fase de grupos).');
      return;
    }
    const group = betGroupSel.value;
    const team  = betTeamSel.value;
    const gems  = parseInt(betGemsInp.value, 10);

    if (!group) return alert('Selecciona un grupo.');
    if (!team)  return alert('Selecciona un equipo.');
    if (!(gems > 0)) return alert('Ingresa la cantidad de gemas.');

    // Verificar que el usuario tenga gemas suficientes
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      alert('Debes iniciar sesión para apostar.');
      return;
    }

    if (currentUser.gems < gems) {
      alert(`No tienes suficientes gemas. Tienes: ${currentUser.gems} 💎`);
      return;
    }

    try {
      // Descontar gemas inmediatamente
      const res = await fetch('php/gems.php?action=subtract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          amount: gems,
          transaction_type: 'tournament_bet',
          description: `Apuesta por ${team} (Grupo ${group})`
        })
      });

      const data = await res.json();
      if (!data.success) {
        alert('Error al procesar apuesta: ' + data.message);
        return;
      }

      // Actualizar balance local
      currentUser.gems = data.data.new_balance;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      // Actualizar UI
      const gemsDisplay = document.querySelectorAll('[data-gems-display]');
      gemsDisplay.forEach(el => el.textContent = currentUser.gems);

      state.bet = { group, team, gems };
      localStorage.setItem('sim_last_bet', JSON.stringify(state.bet));

      betPanel.hidden = true;
      showOverlay();
      setTimeout(async () => {
        hideOverlay();
        const qualifiers = getQualifiers();
        await renderResultsWithBet(qualifiers, state.bet);
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 900);

    } catch (error) {
      alert('Error de conexión: ' + error.message);
    }
  });

  // Bracket
  if (btnBuildBrkt) {
    btnBuildBrkt.addEventListener('click', () => {
      if (!state.generated) return alert('Primero genera la fase de grupos.');
      buildBracket();
    });
  }

  if (btnSimBrkt) {
    btnSimBrkt.addEventListener('click', () => {
      showOverlay();
      setTimeout(() => {
        hideOverlay();
        simulateBracket();
        if (bracketCard) bracketCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 700);
    });
  }

  // Restaurar última apuesta (solo gems por conveniencia)
  try {
    const last = JSON.parse(localStorage.getItem('sim_last_bet') || 'null');
    if (last) { state.bet = last; betGemsInp.value = last.gems || ''; }
  } catch {}

  // Cargar equipos desde la base de datos
  async function loadTeamsFromDatabase() {
    try {
      const res = await fetch('php/teams.php?action=get_all');
      const data = await res.json();
      
      if (data.success && data.data.length >= 48) {
        baseTeams = data.data.slice(0, 48); // Asegurar 48 equipos
        // Crear índice para búsqueda rápida
        baseTeams.forEach(team => {
          state.teamsData[team.name] = team;
        });
        console.log('✓ Equipos cargados desde la base de datos:', baseTeams.length);
      } else {
        console.error('Error: Se necesitan al menos 48 equipos en la base de datos');
        alert('Error: Primero debes ejecutar la migración teams_migration.sql en la base de datos');
      }
    } catch (error) {
      console.error('Error al cargar equipos:', error);
      alert('Error al conectar con la base de datos. Verifica que XAMPP esté activo.');
    }
  }

  // Inicializar: cargar equipos y renderizar
  async function initialize() {
    await loadTeamsFromDatabase();
    renderEmptyGroups();
  }

  // Ejecutar inicialización
  initialize();
}); // <-- DOMContentLoaded
