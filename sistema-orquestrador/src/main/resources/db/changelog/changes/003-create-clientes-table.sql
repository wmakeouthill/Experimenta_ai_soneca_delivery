--liquibase formatted sql

--changeset snackbar:003-create-clientes-table
--comment: Migration: Criação da tabela de clientes

CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(200),
    cpf VARCHAR(14),
    observacoes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_clientes_telefone (telefone),
    INDEX idx_clientes_nome (nome),
    INDEX idx_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

