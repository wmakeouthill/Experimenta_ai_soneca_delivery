-- ============================================================
-- Script: Backup de Catálogo, Clientes e Usuários Admin/Operador
-- Descrição: Cria backup das tabelas de catálogo (produtos/categorias),
--            clientes e usuários com roles ADMINISTRADOR ou OPERADOR
-- ============================================================
-- 
-- IMPORTANTE: 
-- - Este script cria tabelas temporárias de backup com prefixo "backup_"
-- - As tabelas de backup são criadas no mesmo banco de dados
-- - Para restaurar, use o script: restaurar-backup-catalogo-clientes-usuarios.sql
-- - Execute ANTES de fazer limpeza completa do banco
--
-- Como executar no IntelliJ:
-- 1. Abra o Data Source configurado no IntelliJ
-- 2. Clique com botão direito no banco de dados
-- 3. Selecione "New" > "Query Console" ou abra este arquivo
-- 4. Execute o script selecionando todo o conteúdo (Ctrl+A) e depois (Ctrl+Enter)
-- ============================================================

-- ============================================================
-- VERIFICAÇÃO PRÉ-BACKUP
-- ============================================================

-- Verificar quantos registros serão copiados
SELECT 
    '=== CONTAGEM DE DADOS PARA BACKUP ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM usuarios WHERE role IN ('ADMINISTRADOR', 'OPERADOR')), 0) AS total_usuarios_admin_operador;

-- ============================================================
-- INÍCIO DO BACKUP
-- ============================================================
-- ATENÇÃO: Este script cria tabelas temporárias de backup
-- ============================================================

START TRANSACTION;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. BACKUP DE CATEGORIAS
-- ============================================================

-- Remover tabela de backup anterior se existir
DROP TABLE IF EXISTS backup_categorias;

-- Criar tabela de backup de categorias
CREATE TABLE backup_categorias AS
SELECT * FROM categorias;

-- Verificar backup de categorias
SELECT 
    '=== BACKUP DE CATEGORIAS CRIADO ===' AS status,
    COUNT(*) AS total_registros_backup
FROM backup_categorias;

-- ============================================================
-- 2. BACKUP DE PRODUTOS
-- ============================================================

-- Remover tabela de backup anterior se existir
DROP TABLE IF EXISTS backup_produtos;

-- Criar tabela de backup de produtos
CREATE TABLE backup_produtos AS
SELECT * FROM produtos;

-- Verificar backup de produtos
SELECT 
    '=== BACKUP DE PRODUTOS CRIADO ===' AS status,
    COUNT(*) AS total_registros_backup
FROM backup_produtos;

-- ============================================================
-- 3. BACKUP DE CLIENTES
-- ============================================================

-- Remover tabela de backup anterior se existir
DROP TABLE IF EXISTS backup_clientes;

-- Criar tabela de backup de clientes
CREATE TABLE backup_clientes AS
SELECT * FROM clientes;

-- Verificar backup de clientes
SELECT 
    '=== BACKUP DE CLIENTES CRIADO ===' AS status,
    COUNT(*) AS total_registros_backup
FROM backup_clientes;

-- ============================================================
-- 4. BACKUP DE USUÁRIOS ADMIN/OPERADOR
-- ============================================================

-- Remover tabela de backup anterior se existir
DROP TABLE IF EXISTS backup_usuarios;

-- Criar tabela de backup de usuários (apenas ADMINISTRADOR e OPERADOR)
CREATE TABLE backup_usuarios AS
SELECT * FROM usuarios
WHERE role IN ('ADMINISTRADOR', 'OPERADOR');

-- Verificar backup de usuários
SELECT 
    '=== BACKUP DE USUÁRIOS ADMIN/OPERADOR CRIADO ===' AS status,
    COUNT(*) AS total_registros_backup,
    SUM(CASE WHEN role = 'ADMINISTRADOR' THEN 1 ELSE 0 END) AS total_administradores,
    SUM(CASE WHEN role = 'OPERADOR' THEN 1 ELSE 0 END) AS total_operadores
FROM backup_usuarios;

-- ============================================================
-- REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- COMMIT DA TRANSAÇÃO
-- ============================================================
COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-BACKUP
-- ============================================================

-- Listar todas as tabelas de backup criadas
SELECT 
    '=== TABELAS DE BACKUP CRIADAS ===' AS informacao,
    TABLE_NAME AS tabela_backup,
    TABLE_ROWS AS total_registros
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME LIKE 'backup_%'
ORDER BY TABLE_NAME;

-- Resumo final do backup
SELECT 
    '=== RESUMO DO BACKUP ===' AS informacao,
    (SELECT COUNT(*) FROM backup_categorias) AS categorias_backup,
    (SELECT COUNT(*) FROM backup_produtos) AS produtos_backup,
    (SELECT COUNT(*) FROM backup_clientes) AS clientes_backup,
    (SELECT COUNT(*) FROM backup_usuarios) AS usuarios_backup;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================
SELECT '=== BACKUP CONCLUÍDO COM SUCESSO! ===' AS status;
SELECT '=== Para restaurar, use o script: restaurar-backup-catalogo-clientes-usuarios.sql ===' AS informacao;

