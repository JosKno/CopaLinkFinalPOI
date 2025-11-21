-- Agregar columna para recompensa activa en users
ALTER TABLE `users` 
ADD COLUMN `active_reward_id` INT NULL DEFAULT NULL AFTER `gems`,
ADD CONSTRAINT `fk_active_reward` 
  FOREIGN KEY (`active_reward_id`) 
  REFERENCES `rewards`(`id`) 
  ON DELETE SET NULL;
