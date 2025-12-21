--liquibase formatted sql

--changeset snackbar:013-add-data-finalizacao-pedidos
--comment: Migration: Adiciona coluna data_finalizacao na tabela pedidos para armazenar data definitiva de finalização
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'data_finalizacao'

ALTER TABLE pedidos 
ADD COLUMN data_finalizacao TIMESTAMP NULL 
AFTER data_pedido;

-- Índice para consultas por data de finalização
CREATE INDEX idx_pedidos_data_finalizacao ON pedidos(data_finalizacao);

