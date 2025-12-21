--liquibase formatted sql

--changeset snackbar:008-create-meios-pagamento-pedido-table
--comment: Migration: Criação da tabela meios_pagamento_pedido para suportar múltiplos meios de pagamento por pedido

CREATE TABLE IF NOT EXISTS meios_pagamento_pedido (
    id VARCHAR(36) PRIMARY KEY,
    pedido_id VARCHAR(36) NOT NULL,
    meio_pagamento VARCHAR(20) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    INDEX idx_meios_pagamento_pedido_id (pedido_id),
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS meios_pagamento_pedido;

