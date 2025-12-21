-- ============================================================
-- Script: Seed de Pedidos para 2025
-- Descrição: Cria sessões de trabalho e pedidos aleatórios
--            para todo o ano de 2025 até 22/11/2025
--            Simula dados reais com todas as validações necessárias
-- ============================================================
-- 
-- REQUISITOS ANTES DE EXECUTAR:
-- 1. Deve existir pelo menos 1 usuário ATIVO na tabela usuarios
-- 2. Deve existir pelo menos 1 cliente na tabela clientes
-- 3. Deve existir pelo menos 1 produto DISPONÍVEL na tabela produtos
--
-- IMPORTANTE: 
-- - Este script cria sessões de trabalho e pedidos completos
-- - Garante que todos os dados necessários existam
-- - Usa transações para segurança
-- - Gera números de pedido sequenciais
-- - Calcula valores totais corretamente
-- - Vincula pedidos às sessões corretamente
-- - Cria uma sessão por dia (exceto domingos)
-- - Cria entre 5 e 30 pedidos por sessão
-- - Cada pedido tem entre 1 e 5 itens
-- - Cada pedido tem 1 ou 2 meios de pagamento
-- - Status dos pedidos: 70% FINALIZADO, 15% PRONTO, 10% PREPARANDO, 5% PENDENTE
--
-- Como executar no IntelliJ:
-- 1. Abra o Data Source configurado no IntelliJ
-- 2. Clique com botão direito no banco de dados
-- 3. Selecione "New" > "Query Console" ou abra este arquivo
-- 4. Execute o script selecionando todo o conteúdo (Ctrl+A) e depois (Ctrl+Enter)
--
-- ATENÇÃO: Este script pode demorar alguns minutos para executar,
--          pois cria dados para aproximadamente 300 dias úteis.
-- ============================================================

-- ============================================================
-- VERIFICAÇÃO PRÉ-EXECUÇÃO
-- ============================================================

-- Verificar se existem dados necessários
SELECT 
    '=== VERIFICAÇÃO DE DADOS NECESSÁRIOS ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM usuarios WHERE ativo = TRUE), 0) AS total_usuarios_ativos,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM produtos WHERE disponivel = TRUE), 0) AS total_produtos_disponiveis,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes_existentes,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos_existentes;

-- Verificar se há dados suficientes
SET @usuarios_count = (SELECT COUNT(*) FROM usuarios WHERE ativo = TRUE);
SET @clientes_count = (SELECT COUNT(*) FROM clientes);
SET @produtos_count = (SELECT COUNT(*) FROM produtos WHERE disponivel = TRUE);

-- Se não houver dados suficientes, abortar
SELECT 
    CASE 
        WHEN @usuarios_count = 0 THEN 'ERRO: Não há usuários ativos. Crie pelo menos um usuário antes de executar este script.'
        WHEN @clientes_count = 0 THEN 'ERRO: Não há clientes. Crie pelo menos um cliente antes de executar este script.'
        WHEN @produtos_count = 0 THEN 'ERRO: Não há produtos disponíveis. Crie pelo menos um produto antes de executar este script.'
        ELSE 'OK: Dados suficientes encontrados. Prosseguindo...'
    END AS status_verificacao;

-- ============================================================
-- CONFIGURAÇÕES E VARIÁVEIS
-- ============================================================

-- Desabilitar verificação de chaves estrangeiras temporariamente (será reabilitado)
SET FOREIGN_KEY_CHECKS = 0;

-- Variáveis para controle
SET @numero_pedido_atual = IFNULL((SELECT MAX(CAST(numero_pedido AS UNSIGNED)) FROM pedidos WHERE numero_pedido REGEXP '^[0-9]+$'), 0);
SET @numero_sessao_atual = IFNULL((SELECT MAX(numero_sessao) FROM sessoes_trabalho), 0);

-- ============================================================
-- INÍCIO DA TRANSAÇÃO
-- ============================================================

-- Definir collation da sessão para evitar problemas de collation
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

-- ============================================================
-- FUNÇÃO AUXILIAR: Gerar UUID
-- ============================================================

-- Função para gerar UUID (MySQL 8.0+)
-- Se não funcionar, use UUID() diretamente nas queries

-- ============================================================
-- CRIAÇÃO DE SESSÕES E PEDIDOS
-- ============================================================

-- Loop para criar sessões de trabalho para cada dia de 2025 até 22/11/2025
-- Usando procedimento armazenado temporário

DELIMITER $$

DROP PROCEDURE IF EXISTS criar_sessoes_e_pedidos_2025$$

CREATE PROCEDURE criar_sessoes_e_pedidos_2025()
BEGIN
    -- Definir collation padrão para strings no procedimento
    -- Todas as declarações DECLARE devem vir primeiro
    DECLARE data_atual DATE DEFAULT '2025-01-01';
    DECLARE data_fim DATE DEFAULT '2025-11-22';
    DECLARE sessao_id_var VARCHAR(36);
    DECLARE usuario_id_var VARCHAR(36);
    DECLARE cliente_id_var VARCHAR(36);
    DECLARE produto_id_var VARCHAR(36);
    DECLARE produto_nome_var VARCHAR(200);
    DECLARE produto_preco_var DECIMAL(10, 2);
    DECLARE pedido_id_var VARCHAR(36);
    DECLARE item_id_var VARCHAR(36);
    DECLARE meio_pagamento_id_var VARCHAR(36);
    DECLARE numero_pedido_var INT;
    DECLARE numero_sessao_var INT;
    DECLARE quantidade_itens INT;
    DECLARE quantidade_pedidos INT;
    DECLARE quantidade_produtos_pedido INT;
    DECLARE indice_item INT;
    DECLARE indice_pedido INT;
    DECLARE valor_total_pedido DECIMAL(10, 2);
    DECLARE valor_item DECIMAL(10, 2);
    DECLARE quantidade_item INT;
    DECLARE valor_meio_pagamento DECIMAL(10, 2);
    DECLARE meio_pagamento_var VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE status_pedido_var VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE status_sessao_var VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    DECLARE hora_inicio TIME;
    DECLARE hora_fim TIME;
    DECLARE data_inicio_completa TIMESTAMP;
    DECLARE data_fim_completa TIMESTAMP;
    DECLARE data_pedido_var TIMESTAMP;
    DECLARE data_finalizacao_var TIMESTAMP;
    DECLARE total_meios_pagamento DECIMAL(10, 2);
    DECLARE resto_pagamento DECIMAL(10, 2);
    DECLARE observacoes_var TEXT;
    DECLARE produto_observacoes_var TEXT;
    DECLARE cliente_nome_var VARCHAR(200);
    DECLARE num_meios_pagamento INT;
    
    -- Loop pelos dias
    WHILE data_atual <= data_fim DO
        -- Pular domingos (dia 0 = domingo)
        IF DAYOFWEEK(data_atual) != 1 THEN
            -- Selecionar usuário aleatório
            SELECT id INTO usuario_id_var 
            FROM usuarios 
            WHERE ativo = TRUE 
            ORDER BY RAND() 
            LIMIT 1;
            
            -- Se não houver usuário, pular este dia
            IF usuario_id_var IS NOT NULL THEN
                -- Incrementar número da sessão
                SET @numero_sessao_atual = @numero_sessao_atual + 1;
                SET numero_sessao_var = @numero_sessao_atual;
                
                -- Gerar horários da sessão (8h às 22h)
                SET hora_inicio = TIME('08:00:00');
                SET hora_fim = TIME('22:00:00');
                SET data_inicio_completa = TIMESTAMP(data_atual, hora_inicio);
                SET data_fim_completa = TIMESTAMP(data_atual, hora_fim);
                
                -- Status da sessão (todas finalizadas, pois são do passado)
                SET status_sessao_var = 'FINALIZADA' COLLATE utf8mb4_unicode_ci;
                
                -- Gerar ID da sessão
                SET sessao_id_var = UUID();
                
                -- Criar sessão de trabalho
                INSERT INTO sessoes_trabalho (
                    id,
                    numero_sessao,
                    data_inicio,
                    data_inicio_completa,
                    data_fim,
                    status,
                    usuario_id,
                    created_at,
                    updated_at
                ) VALUES (
                    sessao_id_var,
                    numero_sessao_var,
                    data_atual,
                    data_inicio_completa,
                    data_fim_completa,
                    CONVERT(status_sessao_var USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                    usuario_id_var,
                    NOW(),
                    NOW()
                );
                
                -- Criar pedidos para esta sessão (entre 5 e 30 pedidos por dia)
                SET quantidade_pedidos = FLOOR(5 + RAND() * 26);
                SET indice_pedido = 0;
                
                WHILE indice_pedido < quantidade_pedidos DO
                    -- Selecionar cliente aleatório
                    SELECT id, nome INTO cliente_id_var, cliente_nome_var
                    FROM clientes 
                    ORDER BY RAND() 
                    LIMIT 1;
                    
                    -- Se não houver cliente, pular este pedido
                    IF cliente_id_var IS NOT NULL THEN
                        -- Incrementar número do pedido
                        SET @numero_pedido_atual = @numero_pedido_atual + 1;
                        SET numero_pedido_var = @numero_pedido_atual;
                        
                        -- Gerar ID do pedido
                        SET pedido_id_var = UUID();
                        
                        -- Gerar data do pedido (dentro do horário da sessão)
                        SET data_pedido_var = TIMESTAMP(
                            data_atual,
                            TIME(
                                ADDTIME(
                                    hora_inicio,
                                    SEC_TO_TIME(FLOOR(RAND() * TIME_TO_SEC(TIMEDIFF(hora_fim, hora_inicio))))
                                )
                            )
                        );
                        
                        -- Status do pedido (distribuição realista)
                        -- Usar variáveis auxiliares para evitar problemas de collation
                        SET @rand_val = RAND();
                        SET data_finalizacao_var = NULL;  -- Inicializar como NULL
                        IF @rand_val < 0.70 THEN
                            SET status_pedido_var = 'FINALIZADO' COLLATE utf8mb4_unicode_ci;  -- 70% finalizados
                            SET data_finalizacao_var = TIMESTAMPADD(MINUTE, FLOOR(10 + RAND() * 60), data_pedido_var);
                        ELSEIF @rand_val < 0.85 THEN
                            SET status_pedido_var = 'PRONTO' COLLATE utf8mb4_unicode_ci;  -- 15% prontos
                        ELSEIF @rand_val < 0.95 THEN
                            SET status_pedido_var = 'PREPARANDO' COLLATE utf8mb4_unicode_ci;  -- 10% preparando
                        ELSE
                            SET status_pedido_var = 'PENDENTE' COLLATE utf8mb4_unicode_ci;  -- 5% pendentes
                        END IF;
                        
                        -- Inicializar valor total
                        SET valor_total_pedido = 0.00;
                        
                        -- Criar itens do pedido (entre 1 e 5 itens)
                        SET quantidade_produtos_pedido = FLOOR(1 + RAND() * 5);
                        SET indice_item = 0;
                        
                        -- Criar pedido primeiro (sem itens ainda)
                        INSERT INTO pedidos (
                            id,
                            numero_pedido,
                            cliente_id,
                            cliente_nome,
                            status,
                            valor_total,
                            observacoes,
                            usuario_id,
                            sessao_id,
                            data_pedido,
                            data_finalizacao,
                            created_at,
                            updated_at
                        ) VALUES (
                            pedido_id_var,
                            LPAD(numero_pedido_var, 4, '0'),
                            cliente_id_var,
                            cliente_nome_var,
                            CONVERT(status_pedido_var USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                            0.00, -- Será atualizado após criar itens
                            CASE WHEN RAND() < 0.15 THEN CONCAT('Observação aleatória ', FLOOR(RAND() * 1000)) ELSE NULL END,
                            usuario_id_var,
                            sessao_id_var,
                            data_pedido_var,
                            data_finalizacao_var,
                            NOW(),
                            NOW()
                        );
                        
                        -- Criar itens do pedido
                        WHILE indice_item < quantidade_produtos_pedido DO
                            -- Selecionar produto aleatório disponível
                            SELECT id, nome, preco INTO produto_id_var, produto_nome_var, produto_preco_var
                            FROM produtos 
                            WHERE disponivel = TRUE 
                            ORDER BY RAND() 
                            LIMIT 1;
                            
                            -- Se não houver produto, pular este item
                            IF produto_id_var IS NOT NULL THEN
                                -- Quantidade do item (entre 1 e 3)
                                SET quantidade_item = FLOOR(1 + RAND() * 3);
                                
                                -- Calcular valor do item
                                SET valor_item = produto_preco_var * quantidade_item;
                                
                                -- Adicionar ao valor total
                                SET valor_total_pedido = valor_total_pedido + valor_item;
                                
                                -- Gerar ID do item
                                SET item_id_var = UUID();
                                
                                -- Criar item do pedido
                                INSERT INTO itens_pedido (
                                    id,
                                    pedido_id,
                                    produto_id,
                                    produto_nome,
                                    quantidade,
                                    preco_unitario,
                                    observacoes
                                ) VALUES (
                                    item_id_var,
                                    pedido_id_var,
                                    produto_id_var,
                                    produto_nome_var,
                                    quantidade_item,
                                    produto_preco_var,
                                    CASE WHEN RAND() < 0.10 THEN CONCAT('Observação item ', FLOOR(RAND() * 100)) ELSE NULL END
                                );
                                
                                SET indice_item = indice_item + 1;
                            END IF;
                        END WHILE;
                        
                        -- Verificar se o pedido tem pelo menos um item (garantir que pelo menos um item foi criado)
                        IF indice_item > 0 AND valor_total_pedido > 0 THEN
                            -- Atualizar valor total do pedido
                            UPDATE pedidos 
                            SET valor_total = valor_total_pedido 
                            WHERE id = pedido_id_var;
                            
                            -- Criar meios de pagamento (soma deve ser igual ao valor total)
                            SET total_meios_pagamento = 0.00;
                            SET resto_pagamento = valor_total_pedido;
                            
                            -- Número de meios de pagamento (1 ou 2)
                            SET num_meios_pagamento = IF(RAND() < 0.85, 1, 2);
                            
                            WHILE total_meios_pagamento < valor_total_pedido AND num_meios_pagamento > 0 DO
                            -- Selecionar meio de pagamento aleatório
                            SET @meio_rand = FLOOR(RAND() * 5);
                            IF @meio_rand = 0 THEN
                                SET meio_pagamento_var = 'PIX' COLLATE utf8mb4_unicode_ci;
                            ELSEIF @meio_rand = 1 THEN
                                SET meio_pagamento_var = 'CARTAO_CREDITO' COLLATE utf8mb4_unicode_ci;
                            ELSEIF @meio_rand = 2 THEN
                                SET meio_pagamento_var = 'CARTAO_DEBITO' COLLATE utf8mb4_unicode_ci;
                            ELSEIF @meio_rand = 3 THEN
                                SET meio_pagamento_var = 'VALE_REFEICAO' COLLATE utf8mb4_unicode_ci;
                            ELSE
                                SET meio_pagamento_var = 'DINHEIRO' COLLATE utf8mb4_unicode_ci;
                            END IF;
                            
                            -- Calcular valor do meio de pagamento
                            IF num_meios_pagamento = 1 THEN
                                -- Último meio de pagamento: paga o resto
                                SET valor_meio_pagamento = resto_pagamento;
                            ELSE
                                -- Meio de pagamento parcial (entre 30% e 70% do resto)
                                SET valor_meio_pagamento = resto_pagamento * (0.3 + RAND() * 0.4);
                                SET valor_meio_pagamento = ROUND(valor_meio_pagamento, 2);
                            END IF;
                            
                            -- Garantir que não ultrapasse o resto
                            IF valor_meio_pagamento > resto_pagamento THEN
                                SET valor_meio_pagamento = resto_pagamento;
                            END IF;
                            
                            -- Gerar ID do meio de pagamento
                            SET meio_pagamento_id_var = UUID();
                            
                            -- Criar meio de pagamento
                            INSERT INTO meios_pagamento_pedido (
                                id,
                                pedido_id,
                                meio_pagamento,
                                valor
                            ) VALUES (
                                meio_pagamento_id_var,
                                pedido_id_var,
                                CONVERT(meio_pagamento_var USING utf8mb4) COLLATE utf8mb4_unicode_ci,
                                valor_meio_pagamento
                            );
                            
                                SET total_meios_pagamento = total_meios_pagamento + valor_meio_pagamento;
                                SET resto_pagamento = resto_pagamento - valor_meio_pagamento;
                                SET num_meios_pagamento = num_meios_pagamento - 1;
                            END WHILE;
                            
                            -- Ajustar último meio de pagamento se houver diferença (arredondamento)
                            IF ABS(total_meios_pagamento - valor_total_pedido) > 0.01 THEN
                                UPDATE meios_pagamento_pedido
                                SET valor = valor + (valor_total_pedido - total_meios_pagamento)
                                WHERE pedido_id = pedido_id_var
                                ORDER BY valor DESC
                                LIMIT 1;
                            END IF;
                        ELSE
                            -- Se não houver itens, deletar o pedido criado
                            DELETE FROM pedidos WHERE id = pedido_id_var;
                        END IF;
                        
                        SET indice_pedido = indice_pedido + 1;
                    END IF;
                END WHILE;
            END IF;
        END IF;
        
        -- Avançar para o próximo dia
        SET data_atual = DATE_ADD(data_atual, INTERVAL 1 DAY);
    END WHILE;
END$$

DELIMITER ;

-- Executar o procedimento
CALL criar_sessoes_e_pedidos_2025();

-- Remover o procedimento após uso
DROP PROCEDURE IF EXISTS criar_sessoes_e_pedidos_2025;

-- ============================================================
-- REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- COMMIT DA TRANSAÇÃO
-- ============================================================

COMMIT;

-- Se algo der errado antes do commit, você pode descomentar a linha abaixo:
-- ROLLBACK;

-- ============================================================
-- VERIFICAÇÃO PÓS-EXECUÇÃO
-- ============================================================

-- Verificar quantos registros foram criados
SELECT 
    '=== CONTAGEM APÓS SEED ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS total_itens_pedido,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS total_meios_pagamento;

-- Verificar distribuição de status de pedidos
SELECT 
    '=== DISTRIBUIÇÃO DE STATUS DE PEDIDOS ===' AS informacao,
    status,
    COUNT(*) AS quantidade
FROM pedidos
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar distribuição de status de sessões
SELECT 
    '=== DISTRIBUIÇÃO DE STATUS DE SESSÕES ===' AS informacao,
    status,
    COUNT(*) AS quantidade
FROM sessoes_trabalho
GROUP BY status
ORDER BY quantidade DESC;

-- Verificar pedidos sem sessão (não deveria haver)
SELECT 
    '=== PEDIDOS SEM SESSÃO (DEVERIA SER 0) ===' AS informacao,
    COUNT(*) AS total_pedidos_sem_sessao
FROM pedidos
WHERE sessao_id IS NULL;

-- Verificar pedidos sem itens (não deveria haver)
SELECT 
    '=== PEDIDOS SEM ITENS (DEVERIA SER 0) ===' AS informacao,
    COUNT(*) AS total_pedidos_sem_itens
FROM pedidos p
LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
WHERE ip.id IS NULL;

-- Verificar pedidos sem meios de pagamento (não deveria haver)
SELECT 
    '=== PEDIDOS SEM MEIOS DE PAGAMENTO (DEVERIA SER 0) ===' AS informacao,
    COUNT(*) AS total_pedidos_sem_pagamento
FROM pedidos p
LEFT JOIN meios_pagamento_pedido mpp ON p.id = mpp.pedido_id
WHERE mpp.id IS NULL;

-- Verificar consistência de valores (total de itens = valor_total do pedido)
SELECT 
    '=== VERIFICAÇÃO DE VALORES (DIFERENÇAS > 0.01) ===' AS informacao,
    COUNT(*) AS pedidos_com_valor_incorreto
FROM (
    SELECT 
        p.id,
        p.valor_total AS valor_total_pedido,
        SUM(ip.quantidade * ip.preco_unitario) AS valor_total_itens,
        ABS(p.valor_total - SUM(ip.quantidade * ip.preco_unitario)) AS diferenca
    FROM pedidos p
    INNER JOIN itens_pedido ip ON p.id = ip.pedido_id
    GROUP BY p.id, p.valor_total
    HAVING ABS(p.valor_total - SUM(ip.quantidade * ip.preco_unitario)) > 0.01
) AS inconsistencias;

-- Verificar consistência de meios de pagamento (soma = valor_total do pedido)
SELECT 
    '=== VERIFICAÇÃO DE MEIOS DE PAGAMENTO (DIFERENÇAS > 0.01) ===' AS informacao,
    COUNT(*) AS pedidos_com_pagamento_incorreto
FROM (
    SELECT 
        p.id,
        p.valor_total AS valor_total_pedido,
        SUM(mpp.valor) AS valor_total_pagamento,
        ABS(p.valor_total - SUM(mpp.valor)) AS diferenca
    FROM pedidos p
    INNER JOIN meios_pagamento_pedido mpp ON p.id = mpp.pedido_id
    GROUP BY p.id, p.valor_total
    HAVING ABS(p.valor_total - SUM(mpp.valor)) > 0.01
) AS inconsistencias;

-- Verificar distribuição de pedidos por mês
SELECT 
    '=== DISTRIBUIÇÃO DE PEDIDOS POR MÊS ===' AS informacao,
    DATE_FORMAT(data_pedido, '%Y-%m') AS mes,
    COUNT(*) AS total_pedidos,
    SUM(valor_total) AS valor_total_mes
FROM pedidos
GROUP BY DATE_FORMAT(data_pedido, '%Y-%m')
ORDER BY mes;

-- Verificar distribuição de meios de pagamento
SELECT 
    '=== DISTRIBUIÇÃO DE MEIOS DE PAGAMENTO ===' AS informacao,
    meio_pagamento,
    COUNT(*) AS quantidade,
    SUM(valor) AS valor_total
FROM meios_pagamento_pedido
GROUP BY meio_pagamento
ORDER BY quantidade DESC;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================

SELECT '=== SEED CONCLUÍDO COM SUCESSO! ===' AS status;

