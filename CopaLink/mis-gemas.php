<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Gemas - CopaLink</title>
    <link rel="stylesheet" href="css/gems.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
        }

        .balance-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .balance-label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 8px;
        }

        .balance-amount {
            font-size: 36px;
            font-weight: bold;
        }

        .card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .card-title {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1f2937;
        }

        .tabs {
            display: flex;
            gap: 16px;
            margin-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }

        .tab {
            padding: 12px 24px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            color: #6b7280;
            transition: all 0.3s;
            position: relative;
        }

        .tab.active {
            color: #667eea;
        }

        .tab.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            right: 0;
            height: 2px;
            background: #667eea;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }

        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-secondary {
            background: #f3f4f6;
            color: #374151;
        }

        .btn-secondary:hover {
            background: #e5e7eb;
        }

        @media (max-width: 768px) {
            .header-content {
                flex-direction: column;
                align-items: stretch;
            }

            .balance-card {
                width: 100%;
            }

            .action-buttons {
                flex-direction: column;
            }

            .btn {
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header con balance -->
        <div class="header">
            <div class="header-content">
                <div>
                    <h1 style="color: #1f2937; margin-bottom: 8px;">Mis Gemas 💎</h1>
                    <p style="color: #6b7280;">Administra tus gemas y revisa tu historial</p>
                </div>
                <div class="balance-card">
                    <div class="balance-label">Balance actual</div>
                    <div class="balance-amount" data-gems-display>0</div>
                </div>
            </div>
        </div>

        <!-- Acciones rápidas -->
        <div class="card">
            <h2 class="card-title">Acciones rápidas</h2>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="window.location.href='simulador.php'">
                    ⚽ Ir al Simulador
                </button>
                <button class="btn btn-primary" onclick="window.location.href='chats.php'">
                    💬 Ver Tareas
                </button>
                <button class="btn btn-secondary" id="btnTransfer">
                    📤 Transferir Gemas
                </button>
                <button class="btn btn-secondary" onclick="window.location.href='index.php'">
                    🏠 Volver al Inicio
                </button>
            </div>
        </div>

        <!-- Tabs -->
        <div class="card">
            <div class="tabs">
                <button class="tab active" data-tab="transactions">Transacciones</button>
                <button class="tab" data-tab="bets">Apuestas</button>
                <button class="tab" data-tab="rewards">Recompensas</button>
            </div>

            <!-- Contenido: Transacciones -->
            <div class="tab-content active" id="transactions">
                <div id="transactionsList">
                    <div class="empty-state">
                        <div class="empty-state-icon">📊</div>
                        <p>Cargando transacciones...</p>
                    </div>
                </div>
            </div>

            <!-- Contenido: Apuestas -->
            <div class="tab-content" id="bets">
                <div id="betsList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🎲</div>
                        <p>Cargando apuestas...</p>
                    </div>
                </div>
            </div>

            <!-- Contenido: Recompensas -->
            <div class="tab-content" id="rewards">
                <div id="rewardsList">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏆</div>
                        <p>Las recompensas por logros estarán disponibles próximamente</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="js/firebase-config.js"></script>
    <script src="js/gems-manager.js"></script>
    <script>
        // Tabs functionality
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                
                // Remover active de todos los tabs
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                // Activar el tab seleccionado
                tab.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });

        // Cargar datos al iniciar
        document.addEventListener('DOMContentLoaded', async () => {
            // Verificar autenticación con Firebase
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!user) {
                    window.location.href = 'login.php';
                    return;
                }

                // Obtener el user_id de MySQL (deberías tenerlo almacenado o hacer una conversión)
                // Por ahora, usaremos el UID de Firebase como ejemplo
                const userId = 1; // Reemplazar con el ID real del usuario de MySQL

                try {
                    // Inicializar gems manager
                    await gemsManager.initialize(userId);

                    // Cargar transacciones
                    await loadTransactions();

                    // Cargar apuestas
                    await loadBets();

                } catch (error) {
                    console.error('Error al cargar datos:', error);
                }
            });
        });

        async function loadTransactions() {
            const container = document.getElementById('transactionsList');
            
            try {
                const transactions = await gemsManager.getTransactions(50);
                
                if (transactions.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">📊</div>
                            <p>No tienes transacciones aún</p>
                        </div>
                    `;
                    return;
                }

                container.innerHTML = '';
                transactions.forEach(trans => {
                    const isPositive = trans.amount > 0;
                    const div = document.createElement('div');
                    div.className = 'gems-transaction';
                    div.innerHTML = `
                        <div class="gems-transaction-info">
                            <div class="gems-transaction-type">${formatTransactionType(trans.transaction_type)}</div>
                            <div class="gems-transaction-desc">${trans.description}</div>
                            <div class="gems-transaction-date">${new Date(trans.created_at).toLocaleString('es-ES')}</div>
                        </div>
                        <div class="gems-transaction-amount ${isPositive ? 'positive' : 'negative'}">
                            ${isPositive ? '+' : ''}${trans.amount} 💎
                        </div>
                    `;
                    container.appendChild(div);
                });

            } catch (error) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <p>Error al cargar transacciones: ${error.message}</p>
                    </div>
                `;
            }
        }

        async function loadBets() {
            const container = document.getElementById('betsList');
            
            try {
                const bets = await gemsManager.getUserBets();
                
                if (bets.length === 0) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <div class="empty-state-icon">🎲</div>
                            <p>No has realizado apuestas aún</p>
                            <button class="btn btn-primary" onclick="window.location.href='simulador.php'" style="margin-top: 16px;">
                                Ir al Simulador
                            </button>
                        </div>
                    `;
                    return;
                }

                const table = document.createElement('table');
                table.className = 'bets-table';
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Grupo</th>
                            <th>Equipo</th>
                            <th>Gemas</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bets.map(bet => `
                            <tr>
                                <td>${new Date(bet.created_at).toLocaleDateString('es-ES')}</td>
                                <td>Grupo ${bet.bet_group}</td>
                                <td>${bet.bet_team}</td>
                                <td>${bet.gems_amount} 💎</td>
                                <td><span class="bet-status ${bet.status}">${formatBetStatus(bet.status)}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                `;
                
                container.innerHTML = '';
                container.appendChild(table);

            } catch (error) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">❌</div>
                        <p>Error al cargar apuestas: ${error.message}</p>
                    </div>
                `;
            }
        }

        function formatTransactionType(type) {
            const types = {
                'earn': '✅ Ganancia',
                'spend': '💸 Gasto',
                'bet_win': '🎉 Apuesta Ganada',
                'bet_loss': '😢 Apuesta Perdida',
                'task_reward': '🏆 Recompensa por Tarea',
                'transfer_send': '📤 Transferencia Enviada',
                'transfer_receive': '📥 Transferencia Recibida'
            };
            return types[type] || type;
        }

        function formatBetStatus(status) {
            const statuses = {
                'pending': 'Pendiente',
                'won': 'Ganada',
                'lost': 'Perdida'
            };
            return statuses[status] || status;
        }

        // Transferir gemas (simplificado)
        document.getElementById('btnTransfer').addEventListener('click', () => {
            const toUserId = prompt('Ingresa el ID del usuario destinatario:');
            if (!toUserId) return;

            const amount = parseInt(prompt('¿Cuántas gemas deseas transferir?'));
            if (!amount || amount <= 0) {
                alert('Cantidad inválida');
                return;
            }

            const description = prompt('Descripción (opcional):') || 'Transferencia de gemas';

            gemsManager.transferGems(parseInt(toUserId), amount, description)
                .then(() => {
                    alert('Transferencia exitosa');
                    loadTransactions();
                })
                .catch(error => {
                    alert('Error: ' + error.message);
                });
        });
    </script>
</body>
</html>
