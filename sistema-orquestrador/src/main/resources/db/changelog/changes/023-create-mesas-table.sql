--liquibase formatted sql
--changeset snackbar:023-create-mesas-table
--comment: Cria tabela de mesas com QR code único para pedidos de clientes
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'mesas'

CREATE TABLE mesas (
    id VARCHAR(36) PRIMARY KEY,
    numero INT NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    qr_code_token VARCHAR(64) NOT NULL UNIQUE,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_mesas_numero (numero),
    INDEX idx_mesas_qr_code_token (qr_code_token),
    INDEX idx_mesas_ativa (ativa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset snackbar:023-add-mesa-columns-to-pedidos
--comment: Adiciona colunas de mesa na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'mesa_id'

ALTER TABLE pedidos
ADD COLUMN mesa_id VARCHAR(36) NULL,
ADD COLUMN nome_cliente_mesa VARCHAR(100) NULL;

--changeset snackbar:023-add-mesa-index-to-pedidos
--comment: Adiciona indice de mesa na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND index_name = 'idx_pedidos_mesa_id'

CREATE INDEX idx_pedidos_mesa_id ON pedidos(mesa_id);

--rollback DROP INDEX idx_pedidos_mesa_id ON pedidos;
--rollback ALTER TABLE pedidos DROP COLUMN nome_cliente_mesa;
--rollback ALTER TABLE pedidos DROP COLUMN mesa_id;
--rollback DROP TABLE mesas;
