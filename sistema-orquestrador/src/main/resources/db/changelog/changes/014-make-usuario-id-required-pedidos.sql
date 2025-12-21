--liquibase formatted sql

--changeset snackbar:014-make-usuario-id-required-pedidos
--comment: Migration: Torna a coluna usuario_id obrigatória na tabela pedidos

-- Primeiro, atualiza pedidos sem usuario_id com o primeiro usuário ADMINISTRADOR encontrado
-- (ou o primeiro usuário disponível se não houver ADMINISTRADOR)
UPDATE pedidos p
SET p.usuario_id = (
    SELECT u.id 
    FROM usuarios u 
    WHERE u.role = 'ADMINISTRADOR' 
    ORDER BY u.created_at ASC 
    LIMIT 1
)
WHERE p.usuario_id IS NULL 
AND EXISTS (SELECT 1 FROM usuarios WHERE role = 'ADMINISTRADOR');

-- Se ainda houver pedidos sem usuario_id, atualiza com o primeiro usuário disponível
UPDATE pedidos p
SET p.usuario_id = (
    SELECT u.id 
    FROM usuarios u 
    ORDER BY u.created_at ASC 
    LIMIT 1
)
WHERE p.usuario_id IS NULL 
AND EXISTS (SELECT 1 FROM usuarios);

-- Verifica se ainda há pedidos sem usuario_id (se houver, a migração falhará)
-- Isso garante que não haverá pedidos órfãos sem usuário associado

-- Agora torna a coluna obrigatória
ALTER TABLE pedidos 
MODIFY COLUMN usuario_id VARCHAR(36) NOT NULL;

--changeset snackbar:014-add-fk-usuario-pedidos
--comment: Adiciona foreign key de usuario_id em pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND constraint_name = 'fk_pedidos_usuario_id'

-- Adiciona foreign key para garantir integridade referencial
ALTER TABLE pedidos
ADD CONSTRAINT fk_pedidos_usuario_id 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;

--rollback ALTER TABLE pedidos DROP FOREIGN KEY fk_pedidos_usuario_id, MODIFY COLUMN usuario_id VARCHAR(36) NULL;

