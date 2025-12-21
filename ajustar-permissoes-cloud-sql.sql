-- Script SQL para AJUSTAR PERMISSÕES no Cloud SQL
-- IMPORTANTE: Este script assume que o usuário já existe
-- Para criar usuários, use o Console do Cloud SQL
-- 
-- Execute este script no Cloud SQL Console (SQL Editor)

-- ========================================
-- 1. Verificar banco snackbar_db existe
-- ========================================
SHOW DATABASES LIKE 'snackbar_db';

-- Se não existir, criar (isso geralmente funciona)
CREATE DATABASE IF NOT EXISTS snackbar_db 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

-- ========================================
-- 2. Verificar usuários existentes
-- ========================================
SELECT User, Host FROM mysql.user WHERE User IN ('root', 'WESLEY');

-- ========================================
-- 3. Dar permissões (sem criar usuário)
-- ========================================
-- Isso só funciona se o usuário já existir

-- Permissões para root (qualquer host)
GRANT ALL PRIVILEGES ON snackbar_db.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- Se usar WESLEY também
GRANT ALL PRIVILEGES ON snackbar_db.* TO 'WESLEY'@'%';
FLUSH PRIVILEGES;

-- ========================================
-- 4. Verificar permissões
-- ========================================
SHOW GRANTS FOR 'root'@'%';
-- Se aparecer erro "There is no such grant", o usuário não existe com esse host

-- ========================================
-- NOTA IMPORTANTE:
-- ========================================
-- Se os comandos GRANT falharem com erro de usuário não existir,
-- você DEVE criar o usuário via Console do Cloud SQL:
-- 
-- 1. Acesse: https://console.cloud.google.com/sql/instances
-- 2. Clique na instância
-- 3. Vá em "Usuários" (Users)
-- 4. Clique em "Adicionar conta de usuário" ou edite o existente
-- 5. Configure o usuário e senha
-- 6. NÃO marque "Permitir apenas conexões de autorização do IAM"
-- 
-- Depois volte e execute este script novamente para dar permissões.

