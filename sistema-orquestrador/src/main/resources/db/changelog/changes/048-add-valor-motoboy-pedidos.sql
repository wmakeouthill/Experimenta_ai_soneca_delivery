--liquibase formatted sql

--changeset snackbar:048-add-valor-motoboy-pedidos
--comment: Adiciona coluna valor_motoboy na tabela pedidos (valor pago ao motoboy por entrega)
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'valor_motoboy'
ALTER TABLE pedidos ADD COLUMN valor_motoboy DECIMAL(10,2) DEFAULT 5.00;

--changeset snackbar:048-add-valor-motoboy-pedidos-delivery
--comment: Adiciona coluna valor_motoboy na tabela pedidos_delivery (valor pago ao motoboy por entrega)
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos_delivery' AND column_name = 'valor_motoboy'
ALTER TABLE pedidos_delivery ADD COLUMN valor_motoboy DECIMAL(10,2) DEFAULT 5.00;

--changeset snackbar:048-add-comment-valor-motoboy-pedidos
--comment: Adiciona comentário explicativo na coluna valor_motoboy da tabela pedidos
ALTER TABLE pedidos MODIFY COLUMN valor_motoboy DECIMAL(10,2) DEFAULT 5.00 COMMENT 'Valor pago ao motoboy por esta entrega específica (padrão R$ 5,00, pode ser alterado pelo operador/admin)';

--changeset snackbar:048-add-comment-valor-motoboy-pedidos-delivery
--comment: Adiciona comentário explicativo na coluna valor_motoboy da tabela pedidos_delivery
ALTER TABLE pedidos_delivery MODIFY COLUMN valor_motoboy DECIMAL(10,2) DEFAULT 5.00 COMMENT 'Valor pago ao motoboy por esta entrega específica (padrão R$ 5,00, pode ser alterado pelo operador/admin)';

