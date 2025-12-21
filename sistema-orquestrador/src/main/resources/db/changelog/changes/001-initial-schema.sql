--liquibase formatted sql

--changeset snackbar:001-initial-schema
--comment: Migration inicial: Criação das tabelas do módulo gestao-cardapio

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_categorias_nome (nome),
    INDEX idx_categorias_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_produtos_categoria (categoria),
    INDEX idx_produtos_disponivel (disponivel),
    INDEX idx_produtos_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
