--liquibase formatted sql

--changeset snackbar:021-remover-pedido-id-movimentacoes-caixa-fk
--comment: Remove FK pedido_id da tabela movimentacoes_caixa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_caixa' AND constraint_name = 'fk_movimentacoes_caixa_pedido'

-- Primeiro remove a foreign key constraint
ALTER TABLE movimentacoes_caixa
    DROP FOREIGN KEY fk_movimentacoes_caixa_pedido;

--changeset snackbar:021-remover-pedido-id-movimentacoes-caixa-idx
--comment: Remove indice pedido_id da tabela movimentacoes_caixa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_caixa' AND index_name = 'idx_movimentacoes_caixa_pedido_id'

-- Remove o índice da coluna
DROP INDEX idx_movimentacoes_caixa_pedido_id ON movimentacoes_caixa;

--changeset snackbar:021-remover-pedido-id-movimentacoes-caixa-col
--comment: Remove coluna pedido_id da tabela movimentacoes_caixa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:1 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_caixa' AND column_name = 'pedido_id'

-- Depois remove a coluna
ALTER TABLE movimentacoes_caixa
    DROP COLUMN pedido_id;

--rollback ALTER TABLE movimentacoes_caixa ADD COLUMN pedido_id VARCHAR(36) NULL;
--rollback CREATE INDEX idx_movimentacoes_caixa_pedido_id ON movimentacoes_caixa(pedido_id);
--rollback ALTER TABLE movimentacoes_caixa ADD CONSTRAINT fk_movimentacoes_caixa_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL;

