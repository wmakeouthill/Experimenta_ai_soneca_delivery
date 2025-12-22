-- Script para limpar checksums das migrations de delivery que foram alteradas
-- Execute este script diretamente no MySQL antes de reiniciar o backend

UPDATE DATABASECHANGELOG 
SET MD5SUM = NULL 
WHERE ID IN ('044-2', '044-3', '044-5') 
AND FILENAME LIKE '%044-create-pedidos-delivery-tables.sql';

-- Verificar se foi atualizado
SELECT ID, FILENAME, MD5SUM FROM DATABASECHANGELOG WHERE FILENAME LIKE '%044%';
