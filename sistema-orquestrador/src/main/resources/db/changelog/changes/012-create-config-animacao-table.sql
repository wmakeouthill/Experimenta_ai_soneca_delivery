--liquibase formatted sql

--changeset snackbar:012-create-config-animacao-table
--comment: Migration: Criação da tabela de configuração de animação do lobby de pedidos

-- Tabela de Configuração de Animação
CREATE TABLE IF NOT EXISTS config_animacao (
    id VARCHAR(36) PRIMARY KEY,
    animacao_ativada BOOLEAN NOT NULL DEFAULT TRUE,
    intervalo_animacao INT NOT NULL DEFAULT 30,
    duracao_animacao INT NOT NULL DEFAULT 6,
    video1_url LONGTEXT,
    video2_url LONGTEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configuração padrão
INSERT INTO config_animacao (id, animacao_ativada, intervalo_animacao, duracao_animacao, created_at, updated_at)
VALUES (UUID(), TRUE, 30, 6, NOW(), NOW())
ON DUPLICATE KEY UPDATE updated_at = NOW();

