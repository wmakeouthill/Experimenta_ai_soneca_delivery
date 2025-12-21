-- Script para limpar a tabela de clientes
-- ATENÇÃO: Este script remove TODOS os clientes do banco de dados!
-- Execute com cuidado em produção.

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Limpar tabelas relacionadas primeiro (se necessário)
-- DELETE FROM pedidos WHERE cliente_id IS NOT NULL;
-- DELETE FROM avaliacoes WHERE cliente_id IS NOT NULL;

-- Limpar tabela de clientes
DELETE FROM clientes;

-- Opcional: Resetar o auto_increment
ALTER TABLE clientes AUTO_INCREMENT = 1;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- Verificar resultado
SELECT COUNT(*) AS total_clientes FROM clientes;
