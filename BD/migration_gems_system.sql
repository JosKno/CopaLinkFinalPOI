-- Migration Script: Actualizar base de datos con sistema de gemas
-- Fecha: 2025-11-15
-- Descripción: Añade el sistema completo de gemas a CopaLink

-- 1. Agregar columna de gemas a la tabla users (si no existe)
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `gems` INT DEFAULT 100 AFTER `password`;

-- 2. Actualizar usuarios existentes para que tengan gemas iniciales
UPDATE `users` 
SET `gems` = 100 
WHERE `gems` IS NULL OR `gems` = 0;

-- 3. Modificar tabla tasks para incluir sistema de recompensas
ALTER TABLE `tasks` 
ADD COLUMN IF NOT EXISTS `assigned_to` INT NULL AFTER `creator_id`,
ADD COLUMN IF NOT EXISTS `gems_reward` INT DEFAULT 10 AFTER `assigned_to`,
ADD COLUMN IF NOT EXISTS `completed_by` INT NULL AFTER `is_completed`,
ADD COLUMN IF NOT EXISTS `completed_at` TIMESTAMP NULL AFTER `completed_by`;

-- Agregar foreign keys para las nuevas columnas
ALTER TABLE `tasks`
ADD CONSTRAINT `fk_tasks_assigned_to` 
FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_tasks_completed_by` 
FOREIGN KEY (`completed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL;

-- 4. Crear tabla de transacciones de gemas
CREATE TABLE IF NOT EXISTS `gem_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `amount` INT NOT NULL,
  `transaction_type` ENUM('earn', 'spend', 'bet_win', 'bet_loss', 'task_reward', 'transfer_send', 'transfer_receive') NOT NULL,
  `description` VARCHAR(255),
  `related_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_transactions` (`user_id`, `created_at`),
  INDEX `idx_transaction_type` (`transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Crear tabla de apuestas
CREATE TABLE IF NOT EXISTS `bets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `bet_group` VARCHAR(10) NOT NULL,
  `bet_team` VARCHAR(100) NOT NULL,
  `gems_amount` INT NOT NULL,
  `status` ENUM('pending', 'won', 'lost') DEFAULT 'pending',
  `simulation_id` VARCHAR(50) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_bets` (`user_id`, `status`),
  INDEX `idx_simulation` (`simulation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Insertar transacciones iniciales para usuarios existentes (bonus de bienvenida)
INSERT INTO `gem_transactions` (`user_id`, `amount`, `transaction_type`, `description`)
SELECT `id`, 100, 'earn', 'Bonus de bienvenida'
FROM `users`
WHERE NOT EXISTS (
    SELECT 1 FROM `gem_transactions` 
    WHERE `gem_transactions`.`user_id` = `users`.`id` 
    AND `gem_transactions`.`description` = 'Bonus de bienvenida'
);

-- 7. Crear vista para estadísticas de gemas por usuario
CREATE OR REPLACE VIEW `user_gems_stats` AS
SELECT 
    u.id,
    u.username,
    u.gems as current_balance,
    COALESCE(SUM(CASE WHEN gt.amount > 0 THEN gt.amount ELSE 0 END), 0) as total_earned,
    COALESCE(SUM(CASE WHEN gt.amount < 0 THEN ABS(gt.amount) ELSE 0 END), 0) as total_spent,
    COUNT(DISTINCT t.id) as tasks_completed,
    COUNT(DISTINCT b.id) as total_bets,
    COUNT(DISTINCT CASE WHEN b.status = 'won' THEN b.id END) as bets_won,
    COUNT(DISTINCT CASE WHEN b.status = 'lost' THEN b.id END) as bets_lost
FROM users u
LEFT JOIN gem_transactions gt ON u.id = gt.user_id
LEFT JOIN tasks t ON u.id = t.completed_by AND t.is_completed = 1
LEFT JOIN bets b ON u.id = b.user_id
GROUP BY u.id, u.username, u.gems;

-- 8. Crear procedimiento almacenado para otorgar recompensa por tarea
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS `award_task_completion`(
    IN p_task_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_gems_reward INT;
    DECLARE v_is_completed BOOLEAN;
    
    -- Verificar que la tarea no esté ya completada
    SELECT is_completed, gems_reward INTO v_is_completed, v_gems_reward
    FROM tasks 
    WHERE id = p_task_id;
    
    IF v_is_completed = 0 THEN
        -- Iniciar transacción
        START TRANSACTION;
        
        -- Actualizar la tarea
        UPDATE tasks 
        SET is_completed = 1, 
            completed_by = p_user_id, 
            completed_at = NOW()
        WHERE id = p_task_id;
        
        -- Otorgar gemas al usuario
        UPDATE users 
        SET gems = gems + v_gems_reward 
        WHERE id = p_user_id;
        
        -- Registrar transacción
        INSERT INTO gem_transactions (user_id, amount, transaction_type, description, related_id)
        VALUES (p_user_id, v_gems_reward, 'task_reward', 'Recompensa por completar tarea', p_task_id);
        
        COMMIT;
    END IF;
END //
DELIMITER ;

-- 9. Crear trigger para validar que las gemas no sean negativas
DELIMITER //
CREATE TRIGGER IF NOT EXISTS `prevent_negative_gems`
BEFORE UPDATE ON `users`
FOR EACH ROW
BEGIN
    IF NEW.gems < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El balance de gemas no puede ser negativo';
    END IF;
END //
DELIMITER ;

-- 10. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS `idx_tasks_completed` ON `tasks`(`is_completed`, `completed_at`);
CREATE INDEX IF NOT EXISTS `idx_tasks_group` ON `tasks`(`group_id`, `is_completed`);
CREATE INDEX IF NOT EXISTS `idx_users_gems` ON `users`(`gems`);

-- 11. Insertar algunos rewards de ejemplo
INSERT IGNORE INTO `rewards` (`id`, `name`, `description`, `criteria`) VALUES
(1, 'Primer Paso', 'Completa tu primera tarea', 'complete_1_task'),
(2, 'Trabajador Dedicado', 'Completa 10 tareas', 'complete_10_tasks'),
(3, 'Maestro de Tareas', 'Completa 50 tareas', 'complete_50_tasks'),
(4, 'Apostador Novato', 'Realiza tu primera apuesta', 'make_1_bet'),
(5, 'Racha de Suerte', 'Gana 5 apuestas seguidas', 'win_5_bets_streak'),
(6, 'Millonario', 'Acumula 1000 gemas', 'reach_1000_gems'),
(7, 'Generoso', 'Transfiere gemas a 5 usuarios diferentes', 'transfer_to_5_users'),
(8, 'Coleccionista', 'Obtén todos los logros básicos', 'collect_all_basic');

-- Confirmación
SELECT 'Migration completada exitosamente. Sistema de gemas instalado.' AS status;

-- Verificar instalación
SELECT 
    (SELECT COUNT(*) FROM users WHERE gems >= 0) as usuarios_con_gemas,
    (SELECT COUNT(*) FROM gem_transactions) as transacciones_totales,
    (SELECT COUNT(*) FROM bets) as apuestas_totales,
    (SELECT COUNT(*) FROM rewards) as recompensas_disponibles;
