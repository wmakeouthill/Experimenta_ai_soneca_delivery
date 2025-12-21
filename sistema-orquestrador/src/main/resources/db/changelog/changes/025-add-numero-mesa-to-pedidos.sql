--liquibase formatted sql

--changeset migration:025 context:all
--comment: Adiciona coluna numero_mesa na tabela pedidos para exibição
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'pedidos' AND column_name = 'numero_mesa'
ALTER TABLE pedidos ADD COLUMN numero_mesa INT NULL;

--rollback ALTER TABLE pedidos DROP COLUMN numero_mesa;
