-- liquibase formatted sql

-- changeset experimenta-ai:039-fix-idempotency-keys-id-column
-- comment: Corrige o tipo da coluna id de VARCHAR para BIGINT AUTO_INCREMENT

-- Remove a tabela antiga e recria com o tipo correto
DROP TABLE IF EXISTS idempotency_keys;

CREATE TABLE idempotency_keys (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    idempotency_key VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    response_body TEXT,
    response_status INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    
    UNIQUE INDEX idx_idempotency_key_endpoint (idempotency_key, endpoint),
    INDEX idx_idempotency_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- rollback DROP TABLE IF EXISTS idempotency_keys;
