--liquibase formatted sql

--changeset snackbar:040-create-motoboys-table
--comment: Criação da tabela de motoboys para delivery
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'motoboys'

CREATE TABLE motoboys (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    veiculo VARCHAR(100),
    placa VARCHAR(10),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_motoboys_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--changeset snackbar:040-add-idx-motoboys-telefone
--comment: Adiciona índice único para telefone de motoboys
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'motoboys' AND index_name = 'idx_motoboys_telefone'
CREATE UNIQUE INDEX idx_motoboys_telefone ON motoboys(telefone);
