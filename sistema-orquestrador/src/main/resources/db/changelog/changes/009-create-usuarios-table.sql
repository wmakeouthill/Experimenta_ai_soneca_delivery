--liquibase formatted sql

--changeset snackbar:009-create-usuarios-table
--comment: Migration: Criação da tabela de usuários para autenticação

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_role (role),
    INDEX idx_usuarios_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

