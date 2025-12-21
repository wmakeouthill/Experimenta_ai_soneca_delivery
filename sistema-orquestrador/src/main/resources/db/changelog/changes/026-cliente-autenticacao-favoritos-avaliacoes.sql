--liquibase formatted sql

--changeset snackbar:026-cliente-autenticacao-favoritos-avaliacoes
--comment: Adiciona campos de autenticação (senha, Google) e cria tabelas de favoritos e avaliações

-- ============================================
-- 1. ALTERAÇÕES NA TABELA DE CLIENTES
-- ============================================

-- Adiciona campo de senha (opcional - cliente pode ter conta sem senha se logou com Google)
ALTER TABLE clientes ADD COLUMN senha_hash VARCHAR(255) NULL;

-- Adiciona campo para ID do Google (OAuth)
ALTER TABLE clientes ADD COLUMN google_id VARCHAR(255) NULL;

-- Adiciona campo para foto de perfil (URL do Google ou upload)
ALTER TABLE clientes ADD COLUMN foto_url VARCHAR(500) NULL;

-- Adiciona campo para indicar se email foi verificado
ALTER TABLE clientes ADD COLUMN email_verificado BOOLEAN NOT NULL DEFAULT FALSE;

-- Adiciona campo para data do último login
ALTER TABLE clientes ADD COLUMN ultimo_login TIMESTAMP NULL;

-- Adiciona índice único para google_id (apenas um cliente por conta Google)
ALTER TABLE clientes ADD UNIQUE INDEX idx_clientes_google_id (google_id);

-- ============================================
-- 2. TABELA DE FAVORITOS
-- ============================================

CREATE TABLE cliente_favoritos (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(36) NOT NULL,
    produto_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_favoritos_cliente_id (cliente_id),
    INDEX idx_favoritos_produto_id (produto_id),
    
    -- Chave única para evitar duplicatas
    UNIQUE INDEX idx_favoritos_cliente_produto (cliente_id, produto_id),
    
    -- Foreign keys
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. TABELA DE AVALIAÇÕES
-- ============================================

CREATE TABLE cliente_avaliacoes (
    id VARCHAR(36) PRIMARY KEY,
    cliente_id VARCHAR(36) NOT NULL,
    produto_id VARCHAR(36) NOT NULL,
    pedido_id VARCHAR(36) NOT NULL,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_avaliacoes_cliente_id (cliente_id),
    INDEX idx_avaliacoes_produto_id (produto_id),
    INDEX idx_avaliacoes_pedido_id (pedido_id),
    INDEX idx_avaliacoes_nota (nota),
    
    -- Cliente só pode avaliar um produto uma vez por pedido
    UNIQUE INDEX idx_avaliacoes_cliente_produto_pedido (cliente_id, produto_id, pedido_id),
    
    -- Foreign keys
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. VIEW PARA PRODUTOS MAIS COMPRADOS POR CLIENTE
-- ============================================

CREATE OR REPLACE VIEW vw_cliente_produtos_mais_comprados AS
SELECT 
    ip.produto_id,
    p.cliente_id,
    COUNT(*) as quantidade_pedidos,
    SUM(ip.quantidade) as quantidade_total,
    MAX(p.data_pedido) as ultima_compra
FROM itens_pedido ip
INNER JOIN pedidos p ON ip.pedido_id = p.id
WHERE p.status IN ('ENTREGUE', 'PRONTO', 'PREPARANDO', 'PENDENTE')
GROUP BY ip.produto_id, p.cliente_id
ORDER BY quantidade_pedidos DESC;

-- ============================================
-- 5. VIEW PARA MÉDIA DE AVALIAÇÕES POR PRODUTO
-- ============================================

CREATE OR REPLACE VIEW vw_produto_avaliacoes AS
SELECT 
    produto_id,
    COUNT(*) as total_avaliacoes,
    AVG(nota) as media_nota,
    SUM(CASE WHEN nota = 5 THEN 1 ELSE 0 END) as notas_5,
    SUM(CASE WHEN nota = 4 THEN 1 ELSE 0 END) as notas_4,
    SUM(CASE WHEN nota = 3 THEN 1 ELSE 0 END) as notas_3,
    SUM(CASE WHEN nota = 2 THEN 1 ELSE 0 END) as notas_2,
    SUM(CASE WHEN nota = 1 THEN 1 ELSE 0 END) as notas_1
FROM cliente_avaliacoes
GROUP BY produto_id;

--rollback DROP VIEW IF EXISTS vw_produto_avaliacoes;
--rollback DROP VIEW IF EXISTS vw_cliente_produtos_mais_comprados;
--rollback DROP TABLE IF EXISTS cliente_avaliacoes;
--rollback DROP TABLE IF EXISTS cliente_favoritos;
--rollback ALTER TABLE clientes DROP INDEX idx_clientes_google_id;
--rollback ALTER TABLE clientes DROP COLUMN ultimo_login;
--rollback ALTER TABLE clientes DROP COLUMN email_verificado;
--rollback ALTER TABLE clientes DROP COLUMN foto_url;
--rollback ALTER TABLE clientes DROP COLUMN google_id;
--rollback ALTER TABLE clientes DROP COLUMN senha_hash;
