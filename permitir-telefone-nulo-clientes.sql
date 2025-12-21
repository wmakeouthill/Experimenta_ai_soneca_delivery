-- ============================================================
-- Script: Permitir telefone nulo na tabela clientes
-- Descrição: Altera a coluna telefone para aceitar valores nulos
--            Necessário para login via Google (não fornece telefone)
-- ============================================================
-- 
-- COMO EXECUTAR:
-- 1. Conecte ao banco de dados Cloud SQL
-- 2. Execute este script
-- ============================================================

-- Verificar estado atual da coluna
DESCRIBE clientes;

-- Alterar coluna para aceitar NULL
ALTER TABLE clientes MODIFY COLUMN telefone VARCHAR(20) NULL;

-- Verificar se a alteração foi aplicada
DESCRIBE clientes;

SELECT '=== COLUNA TELEFONE AGORA ACEITA NULL ===' AS status;
