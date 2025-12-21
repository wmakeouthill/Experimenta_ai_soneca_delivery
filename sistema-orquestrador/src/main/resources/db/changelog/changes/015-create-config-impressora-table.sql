--liquibase formatted sql

--changeset snackbar:015-create-config-impressora-table
--comment: Migration: Criação da tabela de configuração de impressora

CREATE TABLE IF NOT EXISTS config_impressora (
    id VARCHAR(36) PRIMARY KEY,
    tipo_impressora VARCHAR(50) NOT NULL,
    nome_estabelecimento VARCHAR(200) NOT NULL,
    endereco_estabelecimento VARCHAR(500),
    telefone_estabelecimento VARCHAR(20),
    cnpj_estabelecimento VARCHAR(18),
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_config_impressora_ativa (ativa),
    INDEX idx_config_impressora_tipo (tipo_impressora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

