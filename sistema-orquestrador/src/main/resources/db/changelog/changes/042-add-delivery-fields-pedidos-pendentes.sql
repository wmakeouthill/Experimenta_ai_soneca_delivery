--liquibase formatted sql

--changeset snackbar:042-add-tipo-pedido-pendentes-column
--comment: Adiciona coluna tipo_pedido na tabela pedidos_pendentes_mesa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'tipo_pedido'
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN tipo_pedido VARCHAR(20) DEFAULT 'MESA';

--changeset snackbar:042-add-endereco-entrega-pendentes-column
--comment: Adiciona coluna endereco_entrega na tabela pedidos_pendentes_mesa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'endereco_entrega'
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN endereco_entrega TEXT;

--changeset snackbar:042-add-previsao-cliente-pendentes-column
--comment: Adiciona coluna previsao_entrega_cliente na tabela pedidos_pendentes_mesa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'previsao_entrega_cliente'
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN previsao_entrega_cliente VARCHAR(100);

--changeset snackbar:042-add-idx-tipo-pedido-pendentes
--comment: Adiciona índice para tipo_pedido em pedidos_pendentes_mesa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND index_name = 'idx_pedidos_pendentes_tipo'
CREATE INDEX idx_pedidos_pendentes_tipo ON pedidos_pendentes_mesa(tipo_pedido);
