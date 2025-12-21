--liquibase formatted sql
--changeset snackbar:028-create-pedidos-pendentes-mesa-table
--comment: Cria tabela para persistir pedidos pendentes de mesa (QR code)
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa'

CREATE TABLE pedidos_pendentes_mesa (
    id VARCHAR(36) PRIMARY KEY,
    mesa_token VARCHAR(100) NOT NULL,
    mesa_id VARCHAR(36) NOT NULL,
    numero_mesa INT NOT NULL,
    cliente_id VARCHAR(36),
    nome_cliente VARCHAR(200) NOT NULL,
    telefone_cliente VARCHAR(20),
    observacoes TEXT,
    valor_total DECIMAL(10, 2) NOT NULL,
    data_hora_solicitacao DATETIME NOT NULL,
    pedido_real_id VARCHAR(36),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    
    INDEX idx_pedidos_pendentes_mesa_token (mesa_token),
    INDEX idx_pedidos_pendentes_data_solicitacao (data_hora_solicitacao),
    INDEX idx_pedidos_pendentes_pedido_real (pedido_real_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset snackbar:028-create-itens-pedido-pendente-mesa-table
--comment: Cria tabela de itens do pedido pendente de mesa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'itens_pedido_pendente_mesa'

CREATE TABLE itens_pedido_pendente_mesa (
    id VARCHAR(36) PRIMARY KEY,
    pedido_pendente_id VARCHAR(36) NOT NULL,
    produto_id VARCHAR(36) NOT NULL,
    nome_produto VARCHAR(200) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    observacoes TEXT,
    
    CONSTRAINT fk_item_pedido_pendente 
        FOREIGN KEY (pedido_pendente_id) 
        REFERENCES pedidos_pendentes_mesa(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
