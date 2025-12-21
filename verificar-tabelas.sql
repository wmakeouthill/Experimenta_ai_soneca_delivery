-- Script para verificar se o Liquibase criou as tabelas
-- Execute: mysql -u root -p EXPERIMENTA_AI_DB < verificar-tabelas.sql

USE EXPERIMENTA_AI_DB;

-- Verificar se o banco existe
SELECT 'Banco de dados EXPERIMENTA_AI_DB existe' AS status;

-- Listar todas as tabelas
SHOW TABLES;

-- Verificar tabela de categorias
SELECT 
    'Tabela categorias' AS tabela,
    COUNT(*) AS total_registros,
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'EXPERIMENTA_AI_DB' 
  AND TABLE_NAME = 'categorias'
GROUP BY TABLE_NAME, TABLE_ROWS, CREATE_TIME;

-- Verificar estrutura da tabela categorias
DESCRIBE categorias;

-- Verificar tabela de produtos
SELECT 
    'Tabela produtos' AS tabela,
    COUNT(*) AS total_registros,
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'EXPERIMENTA_AI_DB' 
  AND TABLE_NAME = 'produtos'
GROUP BY TABLE_NAME, TABLE_ROWS, CREATE_TIME;

-- Verificar estrutura da tabela produtos
DESCRIBE produtos;

-- Verificar tabela de controle do Liquibase
SELECT 
    'Tabela DATABASECHANGELOG' AS tabela,
    COUNT(*) AS total_migrations
FROM DATABASECHANGELOG;

-- Listar todas as migrations aplicadas
SELECT 
    ID,
    AUTHOR,
    FILENAME,
    DATEEXECUTED,
    ORDEREXECUTED,
    EXECTYPE,
    MD5SUM
FROM DATABASECHANGELOG
ORDER BY DATEEXECUTED DESC;

-- Verificar se há registros nas tabelas
SELECT 'Categorias' AS tabela, COUNT(*) AS total FROM categorias
UNION ALL
SELECT 'Produtos' AS tabela, COUNT(*) AS total FROM produtos;

