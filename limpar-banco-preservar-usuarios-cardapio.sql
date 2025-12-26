-- ============================================================
-- Script: Limpeza do Banco de Dados
-- Descrição: Limpa TODAS as tabelas EXCETO:
--            - Usuários: usuarios (ADMINISTRADOR e OPERADOR)
--            - Cardápio: categorias, produtos, adicionais, produtos_adicionais
-- ============================================================
-- 
-- ATENÇÃO: Este script é DESTRUTIVO!
-- Ele irá APAGAR PERMANENTEMENTE todos os dados das tabelas listadas.
-- Faça um backup antes de executar.
--
-- Como executar no IntelliJ:
-- 1. Abra o Data Source configurado no IntelliJ
-- 2. Clique com botão direito no banco de dados
-- 3. Selecione "New" > "Query Console" ou abra este arquivo
-- 4. Execute o script selecionando todo o conteúdo (Ctrl+A) e depois (Ctrl+Enter)
-- ============================================================

-- ============================================================
-- VERIFICAÇÃO PRÉ-LIMPEZA
-- ============================================================

SELECT 
    '=== DADOS QUE SERÃO PRESERVADOS ===' AS informacao,
    (SELECT COUNT(*) FROM categorias) AS categorias,
    (SELECT COUNT(*) FROM produtos) AS produtos,
    (SELECT COUNT(*) FROM adicionais) AS adicionais,
    (SELECT COUNT(*) FROM produtos_adicionais) AS produtos_adicionais,
    (SELECT COUNT(*) FROM usuarios WHERE role IN ('ADMINISTRADOR', 'OPERADOR')) AS usuarios_admin_operador;

SELECT 
    '=== DADOS QUE SERÃO APAGADOS ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS itens_pedido,
    IFNULL((SELECT COUNT(*) FROM itens_pedido_adicionais), 0) AS itens_pedido_adicionais,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS meios_pagamento_pedido,
    IFNULL((SELECT COUNT(*) FROM pedidos_delivery), 0) AS pedidos_delivery,
    IFNULL((SELECT COUNT(*) FROM itens_pedido_delivery), 0) AS itens_pedido_delivery,
    IFNULL((SELECT COUNT(*) FROM adicionais_item_pedido_delivery), 0) AS adicionais_item_pedido_delivery,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido_delivery), 0) AS meios_pagamento_pedido_delivery,
    IFNULL((SELECT COUNT(*) FROM pedidos_pendentes_mesa), 0) AS pedidos_pendentes_mesa,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS clientes,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS sessoes_trabalho,
    IFNULL((SELECT COUNT(*) FROM movimentacoes_caixa), 0) AS movimentacoes_caixa,
    IFNULL((SELECT COUNT(*) FROM motoboys), 0) AS motoboys,
    IFNULL((SELECT COUNT(*) FROM mesas), 0) AS mesas,
    IFNULL((SELECT COUNT(*) FROM historico_conversas_chat), 0) AS historico_conversas_chat;

-- ============================================================
-- INÍCIO DA LIMPEZA
-- ============================================================

START TRANSACTION;

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. LIMPEZA DE TABELAS DE DELIVERY
-- ============================================================

-- Adicionais de itens de pedidos delivery
TRUNCATE TABLE adicionais_item_pedido_delivery;

-- Meios de pagamento de pedidos delivery
TRUNCATE TABLE meios_pagamento_pedido_delivery;

-- Itens de pedidos delivery
TRUNCATE TABLE itens_pedido_delivery;

-- Pedidos delivery
TRUNCATE TABLE pedidos_delivery;

SELECT '✓ Tabelas de Delivery limpas' AS status;

-- ============================================================
-- 2. LIMPEZA DE TABELAS DE PEDIDOS (MESA/BALCÃO)
-- ============================================================

-- Auditoria de pagamentos
TRUNCATE TABLE auditoria_pagamentos;

-- Adicionais de itens de pedidos pendentes mesa
TRUNCATE TABLE adicionais_item_pedido_pendente_mesa;

-- Meios de pagamento pendentes mesa
TRUNCATE TABLE meios_pagamento_pendente_mesa;

-- Itens de pedidos pendentes mesa
TRUNCATE TABLE itens_pedido_pendente_mesa;

-- Pedidos pendentes mesa
TRUNCATE TABLE pedidos_pendentes_mesa;

-- Adicionais de itens de pedidos
TRUNCATE TABLE itens_pedido_adicionais;

-- Meios de pagamento de pedidos
TRUNCATE TABLE meios_pagamento_pedido;

-- Itens de pedidos
TRUNCATE TABLE itens_pedido;

-- Pedidos
TRUNCATE TABLE pedidos;

-- Sequência de número de pedido (resetar para 1)
TRUNCATE TABLE numero_pedido_sequence;

SELECT '✓ Tabelas de Pedidos limpas' AS status;

-- ============================================================
-- 3. LIMPEZA DE TABELAS DE CLIENTES
-- ============================================================

-- Favoritos de clientes
TRUNCATE TABLE cliente_favoritos;

-- Avaliações de clientes
TRUNCATE TABLE cliente_avaliacoes;

-- Clientes
TRUNCATE TABLE clientes;

SELECT '✓ Tabelas de Clientes limpas' AS status;

-- ============================================================
-- 4. LIMPEZA DE TABELAS DE OPERAÇÃO
-- ============================================================

-- Histórico de conversas do chat IA
TRUNCATE TABLE historico_conversas_chat;

-- Movimentações de caixa
TRUNCATE TABLE movimentacoes_caixa;

-- Sessões de trabalho
TRUNCATE TABLE sessoes_trabalho;

-- Mesas
TRUNCATE TABLE mesas;

-- Motoboys
TRUNCATE TABLE motoboys;

-- Itens de estoque (movimentações)
TRUNCATE TABLE itens_estoque;

-- Chaves de idempotência
TRUNCATE TABLE idempotency_keys;

SELECT '✓ Tabelas de Operação limpas' AS status;

-- ============================================================
-- 5. NOTA: TABELAS PRESERVADAS (NÃO SERÃO LIMPAS)
-- ============================================================
-- 
-- CARDÁPIO:
--   - categorias
--   - produtos
--   - adicionais
--   - produtos_adicionais
--
-- USUÁRIOS:
--   - usuarios (apenas ADMINISTRADOR e OPERADOR são mantidos)
--
-- CONFIGURAÇÃO:
--   - config_animacao
--   - config_impressora
--
-- ============================================================

-- ============================================================
-- REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- COMMIT DA TRANSAÇÃO
-- ============================================================
COMMIT;

-- ============================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================================

SELECT 
    '=== DADOS PRESERVADOS APÓS LIMPEZA ===' AS informacao,
    (SELECT COUNT(*) FROM categorias) AS categorias,
    (SELECT COUNT(*) FROM produtos) AS produtos,
    (SELECT COUNT(*) FROM adicionais) AS adicionais,
    (SELECT COUNT(*) FROM produtos_adicionais) AS produtos_adicionais,
    (SELECT COUNT(*) FROM usuarios) AS usuarios;

SELECT 
    '=== VERIFICAÇÃO DE TABELAS LIMPAS ===' AS informacao,
    (SELECT COUNT(*) FROM pedidos) AS pedidos,
    (SELECT COUNT(*) FROM pedidos_delivery) AS pedidos_delivery,
    (SELECT COUNT(*) FROM clientes) AS clientes,
    (SELECT COUNT(*) FROM sessoes_trabalho) AS sessoes_trabalho,
    (SELECT COUNT(*) FROM movimentacoes_caixa) AS movimentacoes_caixa;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================
SELECT '=== LIMPEZA CONCLUÍDA COM SUCESSO! ===' AS status;
SELECT '=== Dados preservados: Cardápio (categorias, produtos, adicionais) e Usuários (ADMINISTRADOR/OPERADOR) ===' AS info;
