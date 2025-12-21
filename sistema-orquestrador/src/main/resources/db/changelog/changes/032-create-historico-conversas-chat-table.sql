-- liquibase formatted sql

-- changeset sistema:032-create-historico-conversas-chat-table context:prod,dev
-- comment: Cria tabela para persistir histórico de conversas do Chat IA por cliente

CREATE TABLE IF NOT EXISTS historico_conversas_chat (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    preview_ultima_mensagem VARCHAR(255),
    mensagens TEXT NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_ultima_mensagem TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Índice para busca por cliente (mais usado)
CREATE INDEX idx_historico_conversas_cliente_id ON historico_conversas_chat(cliente_id);

-- Índice para ordenação por data
CREATE INDEX idx_historico_conversas_data_ultima ON historico_conversas_chat(data_ultima_mensagem DESC);

-- Índice composto para busca eficiente de conversas do cliente ordenadas
CREATE INDEX idx_historico_conversas_cliente_data ON historico_conversas_chat(cliente_id, data_ultima_mensagem DESC);

-- rollback DROP TABLE IF EXISTS historico_conversas_chat;
