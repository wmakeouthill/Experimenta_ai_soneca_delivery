--liquibase formatted sql

--changeset snackbar:033-create-adicionais-tables
--comment: Criação das tabelas para gerenciamento de adicionais de produtos

-- Tabela de Adicionais
-- Representa itens que podem ser adicionados aos produtos (carne extra, bacon, etc.)
CREATE TABLE IF NOT EXISTS adicionais (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    categoria VARCHAR(100),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_adicionais_nome (nome),
    INDEX idx_adicionais_categoria (categoria),
    INDEX idx_adicionais_disponivel (disponivel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de associação Produto-Adicional (N:N)
-- Define quais adicionais estão disponíveis para cada produto
CREATE TABLE IF NOT EXISTS produtos_adicionais (
    produto_id VARCHAR(36) NOT NULL,
    adicional_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (produto_id, adicional_id),
    INDEX idx_produtos_adicionais_produto (produto_id),
    INDEX idx_produtos_adicionais_adicional (adicional_id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (adicional_id) REFERENCES adicionais(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de adicionais selecionados em cada item do pedido
-- Guarda os adicionais escolhidos pelo cliente com suas quantidades
CREATE TABLE IF NOT EXISTS itens_pedido_adicionais (
    id VARCHAR(36) PRIMARY KEY,
    item_pedido_id VARCHAR(36) NOT NULL,
    adicional_id VARCHAR(36) NOT NULL,
    adicional_nome VARCHAR(200) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_itens_pedido_adicionais_item (item_pedido_id),
    INDEX idx_itens_pedido_adicionais_adicional (adicional_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Adicionar coluna id na tabela itens_pedido se não existir (para FK)
-- Note: A tabela itens_pedido já tem id como PK

