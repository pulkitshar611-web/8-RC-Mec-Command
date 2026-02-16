-- Institutional Platform Database Dump
-- Compatible with MySQL/MariaDB
-- Generated: 2026-02-16

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Table Structure for User
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) UNIQUE NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` VARCHAR(191) NOT NULL DEFAULT 'STAFF',
  `rank` VARCHAR(191) DEFAULT 'Soldado',
  `status` VARCHAR(191) NOT NULL DEFAULT 'Ativo',
  `avatar` TEXT,
  `phone` VARCHAR(191) DEFAULT NULL,
  `location` VARCHAR(191) DEFAULT NULL,
  `unit` VARCHAR(191) DEFAULT '8º RC Mec',
  `sector` VARCHAR(191) DEFAULT 'A-124',
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table Structure for Topic
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Topic`;
CREATE TABLE `Topic` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(191) NOT NULL,
  `aiSummary` TEXT,
  `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
  `suggestions` TEXT,
  `action` VARCHAR(191) DEFAULT NULL,
  `finalSolution` TEXT,
  `feedbackMessage` TEXT,
  `priority` VARCHAR(191) DEFAULT NULL,
  `impactType` VARCHAR(191) DEFAULT NULL,
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table Structure for Report
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Report`;
CREATE TABLE `Report` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` VARCHAR(191) NOT NULL,
  `subcategory` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `priority` VARCHAR(191) NOT NULL,
  `media` TEXT,
  `metadata` TEXT,
  `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
  `createdAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `userId` INT NOT NULL,
  `topicId` INT DEFAULT NULL,
  CONSTRAINT `Report_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Report_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `Topic` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table Structure for SystemSettings
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `SystemSettings`;
CREATE TABLE `SystemSettings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `institutionName` VARCHAR(191) NOT NULL DEFAULT '8º Regimento de Cavalaria Mecanizado',
  `lightProtocol` TINYINT(1) NOT NULL DEFAULT 1,
  `aiTriage` TINYINT(1) NOT NULL DEFAULT 1,
  `emailNotifications` TINYINT(1) NOT NULL DEFAULT 1,
  `passwordPolicy` VARCHAR(191) NOT NULL DEFAULT 'Forte',
  `sessionTimeout` INT NOT NULL DEFAULT 30,
  `personnelScore` DOUBLE NOT NULL DEFAULT 94.2,
  `fleetScore` DOUBLE NOT NULL DEFAULT 82.5,
  `supplyScore` DOUBLE NOT NULL DEFAULT 89.8,
  `updatedAt` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Table Structure for Feedback
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS `Feedback`;
CREATE TABLE `Feedback` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `message` TEXT NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `date` DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  `userId` INT NOT NULL,
  CONSTRAINT `Feedback_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Seed Data
-- -----------------------------------------------------------------------------

-- Admins and Staff
-- Passwords are 'admin123' and 'staff123' respectively (hashed)
INSERT INTO `User` (`id`, `email`, `password`, `name`, `role`, `rank`, `status`, `avatar`, `phone`, `location`, `unit`, `sector`) VALUES
(1, 'admin@example.com', '$2a$08$iPDJjKpwdDi8CImxuP.3kuHGHI9YNKRjGwI7bJ2l8cc9Oe8X5BXj.', 'Commander Shepard', 'ADMIN', 'Ten Cel', 'Ativo', 'https://i.pravatar.cc/150?u=admin', '555-0199', 'Comando de Regimento', '8º RC Mec', 'A-124'),
(2, 'staff@example.com', '$2a$08$HtfPBOB8529Rb4yec987tuohBHsVjPwhOlwjBc7mkJRytRkZlYgiK', 'Pvt. Jenkins', 'STAFF', 'Sd EP', 'Ativo', 'https://i.pravatar.cc/150?u=staff', '555-0101', '4º Esquadrão', '8º RC Mec', 'B-202'),
(3, 'sgt.oliveira@example.com', '$2a$08$HtfPBOB8529Rb4yec987tuohBHsVjPwhOlwjBc7mkJRytRkZlYgiK', 'Sgt. Oliveira', 'STAFF', '2º Sgt', 'Ativo', 'https://i.pravatar.cc/150?u=sgt', '555-0155', 'Garagem de Viaturas', '8º RC Mec', 'V-10');

-- Topics
INSERT INTO `Topic` (`id`, `title`, `aiSummary`, `status`, `suggestions`, `priority`, `impactType`) VALUES
(1, 'Manutenção de Viaturas - Esquadrão B', 'Falhas hidráulicas recorrentes nas viaturas do Esquadrão B. Possível descuido na manutenção preventiva identificado no Setor 4.', 'validated', '[{"text":"Aumentar frequência de verificação de pressão","author":"Sgt. Oliveira"},{"text":"Substituir kits de vedação das unidades do Setor 4"},{"text":"Upgrade para fluido de alta performance","author":"Cb. Mendes"}]', 'high', 'Segurança'),
(2, 'Falha de Comunicação - Ala Norte', 'Atenuação de sinal reportada durante horários de pico operacional. Provável interferência de redes externas.', 'validated', '[{"text":"Instalar repetidores de sinal a cada 50m"},{"text":"Mudar para frequência criptografada 7","author":"Ten. Costa"},{"text":"Reorientar antenas das torres de guarda"}]', 'medium', 'Eficiência'),
(3, 'Atraso no Suprimento Médico', 'Atraso na distribuição de kits de trauma primário. Erro de sincronização no sistema de inventário da enfermaria.', 'priority_alert', '[{"text":"Autorizar distribuição manual de emergência","author":"Maj. Rocha"},{"text":"Reiniciar logs de sincronização do banco de dados"},{"text":"Aumentar estoque de kits nas zonas de deslocamento rápido"}]', 'high', 'Moral'),
(4, 'Erro de Protocolo - Reserva de Armamento', 'Desalinhamento do sensor no portão biométrico. Rejeição incorreta de pessoal autorizado detectada.', 'validated', '[{"text":"Recalibrar sensores biométricos"},{"text":"Implementar protocolo temporário de liberação manual","author":"Subten. Almeida"},{"text":"Atualizar logs de acesso de pessoal"}]', 'low', 'Segurança');

-- Reports
INSERT INTO `Report` (`id`, `category`, `subcategory`, `description`, `priority`, `status`, `userId`, `topicId`) VALUES
(5, 'Infraestrutura', 'Manutenção', 'Relatório inicial identificando problemas em Manutenção de Viaturas - Esquadrão B', 'High', 'Approved', 2, 1),
(6, 'Operacional', 'Campo', 'Confirmação de impacto em campo referente a Manutenção de Viaturas - Esquadrão B', 'High', 'Pending', 3, 1),
(7, 'Infraestrutura', 'Manutenção', 'Relatório inicial identificando problemas em Falha de Comunicação - Ala Norte', 'Medium', 'Approved', 2, 2),
(8, 'Operacional', 'Campo', 'Confirmação de impacto em campo referente a Falha de Comunicação - Ala Norte', 'Low', 'Pending', 3, 2),
(9, 'Infraestrutura', 'Manutenção', 'Relatório inicial identificando problemas em Atraso no Suprimento Médico', 'High', 'Approved', 2, 3),
(10, 'Operacional', 'Campo', 'Confirmação de impacto em campo referente a Atraso no Suprimento Médico', 'High', 'Pending', 3, 3),
(11, 'Infraestrutura', 'Manutenção', 'Relatório inicial identificando problemas em Erro de Protocolo - Reserva de Armamento', 'Low', 'Approved', 2, 4),
(12, 'Operacional', 'Campo', 'Confirmação de impacto em campo referente a Erro de Protocolo - Reserva de Armamento', 'Low', 'Pending', 3, 4);

-- Feedback
INSERT INTO `Feedback` (`id`, `message`, `type`, `userId`) VALUES
(1, 'Manutenção da Viatura 102 concluída com sucesso.', 'Notice', 2),
(2, 'Excelente desempenho na coordenação da Ala Norte.', 'Commendation', 3),
(3, 'Reunião de comando agendada para amanhã às 08:00.', 'Notice', 1);

-- System Settings
INSERT INTO `SystemSettings` (`id`, `institutionName`, `personnelScore`, `fleetScore`, `supplyScore`) VALUES
(1, '8º Regimento de Cavalaria Mecanizado', 94.2, 82.5, 89.8);

SET FOREIGN_KEY_CHECKS = 1;
