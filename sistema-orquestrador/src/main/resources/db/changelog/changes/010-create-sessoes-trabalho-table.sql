--liquibase formatted sql

--changeset snackbar:010-create-sessoes-trabalho-table
--comment: Migration: Criação da tabela de sessões de trabalho

-- Tabela de Sessões de Trabalho
CREATE TABLE IF NOT EXISTS sessoes_trabalho (
    id VARCHAR(36) PRIMARY KEY,
    numero_sessao INT NOT NULL,
    data_inicio DATE NOT NULL,
    data_inicio_completa TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NULL,
    status VARCHAR(20) NOT NULL,
    usuario_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_sessoes_trabalho_status (status),
    INDEX idx_sessoes_trabalho_data_inicio (data_inicio),
    INDEX idx_sessoes_trabalho_usuario_id (usuario_id),
    INDEX idx_sessoes_trabalho_numero_sessao (numero_sessao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS sessoes_trabalho;

