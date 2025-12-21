--liquibase formatted sql

--changeset snackbar:036-create-idempotency-keys-table
--comment: Cria tabela para armazenar chaves de idempotência e prevenir requisições duplicadas

CREATE TABLE IF NOT EXISTS idempotency_keys (
    id VARCHAR(36) PRIMARY KEY,
    idempotency_key VARCHAR(64) NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    response_body TEXT,
    response_status INT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    UNIQUE INDEX idx_idempotency_key_endpoint (idempotency_key, endpoint),
    INDEX idx_idempotency_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--rollback DROP TABLE IF EXISTS idempotency_keys;

--changeset snackbar:036-create-idempotency-cleanup-event
--comment: Cria evento para limpeza automática de chaves expiradas
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE() AND EVENT_NAME = 'cleanup_expired_idempotency_keys'

CREATE EVENT IF NOT EXISTS cleanup_expired_idempotency_keys
ON SCHEDULE EVERY 1 HOUR
DO
    DELETE FROM idempotency_keys WHERE expires_at < NOW();

--rollback DROP EVENT IF EXISTS cleanup_expired_idempotency_keys;
