--liquibase formatted sql
--changeset snackbar:027-add-version-column-pedidos
--comment: Adiciona coluna version na tabela pedidos para Optimistic Locking
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'version'

ALTER TABLE pedidos ADD COLUMN version BIGINT DEFAULT 0;

--changeset snackbar:027-add-version-column-sessoes-trabalho
--comment: Adiciona coluna version na tabela sessoes_trabalho para Optimistic Locking
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sessoes_trabalho' AND column_name = 'version'

ALTER TABLE sessoes_trabalho ADD COLUMN version BIGINT DEFAULT 0;

--changeset snackbar:027-update-version-pedidos
--comment: Atualiza registros existentes de pedidos para ter version = 0

UPDATE pedidos SET version = 0 WHERE version IS NULL;

--changeset snackbar:027-update-version-sessoes-trabalho
--comment: Atualiza registros existentes de sessoes_trabalho para ter version = 0

UPDATE sessoes_trabalho SET version = 0 WHERE version IS NULL;
