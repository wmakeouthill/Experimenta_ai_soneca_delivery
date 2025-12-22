--liquibase formatted sql

--changeset soneca-delivery:045-1
--comment: Dropar tabelas de delivery para recriação com nomes corretos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'adicionais_item_pedido_delivery'

-- Dropar tabelas na ordem correta (dependências primeiro)
DROP TABLE IF EXISTS meios_pagamento_pedido_delivery;
DROP TABLE IF EXISTS adicionais_item_pedido_delivery;
DROP TABLE IF EXISTS itens_pedido_delivery;
DROP TABLE IF EXISTS pedido_delivery_sequence;
DROP TABLE IF EXISTS pedidos_delivery;

--changeset soneca-delivery:045-2
--comment: Recriar tabela de pedidos delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'pedidos_delivery'
CREATE TABLE pedidos_delivery (
    id VARCHAR(36) PRIMARY KEY,
    numero_pedido VARCHAR(20) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    
    -- Cliente
    cliente_id VARCHAR(36),
    nome_cliente VARCHAR(200) NOT NULL,
    telefone_cliente VARCHAR(20) NOT NULL,
    email_cliente VARCHAR(255),
    
    -- Endereço de entrega
    endereco_entrega TEXT,
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(10),
    ponto_referencia VARCHAR(255),
    
    -- Tipo e status
    tipo_pedido ENUM('DELIVERY', 'RETIRADA') NOT NULL DEFAULT 'DELIVERY',
    status ENUM('AGUARDANDO_ACEITACAO', 'ACEITO', 'PREPARANDO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'FINALIZADO', 'CANCELADO') NOT NULL DEFAULT 'AGUARDANDO_ACEITACAO',
    
    -- Motoboy (para delivery)
    motoboy_id VARCHAR(36),
    motoboy_nome VARCHAR(200),
    
    -- Valores
    valor_itens DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_adicionais DECIMAL(10,2) NOT NULL DEFAULT 0,
    taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Pagamento
    meio_pagamento VARCHAR(50),
    valor_pago DECIMAL(10,2),
    troco_para DECIMAL(10,2),
    
    -- Observações
    observacoes TEXT,
    
    -- Previsões
    previsao_entrega DATETIME,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    aceito_at DATETIME,
    preparando_at DATETIME,
    pronto_at DATETIME,
    saiu_entrega_at DATETIME,
    entregue_at DATETIME,
    cancelado_at DATETIME,
    
    INDEX idx_pedidos_delivery_cliente (cliente_id),
    INDEX idx_pedidos_delivery_telefone (telefone_cliente),
    INDEX idx_pedidos_delivery_status (status),
    INDEX idx_pedidos_delivery_tipo (tipo_pedido),
    INDEX idx_pedidos_delivery_created (created_at),
    INDEX idx_pedidos_delivery_numero (numero_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset soneca-delivery:045-3
--comment: Recriar tabela de itens do pedido delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'itens_pedido_delivery'
CREATE TABLE itens_pedido_delivery (
    id VARCHAR(36) PRIMARY KEY,
    pedido_delivery_id VARCHAR(36) NOT NULL,
    
    -- Produto
    produto_id VARCHAR(36) NOT NULL,
    nome_produto VARCHAR(200) NOT NULL,
    descricao_produto TEXT,
    
    -- Valores
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL,
    valor_adicionais DECIMAL(10,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Observações específicas do item
    observacoes TEXT,
    
    -- Ordem de exibição
    ordem INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (pedido_delivery_id) REFERENCES pedidos_delivery(id) ON DELETE CASCADE,
    INDEX idx_itens_pedido_delivery (pedido_delivery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset soneca-delivery:045-4
--comment: Recriar tabela de adicionais dos itens do pedido delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'adicionais_item_pedido_delivery'
CREATE TABLE adicionais_item_pedido_delivery (
    id VARCHAR(36) PRIMARY KEY,
    item_pedido_delivery_id VARCHAR(36) NOT NULL,
    
    -- Adicional
    adicional_id VARCHAR(36) NOT NULL,
    nome_adicional VARCHAR(200) NOT NULL,
    
    -- Valores
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (item_pedido_delivery_id) REFERENCES itens_pedido_delivery(id) ON DELETE CASCADE,
    INDEX idx_adicionais_item_delivery (item_pedido_delivery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset soneca-delivery:045-5
--comment: Recriar sequence para número de pedido delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'pedido_delivery_sequence'
CREATE TABLE pedido_delivery_sequence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    data_referencia DATE NOT NULL,
    ultimo_numero INT NOT NULL DEFAULT 0,
    UNIQUE KEY uk_data_referencia (data_referencia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset soneca-delivery:045-6
--comment: Recriar tabela de meios de pagamento do pedido delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'meios_pagamento_pedido_delivery'
CREATE TABLE meios_pagamento_pedido_delivery (
    id VARCHAR(36) PRIMARY KEY,
    pedido_delivery_id VARCHAR(36) NOT NULL,
    
    tipo_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    troco_para DECIMAL(10,2),
    observacoes TEXT,
    
    FOREIGN KEY (pedido_delivery_id) REFERENCES pedidos_delivery(id) ON DELETE CASCADE,
    INDEX idx_meios_pag_pedido_delivery (pedido_delivery_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
