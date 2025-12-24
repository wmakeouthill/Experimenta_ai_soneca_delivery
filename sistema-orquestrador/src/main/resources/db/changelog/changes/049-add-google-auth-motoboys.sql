--liquibase formatted sql

--changeset snackbar:049-add-google-auth-motoboys
--comment: Adiciona campos de autenticação Google OAuth na tabela motoboys (google_id, email, foto_url, apelido, ultimo_login) e torna telefone nullable

-- Adiciona coluna apelido (nome exibido, editável pelo admin)
ALTER TABLE motoboys 
ADD COLUMN apelido VARCHAR(200) NULL AFTER nome;

-- Adiciona coluna google_id (único)
ALTER TABLE motoboys 
ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER placa;

-- Adiciona coluna email (único)
ALTER TABLE motoboys 
ADD COLUMN email VARCHAR(255) NULL UNIQUE AFTER google_id;

-- Adiciona coluna foto_url
ALTER TABLE motoboys 
ADD COLUMN foto_url VARCHAR(500) NULL AFTER email;

-- Adiciona coluna ultimo_login
ALTER TABLE motoboys 
ADD COLUMN ultimo_login DATETIME NULL AFTER foto_url;

-- Remove constraint UNIQUE do telefone e torna nullable (permite cadastro via Google sem telefone)
ALTER TABLE motoboys 
DROP INDEX idx_motoboys_telefone;

ALTER TABLE motoboys 
MODIFY COLUMN telefone VARCHAR(20) NULL;

-- Adiciona índices para melhorar performance de buscas
CREATE INDEX idx_motoboys_google_id ON motoboys(google_id);
CREATE INDEX idx_motoboys_email ON motoboys(email);

