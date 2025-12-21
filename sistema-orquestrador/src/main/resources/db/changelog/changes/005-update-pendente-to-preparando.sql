--liquibase formatted sql

--changeset snackbar:005-update-pendente-to-preparando
--comment: Migration: Atualiza pedidos com status PENDENTE para PREPARANDO (status PENDENTE não é mais usado)
--preconditions onFail:MARK_RAN onError:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'pedidos'

-- Atualiza todos os pedidos que estão com status PENDENTE para PREPARANDO
UPDATE pedidos 
SET status = 'PREPARANDO', updated_at = NOW()
WHERE status = 'PENDENTE';

