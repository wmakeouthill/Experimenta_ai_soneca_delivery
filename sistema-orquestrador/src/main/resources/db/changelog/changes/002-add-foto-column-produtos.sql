--liquibase formatted sql

--changeset snackbar:002-add-foto-column-produtos
--comment: Adiciona coluna foto na tabela produtos para armazenar imagem em base64
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'produtos' AND column_name = 'foto'

-- Adiciona coluna foto para armazenar imagem em base64
ALTER TABLE produtos 
ADD COLUMN foto TEXT NULL COMMENT 'Base64 string da imagem do produto' 
AFTER disponivel;

