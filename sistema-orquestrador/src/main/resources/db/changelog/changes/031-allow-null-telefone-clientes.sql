--liquibase formatted sql

--changeset snackbar:031-allow-null-telefone-clientes
--comment: Permite telefone nulo na tabela clientes para suportar login via Google OAuth

-- Alterar coluna telefone para aceitar NULL
-- Necessário porque login via Google não fornece telefone
ALTER TABLE clientes MODIFY COLUMN telefone VARCHAR(20) NULL;
