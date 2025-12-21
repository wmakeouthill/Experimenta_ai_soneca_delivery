--liquibase formatted sql
--changeset snackbar:041-add-delivery-fields-pedidos
--comment: Adiciona campos de delivery na tabela de pedidos

-- Enum para tipo de pedido
ALTER TABLE pedidos ADD COLUMN tipo_pedido VARCHAR(20) DEFAULT 'BALCAO';

-- Campos de endereço de entrega
ALTER TABLE pedidos ADD COLUMN endereco_entrega TEXT;

-- Campos de delivery
ALTER TABLE pedidos ADD COLUMN motoboy_id VARCHAR(36);
ALTER TABLE pedidos ADD COLUMN taxa_entrega DECIMAL(10,2);
ALTER TABLE pedidos ADD COLUMN previsao_entrega DATETIME;

-- Foreign key para motoboy
ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_motoboy 
    FOREIGN KEY (motoboy_id) REFERENCES motoboys(id) ON DELETE SET NULL;

-- Índice para buscar pedidos de delivery
CREATE INDEX idx_pedidos_tipo_pedido ON pedidos(tipo_pedido);
CREATE INDEX idx_pedidos_motoboy_id ON pedidos(motoboy_id);
