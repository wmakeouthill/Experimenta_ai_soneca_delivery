--liquibase formatted sql

--changeset snackbar:007-alter-foto-column-produtos-longtext
--comment: Altera coluna foto de TEXT para LONGTEXT para suportar imagens base64 maiores

-- Altera a coluna foto de TEXT para LONGTEXT
-- TEXT suporta até 65.535 bytes (64KB), LONGTEXT suporta até 4GB
-- Isso é necessário para armazenar imagens em base64 que podem ser muito grandes
ALTER TABLE produtos 
MODIFY COLUMN foto LONGTEXT NULL COMMENT 'Base64 string da imagem do produto';

