--liquibase formatted sql

--changeset snackbar:019-gestao-caixa-1
--comment: Migration: Adicionar colunas de valores de abertura e fechamento de caixa na tabela de sessões
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'sessoes_trabalho' AND column_name = 'valor_abertura'

-- Adiciona colunas de valor de abertura e fechamento na tabela de sessões de trabalho
ALTER TABLE sessoes_trabalho 
    ADD COLUMN valor_abertura DECIMAL(10,2) NULL,
    ADD COLUMN valor_fechamento DECIMAL(10,2) NULL;

--rollback ALTER TABLE sessoes_trabalho DROP COLUMN valor_abertura, DROP COLUMN valor_fechamento;

--changeset snackbar:019-gestao-caixa-2
--comment: Migration: Criação da tabela de movimentações de caixa
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'movimentacoes_caixa'

-- Tabela de Movimentações de Caixa
-- Registra todas as transações em dinheiro durante uma sessão de trabalho
CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
    id VARCHAR(36) PRIMARY KEY,
    sessao_id VARCHAR(36) NOT NULL,
    pedido_id VARCHAR(36) NULL,
    tipo VARCHAR(30) NOT NULL COMMENT 'Tipo: ABERTURA, VENDA_DINHEIRO, SANGRIA, SUPRIMENTO, FECHAMENTO',
    valor DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(255) NULL,
    data_movimentacao TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    INDEX idx_movimentacoes_caixa_sessao_id (sessao_id),
    INDEX idx_movimentacoes_caixa_pedido_id (pedido_id),
    INDEX idx_movimentacoes_caixa_tipo (tipo),
    INDEX idx_movimentacoes_caixa_data (data_movimentacao),
    CONSTRAINT fk_movimentacoes_caixa_sessao FOREIGN KEY (sessao_id) 
        REFERENCES sessoes_trabalho(id) ON DELETE CASCADE,
    CONSTRAINT fk_movimentacoes_caixa_pedido FOREIGN KEY (pedido_id) 
        REFERENCES pedidos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS movimentacoes_caixa;

