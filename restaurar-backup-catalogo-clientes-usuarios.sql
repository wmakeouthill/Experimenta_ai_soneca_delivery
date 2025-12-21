-- ============================================================
-- Script: Restaurar Backup de Catálogo, Clientes e Usuários
-- Descrição: Restaura dados das tabelas de backup criadas pelo
--            script backup-catalogo-clientes-usuarios.sql
-- ============================================================
-- 
-- IMPORTANTE: 
-- - Este script restaura dados das tabelas de backup (backup_*)
-- - As tabelas de destino devem estar vazias ou os dados serão duplicados
-- - Execute APÓS fazer limpeza do banco (se necessário)
-- - Verifica se as tabelas de backup existem antes de restaurar
--
-- Como executar no IntelliJ:
-- 1. Abra o Data Source configurado no IntelliJ
-- 2. Clique com botão direito no banco de dados
-- 3. Selecione "New" > "Query Console" ou abra este arquivo
-- 4. Execute o script selecionando todo o conteúdo (Ctrl+A) e depois (Ctrl+Enter)
-- ============================================================

-- ============================================================
-- VERIFICAÇÃO PRÉ-RESTAURAÇÃO
-- ============================================================

-- Verificar se as tabelas de backup existem
SELECT 
    '=== VERIFICAÇÃO DE TABELAS DE BACKUP ===' AS informacao,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'backup_categorias') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END AS backup_categorias,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'backup_produtos') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END AS backup_produtos,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'backup_clientes') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END AS backup_clientes,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'backup_usuarios') 
         THEN 'EXISTE' ELSE 'NÃO EXISTE' END AS backup_usuarios;

-- Verificar quantos registros existem nas tabelas de backup
SELECT 
    '=== CONTAGEM DE DADOS NO BACKUP ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM backup_categorias), 0) AS total_categorias_backup,
    IFNULL((SELECT COUNT(*) FROM backup_produtos), 0) AS total_produtos_backup,
    IFNULL((SELECT COUNT(*) FROM backup_clientes), 0) AS total_clientes_backup,
    IFNULL((SELECT COUNT(*) FROM backup_usuarios), 0) AS total_usuarios_backup;

-- Verificar estado atual das tabelas de destino
SELECT 
    '=== ESTADO ATUAL DAS TABELAS DE DESTINO ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias_atual,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos_atual,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes_atual,
    IFNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios_atual;

-- ============================================================
-- INÍCIO DA RESTAURAÇÃO
-- ============================================================
-- ATENÇÃO: Este script restaura dados das tabelas de backup
-- ============================================================

START TRANSACTION;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. RESTAURAR CATEGORIAS
-- ============================================================

-- Verificar se a tabela de backup existe
SET @backup_categorias_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'backup_categorias'
);

-- Restaurar categorias se o backup existir
SET @sql_categorias = IF(
    @backup_categorias_exists > 0,
    'INSERT INTO categorias SELECT * FROM backup_categorias',
    'SELECT "Tabela backup_categorias não encontrada" AS erro'
);

PREPARE stmt_categorias FROM @sql_categorias;
EXECUTE stmt_categorias;
DEALLOCATE PREPARE stmt_categorias;

-- Verificar restauração de categorias
SELECT 
    '=== CATEGORIAS RESTAURADAS ===' AS status,
    COUNT(*) AS total_registros_restaurados
FROM categorias;

-- ============================================================
-- 2. RESTAURAR PRODUTOS
-- ============================================================

-- Verificar se a tabela de backup existe
SET @backup_produtos_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'backup_produtos'
);

-- Restaurar produtos se o backup existir
SET @sql_produtos = IF(
    @backup_produtos_exists > 0,
    'INSERT INTO produtos SELECT * FROM backup_produtos',
    'SELECT "Tabela backup_produtos não encontrada" AS erro'
);

PREPARE stmt_produtos FROM @sql_produtos;
EXECUTE stmt_produtos;
DEALLOCATE PREPARE stmt_produtos;

-- Verificar restauração de produtos
SELECT 
    '=== PRODUTOS RESTAURADOS ===' AS status,
    COUNT(*) AS total_registros_restaurados
FROM produtos;

-- ============================================================
-- 3. RESTAURAR CLIENTES
-- ============================================================

-- Verificar se a tabela de backup existe
SET @backup_clientes_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'backup_clientes'
);

-- Restaurar clientes se o backup existir
SET @sql_clientes = IF(
    @backup_clientes_exists > 0,
    'INSERT INTO clientes SELECT * FROM backup_clientes',
    'SELECT "Tabela backup_clientes não encontrada" AS erro'
);

PREPARE stmt_clientes FROM @sql_clientes;
EXECUTE stmt_clientes;
DEALLOCATE PREPARE stmt_clientes;

-- Verificar restauração de clientes
SELECT 
    '=== CLIENTES RESTAURADOS ===' AS status,
    COUNT(*) AS total_registros_restaurados
FROM clientes;

-- ============================================================
-- 4. RESTAURAR USUÁRIOS ADMIN/OPERADOR
-- ============================================================

-- Verificar se a tabela de backup existe
SET @backup_usuarios_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'backup_usuarios'
);

-- Restaurar usuários se o backup existir
-- NOTA: Usa INSERT IGNORE para evitar erros de duplicação de email
SET @sql_usuarios = IF(
    @backup_usuarios_exists > 0,
    'INSERT IGNORE INTO usuarios SELECT * FROM backup_usuarios',
    'SELECT "Tabela backup_usuarios não encontrada" AS erro'
);

PREPARE stmt_usuarios FROM @sql_usuarios;
EXECUTE stmt_usuarios;
DEALLOCATE PREPARE stmt_usuarios;

-- Verificar restauração de usuários
SELECT 
    '=== USUÁRIOS ADMIN/OPERADOR RESTAURADOS ===' AS status,
    COUNT(*) AS total_registros_restaurados,
    SUM(CASE WHEN role = 'ADMINISTRADOR' THEN 1 ELSE 0 END) AS total_administradores,
    SUM(CASE WHEN role = 'OPERADOR' THEN 1 ELSE 0 END) AS total_operadores
FROM usuarios
WHERE role IN ('ADMINISTRADOR', 'OPERADOR');

-- ============================================================
-- REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- COMMIT DA TRANSAÇÃO
-- ============================================================
COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-RESTAURAÇÃO
-- ============================================================

-- Comparar dados restaurados com backup
SELECT 
    '=== COMPARAÇÃO: BACKUP vs RESTAURADO ===' AS informacao,
    (SELECT COUNT(*) FROM backup_categorias) AS categorias_backup,
    (SELECT COUNT(*) FROM categorias) AS categorias_restauradas,
    (SELECT COUNT(*) FROM backup_produtos) AS produtos_backup,
    (SELECT COUNT(*) FROM produtos) AS produtos_restaurados,
    (SELECT COUNT(*) FROM backup_clientes) AS clientes_backup,
    (SELECT COUNT(*) FROM clientes) AS clientes_restaurados,
    (SELECT COUNT(*) FROM backup_usuarios) AS usuarios_backup,
    (SELECT COUNT(*) FROM usuarios WHERE role IN ('ADMINISTRADOR', 'OPERADOR')) AS usuarios_restaurados;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================
SELECT '=== RESTAURAÇÃO CONCLUÍDA COM SUCESSO! ===' AS status;
SELECT '=== NOTA: As tabelas de backup (backup_*) foram preservadas. Você pode deletá-las manualmente se desejar. ===' AS informacao;

