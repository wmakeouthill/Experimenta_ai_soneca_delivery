-- liquibase formatted sql

-- changeset experimenta-ai:037-create-numero-pedido-sequence
-- comment: Criar tabela para simular sequence de número de pedido (MySQL não suporta SEQUENCE nativa)

-- Tabela para gerenciar sequence de número de pedido
-- MySQL não tem SEQUENCE nativa como PostgreSQL, então usamos uma tabela auxiliar
-- com auto_increment para garantir atomicidade
CREATE TABLE numero_pedido_sequence (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_numero_pedido_sequence_created_at (created_at)
) ENGINE=InnoDB;

-- Inicializar a sequence com o maior número de pedido existente
-- Isso garante que não haja conflito com pedidos já criados
INSERT INTO numero_pedido_sequence (id)
SELECT COALESCE(MAX(numero_pedido), 0) FROM pedidos;

-- Ajustar o AUTO_INCREMENT para começar do próximo número
-- Esta query será executada via stored procedure na aplicação

-- rollback DROP TABLE IF EXISTS numero_pedido_sequence;
