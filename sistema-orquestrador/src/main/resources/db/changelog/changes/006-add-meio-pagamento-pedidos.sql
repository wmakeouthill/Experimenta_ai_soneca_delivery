--liquibase formatted sql

--changeset snackbar:006-add-meio-pagamento-pedidos
--comment: Migration: Adiciona coluna meio_pagamento na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'meio_pagamento'

ALTER TABLE pedidos 
ADD COLUMN meio_pagamento VARCHAR(20) NULL 
AFTER observacoes;

--rollback ALTER TABLE pedidos DROP COLUMN meio_pagamento;

