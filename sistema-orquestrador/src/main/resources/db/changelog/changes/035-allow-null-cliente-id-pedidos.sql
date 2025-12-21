--liquibase formatted sql

--changeset snackbar:035-allow-null-cliente-id-pedidos
--comment: Permite cliente_id nulo para pedidos de auto-atendimento (totem)

-- Pedidos feitos via totem de auto-atendimento não têm um cliente cadastrado.
-- O cliente informa apenas o nome para chamada na tela, sem necessidade de cadastro.

-- Remove a foreign key constraint se existir
SET @fk_name = (SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'pedidos' 
                AND COLUMN_NAME = 'cliente_id'
                AND REFERENCED_TABLE_NAME IS NOT NULL
                LIMIT 1);

SET @sql = IF(@fk_name IS NOT NULL, 
              CONCAT('ALTER TABLE pedidos DROP FOREIGN KEY ', @fk_name), 
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Altera a coluna para permitir NULL
ALTER TABLE pedidos MODIFY COLUMN cliente_id VARCHAR(36) NULL;

-- Recria a foreign key permitindo NULL (ON DELETE SET NULL)
ALTER TABLE pedidos 
ADD CONSTRAINT fk_pedidos_cliente_id 
FOREIGN KEY (cliente_id) REFERENCES clientes(id) 
ON DELETE SET NULL;
