-- liquibase formatted sql

-- changeset experimenta-ai:038-create-auditoria-pagamentos-table
-- comment: Criar tabela de auditoria para rastrear todas as operações de pagamento

CREATE TABLE auditoria_pagamentos (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- Identificação do pedido
    pedido_id VARCHAR(36) NOT NULL,
    numero_pedido VARCHAR(10) NOT NULL,
    
    -- Tipo de operação
    tipo_operacao VARCHAR(50) NOT NULL,
    
    -- Dados do pagamento
    meio_pagamento VARCHAR(50) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    valor_total_pedido DECIMAL(10, 2) NOT NULL,
    
    -- Status do pedido no momento da operação
    status_pedido VARCHAR(30) NOT NULL,
    
    -- Contexto da operação
    usuario_id VARCHAR(36),
    cliente_id VARCHAR(36),
    sessao_trabalho_id VARCHAR(36),
    
    -- Metadados de rastreabilidade
    ip_origem VARCHAR(45),
    user_agent VARCHAR(500),
    idempotency_key VARCHAR(100),
    
    -- Resultado da operação
    sucesso BOOLEAN NOT NULL DEFAULT TRUE,
    mensagem_erro TEXT,
    
    -- Timestamps
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para consulta
    INDEX idx_auditoria_pagamentos_pedido_id (pedido_id),
    INDEX idx_auditoria_pagamentos_numero_pedido (numero_pedido),
    INDEX idx_auditoria_pagamentos_tipo_operacao (tipo_operacao),
    INDEX idx_auditoria_pagamentos_data_hora (data_hora),
    INDEX idx_auditoria_pagamentos_usuario_id (usuario_id),
    INDEX idx_auditoria_pagamentos_sessao_id (sessao_trabalho_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentário da tabela
ALTER TABLE auditoria_pagamentos COMMENT 'Tabela de auditoria para rastrear todas as operações relacionadas a pagamentos de pedidos';

-- rollback DROP TABLE IF EXISTS auditoria_pagamentos;
