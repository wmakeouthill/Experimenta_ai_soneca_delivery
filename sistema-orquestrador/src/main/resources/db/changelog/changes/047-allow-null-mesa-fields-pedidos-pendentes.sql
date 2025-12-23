--liquibase formatted sql

--changeset snackbar:047-allow-null-mesa-token
--comment: Permite mesa_token nulo para pedidos de delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'mesa_token' AND is_nullable = 'NO'
ALTER TABLE pedidos_pendentes_mesa MODIFY COLUMN mesa_token VARCHAR(100) NULL;

--changeset snackbar:047-allow-null-mesa-id
--comment: Permite mesa_id nulo para pedidos de delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'mesa_id' AND is_nullable = 'NO'
ALTER TABLE pedidos_pendentes_mesa MODIFY COLUMN mesa_id VARCHAR(36) NULL;

--changeset snackbar:047-allow-null-numero-mesa
--comment: Permite numero_mesa nulo para pedidos de delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND column_name = 'numero_mesa' AND is_nullable = 'NO'
ALTER TABLE pedidos_pendentes_mesa MODIFY COLUMN numero_mesa INT NULL;

--changeset snackbar:047-add-index-tipo-delivery
--comment: Adiciona índice para filtrar pedidos por tipo (DELIVERY/RETIRADA)
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos_pendentes_mesa' AND index_name = 'idx_pedidos_pendentes_tipo_delivery'
CREATE INDEX idx_pedidos_pendentes_tipo_delivery ON pedidos_pendentes_mesa(tipo_pedido, data_hora_solicitacao);
