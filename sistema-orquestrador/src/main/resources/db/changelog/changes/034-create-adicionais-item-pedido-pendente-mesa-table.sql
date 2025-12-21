--liquibase formatted sql

--changeset snackbar:034-create-adicionais-item-pedido-pendente-mesa
--comment: Criação da tabela de adicionais para itens de pedidos pendentes de mesa

-- Tabela de Adicionais de Itens de Pedidos Pendentes de Mesa
-- Guarda os adicionais escolhidos pelo cliente em pedidos via QR code antes de serem aceitos
CREATE TABLE IF NOT EXISTS adicionais_item_pedido_pendente_mesa (
    id VARCHAR(36) PRIMARY KEY,
    item_pedido_pendente_id VARCHAR(36) NOT NULL,
    adicional_id VARCHAR(36) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    INDEX idx_adicionais_item_pedido_pendente_item (item_pedido_pendente_id),
    FOREIGN KEY (item_pedido_pendente_id) REFERENCES itens_pedido_pendente_mesa(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
