--liquibase formatted sql

--changeset snackbar:022-gestao-estoque-1
--comment: Migration: Criação da tabela de itens de estoque

-- Tabela de Itens de Estoque
-- Registra todos os itens/produtos do estoque da lanchonete
CREATE TABLE IF NOT EXISTS itens_estoque (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao VARCHAR(500) NULL,
    quantidade DECIMAL(12,3) NOT NULL DEFAULT 0,
    quantidade_minima DECIMAL(12,3) NOT NULL DEFAULT 0 COMMENT 'Quantidade mínima para alerta de reposição',
    unidade_medida VARCHAR(30) NOT NULL COMMENT 'UN, KG, LT, PCT, CX',
    preco_unitario DECIMAL(10,2) NULL COMMENT 'Preço de custo unitário',
    fornecedor VARCHAR(200) NULL,
    codigo_barras VARCHAR(50) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_itens_estoque_nome (nome),
    INDEX idx_itens_estoque_ativo (ativo),
    INDEX idx_itens_estoque_codigo_barras (codigo_barras),
    UNIQUE INDEX idx_itens_estoque_nome_unique (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS itens_estoque;

