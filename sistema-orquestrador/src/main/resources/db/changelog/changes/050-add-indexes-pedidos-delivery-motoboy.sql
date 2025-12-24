--liquibase formatted sql

--changeset snackbar:050-add-indexes-pedidos-delivery-motoboy
--comment: Adiciona índices para melhorar performance de consultas de pedidos por motoboy
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos_delivery' AND index_name = 'idx_pedidos_delivery_motoboy'

-- Índice simples para motoboy_id
CREATE INDEX idx_pedidos_delivery_motoboy ON pedidos_delivery(motoboy_id);

-- Índice composto para motoboy_id + status (usado na query de listagem de pedidos do motoboy)
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos_delivery' AND index_name = 'idx_pedidos_delivery_motoboy_status'
CREATE INDEX idx_pedidos_delivery_motoboy_status ON pedidos_delivery(motoboy_id, status);

