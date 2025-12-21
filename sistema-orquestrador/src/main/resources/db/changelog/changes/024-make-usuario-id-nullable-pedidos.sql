--liquibase formatted sql

--changeset snackbar:024-make-usuario-id-nullable-pedidos
--comment: Permite usuario_id nulo em pedidos para suportar pedidos via mesa (QR code)

-- Pedidos feitos via QR code da mesa não têm um usuário operador associado.
-- O cliente faz o pedido diretamente pelo celular, sem intermediação de funcionário.

-- Remove a foreign key constraint se existir
SET @fk_name = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'pedidos' 
                AND COLUMN_NAME = 'usuario_id'
                AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);

SET @sql = IF(@fk_name IS NOT NULL, 
              CONCAT('ALTER TABLE pedidos DROP FOREIGN KEY ', @fk_name), 
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Altera a coluna para permitir NULL
ALTER TABLE pedidos MODIFY COLUMN usuario_id VARCHAR(36) NULL;

-- Recria a foreign key permitindo NULL (ON DELETE SET NULL)
ALTER TABLE pedidos 
ADD CONSTRAINT fk_pedidos_usuario_id 
FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
ON DELETE SET NULL;

--rollback ALTER TABLE pedidos DROP FOREIGN KEY fk_pedidos_usuario_id;
--rollback ALTER TABLE pedidos MODIFY COLUMN usuario_id VARCHAR(36) NOT NULL;
--rollback ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_usuario_id FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
