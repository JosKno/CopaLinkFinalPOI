// gems-manager.js - Sistema de gestión de gemas
class GemsManager {
    constructor() {
        this.baseURL = 'php/gems.php';
        this.currentUserId = null;
        this.currentBalance = 0;
    }

    /**
     * Inicializar el gestor de gemas con el ID del usuario
     */
    async initialize(userId) {
        this.currentUserId = userId;
        await this.updateBalance();
    }

    /**
     * Obtener el balance actual del usuario
     */
    async getBalance(userId = null) {
        const id = userId || this.currentUserId;
        if (!id) throw new Error('User ID no especificado');

        try {
            const response = await fetch(`${this.baseURL}?action=get_balance&user_id=${id}`);
            const data = await response.json();
            
            if (data.success) {
                this.currentBalance = data.data.gems;
                return data.data.gems;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al obtener balance:', error);
            throw error;
        }
    }

    /**
     * Actualizar el balance y la UI
     */
    async updateBalance() {
        try {
            const balance = await this.getBalance();
            this.updateUI(balance);
            return balance;
        } catch (error) {
            console.error('Error al actualizar balance:', error);
            return this.currentBalance;
        }
    }

    /**
     * Actualizar elementos de UI con el balance
     */
    updateUI(balance) {
        // Actualizar todos los elementos que muestran las gemas
        const gemsElements = document.querySelectorAll('[data-gems-display]');
        gemsElements.forEach(el => {
            el.textContent = balance;
        });

        // Actualizar inputs específicos
        const gemsInput = document.getElementById('betGems');
        if (gemsInput && gemsInput.max) {
            gemsInput.max = balance;
        }
    }

    /**
     * Crear una apuesta
     */
    async createBet(betGroup, betTeam, gemsAmount, simulationId = null) {
        if (!this.currentUserId) throw new Error('Usuario no inicializado');
        if (gemsAmount > this.currentBalance) {
            throw new Error('Gemas insuficientes');
        }

        try {
            const response = await fetch(`${this.baseURL}?action=create_bet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    bet_group: betGroup,
                    bet_team: betTeam,
                    gems_amount: gemsAmount,
                    simulation_id: simulationId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentBalance = data.data.new_balance;
                this.updateUI(this.currentBalance);
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al crear apuesta:', error);
            throw error;
        }
    }

    /**
     * Resolver una apuesta
     */
    async resolveBet(betId, won) {
        try {
            const response = await fetch(`${this.baseURL}?action=resolve_bet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bet_id: betId,
                    won: won
                })
            });

            const data = await response.json();
            
            if (data.success) {
                await this.updateBalance();
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al resolver apuesta:', error);
            throw error;
        }
    }

    /**
     * Obtener apuestas del usuario
     */
    async getUserBets(status = null) {
        if (!this.currentUserId) throw new Error('Usuario no inicializado');

        try {
            let url = `${this.baseURL}?action=get_user_bets&user_id=${this.currentUserId}`;
            if (status) url += `&status=${status}`;

            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al obtener apuestas:', error);
            throw error;
        }
    }

    /**
     * Obtener historial de transacciones
     */
    async getTransactions(limit = 50) {
        if (!this.currentUserId) throw new Error('Usuario no inicializado');

        try {
            const response = await fetch(`${this.baseURL}?action=get_transactions&user_id=${this.currentUserId}&limit=${limit}`);
            const data = await response.json();
            
            if (data.success) {
                return data.data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al obtener transacciones:', error);
            throw error;
        }
    }

    /**
     * Transferir gemas a otro usuario
     */
    async transferGems(toUserId, amount, description = '') {
        if (!this.currentUserId) throw new Error('Usuario no inicializado');
        if (amount > this.currentBalance) {
            throw new Error('Gemas insuficientes');
        }

        try {
            const response = await fetch(`${this.baseURL}?action=transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_user_id: this.currentUserId,
                    to_user_id: toUserId,
                    amount: amount,
                    description: description
                })
            });

            const data = await response.json();
            
            if (data.success) {
                await this.updateBalance();
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al transferir gemas:', error);
            throw error;
        }
    }

    /**
     * Añadir gemas (admin/sistema)
     */
    async addGems(amount, type = 'earn', description = '', relatedId = null) {
        if (!this.currentUserId) throw new Error('Usuario no inicializado');

        try {
            const response = await fetch(`${this.baseURL}?action=add_gems`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: this.currentUserId,
                    amount: amount,
                    type: type,
                    description: description,
                    related_id: relatedId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentBalance = data.data.new_balance;
                this.updateUI(this.currentBalance);
                return data;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error al añadir gemas:', error);
            throw error;
        }
    }

    /**
     * Formatear cantidad de gemas para mostrar
     */
    formatGems(amount) {
        return `${amount} 💎`;
    }

    /**
     * Validar si el usuario tiene gemas suficientes
     */
    hasEnoughGems(amount) {
        return this.currentBalance >= amount;
    }

    /**
     * Mostrar notificación de gemas ganadas
     */
    showGemsNotification(amount, message = '') {
        const notification = document.createElement('div');
        notification.className = 'gems-notification';
        notification.innerHTML = `
            <div class="gems-notif-content">
                <span class="gems-amount">+${amount} 💎</span>
                ${message ? `<span class="gems-message">${message}</span>` : ''}
            </div>
        `;
        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => notification.classList.add('show'), 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Mostrar notificación de gemas perdidas
     */
    showGemsLostNotification(amount, message = '') {
        const notification = document.createElement('div');
        notification.className = 'gems-notification lost';
        notification.innerHTML = `
            <div class="gems-notif-content">
                <span class="gems-amount">-${amount} 💎</span>
                ${message ? `<span class="gems-message">${message}</span>` : ''}
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Exportar instancia global
const gemsManager = new GemsManager();
