--liquibase formatted sql

--changeset snackbar:004-create-pedidos-tables
--comment: Migration: Criação das tabelas de pedidos e itens_pedido

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id VARCHAR(36) PRIMARY KEY,
    numero_pedido VARCHAR(10) NOT NULL UNIQUE,
    cliente_id VARCHAR(36) NOT NULL,
    cliente_nome VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL,
    valor_total DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    usuario_id VARCHAR(36),
    data_pedido TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_pedidos_status (status),
    INDEX idx_pedidos_cliente_id (cliente_id),
    INDEX idx_pedidos_data_pedido (data_pedido),
    INDEX idx_pedidos_numero_pedido (numero_pedido),
    INDEX idx_pedidos_usuario_id (usuario_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id VARCHAR(36) PRIMARY KEY,
    pedido_id VARCHAR(36) NOT NULL,
    produto_id VARCHAR(36) NOT NULL,
    produto_nome VARCHAR(200) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    INDEX idx_itens_pedido_pedido_id (pedido_id),
    INDEX idx_itens_pedido_produto_id (produto_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

