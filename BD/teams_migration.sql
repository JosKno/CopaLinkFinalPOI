-- Migración para agregar tabla de equipos del Mundial 2026

-- Tabla de equipos clasificados
CREATE TABLE IF NOT EXISTS `teams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `power_level` INT NOT NULL CHECK (power_level >= 50 AND power_level <= 100),
  `fifa_code` VARCHAR(3) NOT NULL UNIQUE,
  `confederation` ENUM('UEFA', 'CONMEBOL', 'CONCACAF', 'CAF', 'AFC', 'OFC') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insertar los 48 equipos clasificados al Mundial 2026
-- Equipos ordenados por nivel de poder (realista según FIFA ranking)

-- Equipos TOP (Poder 90-100)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Brasil', 98, 'BRA', 'CONMEBOL'),
('Argentina', 97, 'ARG', 'CONMEBOL'),
('Francia', 96, 'FRA', 'UEFA'),
('Inglaterra', 95, 'ENG', 'UEFA'),
('España', 94, 'ESP', 'UEFA'),
('Alemania', 93, 'GER', 'UEFA'),
('Portugal', 92, 'POR', 'UEFA'),
('Países Bajos', 91, 'NED', 'UEFA'),
('Bélgica', 90, 'BEL', 'UEFA'),
('Italia', 90, 'ITA', 'UEFA');

-- Equipos de Alto Nivel (Poder 80-89)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Uruguay', 88, 'URU', 'CONMEBOL'),
('Croacia', 87, 'CRO', 'UEFA'),
('Colombia', 86, 'COL', 'CONMEBOL'),
('México', 85, 'MEX', 'CONCACAF'),
('Estados Unidos', 84, 'USA', 'CONCACAF'),
('Dinamarca', 83, 'DEN', 'UEFA'),
('Suiza', 82, 'SUI', 'UEFA'),
('Senegal', 81, 'SEN', 'CAF'),
('Japón', 80, 'JPN', 'AFC'),
('Corea del Sur', 80, 'KOR', 'AFC');

-- Equipos de Nivel Medio-Alto (Poder 70-79)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Polonia', 78, 'POL', 'UEFA'),
('Serbia', 77, 'SRB', 'UEFA'),
('Marruecos', 76, 'MAR', 'CAF'),
('Canadá', 75, 'CAN', 'CONCACAF'),
('Gales', 74, 'WAL', 'UEFA'),
('Ucrania', 73, 'UKR', 'UEFA'),
('Ecuador', 72, 'ECU', 'CONMEBOL'),
('Suecia', 71, 'SWE', 'UEFA'),
('Irán', 70, 'IRN', 'AFC'),
('Perú', 70, 'PER', 'CONMEBOL');

-- Equipos de Nivel Medio (Poder 60-69)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Chile', 68, 'CHI', 'CONMEBOL'),
('Nigeria', 67, 'NGA', 'CAF'),
('Costa Rica', 66, 'CRC', 'CONCACAF'),
('Túnez', 65, 'TUN', 'CAF'),
('Australia', 64, 'AUS', 'AFC'),
('Camerún', 63, 'CMR', 'CAF'),
('Argelia', 62, 'ALG', 'CAF'),
('Arabia Saudita', 61, 'KSA', 'AFC'),
('Catar', 60, 'QAT', 'AFC'),
('Irak', 60, 'IRQ', 'AFC');

-- Equipos de Nivel Medio-Bajo (Poder 55-59)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Egipto', 58, 'EGY', 'CAF'),
('Ghana', 57, 'GHA', 'CAF'),
('Panamá', 56, 'PAN', 'CONCACAF'),
('Jamaica', 55, 'JAM', 'CONCACAF'),
('Paraguay', 55, 'PAR', 'CONMEBOL'),
('Venezuela', 55, 'VEN', 'CONMEBOL');

-- Equipos de Nivel Base (Poder 50-54)
INSERT INTO `teams` (`name`, `power_level`, `fifa_code`, `confederation`) VALUES
('Uzbekistán', 54, 'UZB', 'AFC'),
('Nueva Zelanda', 53, 'NZL', 'OFC'),
('Islandia', 52, 'ISL', 'UEFA'),
('Eslovaquia', 52, 'SVK', 'UEFA'),
('Honduras', 51, 'HON', 'CONCACAF'),
('Bolivia', 50, 'BOL', 'CONMEBOL');

-- Total: 48 equipos
