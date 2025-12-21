--liquibase formatted sql

--changeset snackbar:020-adicionar-usuario-movimentacoes-caixa
--comment: Adiciona coluna usuario_id na tabela movimentacoes_caixa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_caixa' AND column_name = 'usuario_id'

ALTER TABLE movimentacoes_caixa
    ADD COLUMN usuario_id VARCHAR(36) NULL;

CREATE INDEX idx_movimentacoes_caixa_usuario_id ON movimentacoes_caixa(usuario_id);

--rollback ALTER TABLE movimentacoes_caixa DROP COLUMN usuario_id;
--rollback DROP INDEX idx_movimentacoes_caixa_usuario_id ON movimentacoes_caixa;

