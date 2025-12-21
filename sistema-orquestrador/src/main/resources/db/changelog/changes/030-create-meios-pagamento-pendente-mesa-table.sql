--liquibase formatted sql

--changeset snackbar:030-create-meios-pagamento-pendente-mesa-table
--comment: Cria tabela para meios de pagamento de pedidos pendentes de mesa

--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'meios_pagamento_pendente_mesa'

CREATE TABLE meios_pagamento_pendente_mesa (
    id VARCHAR(36) PRIMARY KEY,
    pedido_pendente_id VARCHAR(36) NOT NULL,
    meio_pagamento VARCHAR(20) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    INDEX idx_meios_pagamento_pendente_pedido (pedido_pendente_id),
    CONSTRAINT fk_meios_pagamento_pendente_pedido 
        FOREIGN KEY (pedido_pendente_id) 
        REFERENCES pedidos_pendentes_mesa(id) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS meios_pagamento_pendente_mesa;
