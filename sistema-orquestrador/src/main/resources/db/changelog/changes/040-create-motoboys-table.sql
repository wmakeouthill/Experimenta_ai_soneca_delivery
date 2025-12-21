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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índice para busca por telefone (único)
CREATE UNIQUE INDEX idx_motoboys_telefone ON motoboys(telefone);

-- Índice para busca por status ativo
CREATE INDEX idx_motoboys_ativo ON motoboys(ativo);
