-- Script para corrigir problemas de checksum do Liquibase
-- Execute este script no banco de dados antes de iniciar a aplicação

-- 1. Limpa TODOS os checksums para forçar recálculo
UPDATE databasechangelog SET md5sum = NULL;

-- 2. Corrige o tipo da coluna mesa_id (criada como CHAR mas deve ser VARCHAR)
ALTER TABLE pedidos MODIFY COLUMN mesa_id VARCHAR(36) NULL;

-- Pronto! Execute a aplicação novamente.
