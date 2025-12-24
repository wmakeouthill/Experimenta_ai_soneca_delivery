-- Script SQL para criar/configurar usuários no Cloud SQL
-- Execute este script no Cloud SQL Console (SQL Editor)
-- ou conectando via Cloud Shell

-- ========================================
-- 1. Verificar bancos existentes
-- ========================================
SHOW DATABASES;

-- ========================================
-- 2. Criar banco se não existir
-- ========================================
CREATE DATABASE IF NOT EXISTS experimentaai_delivery 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- ========================================
-- 3. Verificar usuários existentes
-- ========================================
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'WESLEY');

-- ========================================
-- 4. Criar/Atualizar usuário root
-- ========================================
-- Remover usuário antigo se existir apenas para localhost
DROP USER IF EXISTS 'root'@'localhost';

-- Criar usuário root que aceita conexões de qualquer host
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'SUA_SENHA_AQUI';

-- Dar permissões no banco experimentaai_delivery
GRANT ALL PRIVILEGES ON experimentaai_delivery.* TO 'root'@'%';

-- Dar permissões globais (se necessário)
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

-- ========================================
-- 5. Criar/Atualizar usuário WESLEY
-- ========================================
-- Remover usuário antigo se existir apenas para localhost
DROP USER IF EXISTS 'WESLEY'@'localhost';

-- Criar usuário WESLEY que aceita conexões de qualquer host
CREATE USER IF NOT EXISTS 'WESLEY'@'%' IDENTIFIED BY 'SUA_SENHA_AQUI';

-- Dar permissões no banco experimentaai_delivery
GRANT ALL PRIVILEGES ON experimentaai_delivery.* TO 'WESLEY'@'%';

-- ========================================
-- 6. Aplicar mudanças
-- ========================================
FLUSH PRIVILEGES;

-- ========================================
-- 7. Verificar se funcionou
-- ========================================
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'WESLEY');
SHOW GRANTS FOR 'root'@'%';
SHOW GRANTS FOR 'WESLEY'@'%';

-- ========================================
-- IMPORTANTE:
-- ========================================
-- 1. Substitua 'SUA_SENHA_AQUI' pela senha real
-- 2. A senha deve ser a mesma que está no Secret Manager
-- 3. Execute este script no Cloud SQL Console

