--liquibase formatted sql
--changeset snackbar:042-add-delivery-fields-pedidos-pendentes
--comment: Adiciona campos de delivery na tabela de pedidos pendentes de mesa

-- Tipo de pedido (DELIVERY, RETIRADA)
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN tipo_pedido VARCHAR(20) DEFAULT 'MESA';

-- Campos de endereço de entrega
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN endereco_entrega TEXT;

-- Previsão de entrega informada pelo cliente
ALTER TABLE pedidos_pendentes_mesa ADD COLUMN previsao_entrega_cliente VARCHAR(100);

-- Índice para buscar pedidos por tipo
CREATE INDEX idx_pedidos_pendentes_tipo ON pedidos_pendentes_mesa(tipo_pedido);
