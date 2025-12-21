-- ============================================================
-- Script: Limpar Dados de Pedidos, Sessões de Trabalho e Caixa
-- Descrição: Remove todos os dados relacionados a pedidos, sessões de trabalho e 
--            movimentações de caixa, mantendo usuários, clientes, cardápio e estoque
-- ============================================================
-- 
-- IMPORTANTE: 
-- - Este script deleta TODOS os pedidos, itens de pedidos, meios de pagamento, 
--   movimentações de caixa, sessões de trabalho, favoritos e avaliações de clientes
-- 
-- DADOS QUE SERÃO PRESERVADOS:
-- - Usuários (administradores e operadores)
-- - Clientes
-- - Cardápio (categorias e produtos)
-- - Gestão de Estoque (itens_estoque)
-- - Mesas (configuração de mesas)
-- - Configurações (config_animacao e config_impressora)
--
-- DADOS QUE SERÃO DELETADOS:
-- - Pedidos e todos os itens relacionados
-- - Meios de pagamento dos pedidos
-- - Sessões de trabalho
-- - Movimentações de caixa
-- - Pedidos pendentes de mesa e respectivos itens
-- - Dados derivados de clientes (favoritos e avaliações)
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

-- Verificar quantos registros existem ANTES da limpeza (dados a serem deletados)
SELECT 
    '=== CONTAGEM ANTES DA LIMPEZA (DADOS A SEREM DELETADOS) ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS total_itens_pedido,
    IFNULL((SELECT COUNT(*) FROM itens_pedido_pendente_mesa), 0) AS total_itens_pedido_pendente_mesa,
    IFNULL((SELECT COUNT(*) FROM pedidos_pendentes_mesa), 0) AS total_pedidos_pendentes_mesa,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS total_meios_pagamento,
    IFNULL((SELECT COUNT(*) FROM movimentacoes_caixa), 0) AS total_movimentacoes_caixa,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes_trabalho,
    IFNULL((SELECT COUNT(*) FROM cliente_favoritos), 0) AS total_cliente_favoritos,
    IFNULL((SELECT COUNT(*) FROM cliente_avaliacoes), 0) AS total_cliente_avaliacoes;

-- Confirmar que outras tabelas serão preservadas
SELECT 
    '=== DADOS QUE SERÃO PRESERVADOS ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos,
    IFNULL((SELECT COUNT(*) FROM itens_estoque), 0) AS total_itens_estoque,
    IFNULL((SELECT COUNT(*) FROM mesas), 0) AS total_mesas,
    IFNULL((SELECT COUNT(*) FROM config_animacao), 0) AS total_config_animacao,
    IFNULL((SELECT COUNT(*) FROM config_impressora), 0) AS total_config_impressora;

-- ============================================================
-- INÍCIO DA LIMPEZA
-- ============================================================
-- ATENÇÃO: A partir daqui os dados serão deletados!
-- 
-- O script usa uma transação, então se algo der errado,
-- você pode fazer ROLLBACK antes do COMMIT.
-- 
-- ORDEM DE EXCLUSÃO (importante devido às foreign keys):
-- 1. itens_pedido_pendente_mesa (FK para pedidos_pendentes_mesa com ON DELETE CASCADE)
-- 2. pedidos_pendentes_mesa (pedidos reais ainda não criados)
-- 3. cliente_avaliacoes (FK para pedidos com ON DELETE CASCADE)
-- 4. meios_pagamento_pedido (FK para pedidos com ON DELETE CASCADE)
-- 5. itens_pedido (FK para pedidos com ON DELETE CASCADE)
-- 6. movimentacoes_caixa (FK para sessoes_trabalho com ON DELETE CASCADE)
-- 7. pedidos (FK para clientes, sessoes_trabalho e usuarios com ON DELETE RESTRICT)
-- 8. sessoes_trabalho (pedidos dependem dele, mas já deletamos pedidos)
-- 9. cliente_favoritos (opcional, para limpar histórico de favoritos)
-- ============================================================

START TRANSACTION;

-- Desabilitar verificação de chaves estrangeiras temporariamente
-- (garante que a exclusão seja realizada mesmo com dependências)
-- NOTA: Mesmo com FOREIGN_KEY_CHECKS = 0, mantemos a ordem correta
--       para garantir consistência e facilitar manutenção futura
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Deletar itens dos pedidos pendentes de mesa
-- Tabela: itens_pedido_pendente_mesa
-- FK: pedido_pendente_id -> pedidos_pendentes_mesa(id) com ON DELETE CASCADE
DELETE FROM itens_pedido_pendente_mesa;

-- 2. Deletar pedidos pendentes de mesa
-- Tabela: pedidos_pendentes_mesa
DELETE FROM pedidos_pendentes_mesa;

-- 3. Deletar avaliações de clientes
-- Tabela: cliente_avaliacoes
-- FK: pedido_id -> pedidos(id) com ON DELETE CASCADE
-- (Deletamos explicitamente por segurança e clareza)
DELETE FROM cliente_avaliacoes;

-- 4. Deletar dados da tabela de meios de pagamento dos pedidos
-- Tabela: meios_pagamento_pedido
-- FK: pedido_id -> pedidos(id) com ON DELETE CASCADE
-- (Deletamos explicitamente por segurança e clareza)
DELETE FROM meios_pagamento_pedido;

-- 5. Deletar dados da tabela de itens de pedidos
-- Tabela: itens_pedido
-- FK: pedido_id -> pedidos(id) com ON DELETE CASCADE
-- (Deletamos explicitamente por segurança e clareza)
DELETE FROM itens_pedido;

-- 6. Deletar dados da tabela de movimentações de caixa
-- Tabela: movimentacoes_caixa
-- FK: sessao_id -> sessoes_trabalho(id) com ON DELETE CASCADE
-- (Deletamos explicitamente para garantir limpeza completa, mesmo com CASCADE na sessão)
DELETE FROM movimentacoes_caixa;

-- 7. Deletar todos os pedidos
-- Tabela: pedidos
-- FK: cliente_id -> clientes(id) com ON DELETE RESTRICT
-- FK: sessao_id -> sessoes_trabalho(id) com ON DELETE RESTRICT
-- FK: usuario_id -> usuarios(id) com ON DELETE RESTRICT
-- FK: mesa_id -> mesas(id) (sem constraint explícita no schema)
-- (Como as FKs têm ON DELETE RESTRICT, precisamos deletar pedidos antes de sessões)
-- NOTA: As FKs de itens_pedido e meios_pagamento_pedido têm ON DELETE CASCADE,
--       então seriam deletados automaticamente, mas já deletamos explicitamente acima
DELETE FROM pedidos;

-- 8. Deletar todas as sessões de trabalho
-- Tabela: sessoes_trabalho
-- (A FK de pedidos para sessoes_trabalho tem ON DELETE RESTRICT,
--  por isso deletamos os pedidos primeiro antes de deletar as sessões)
DELETE FROM sessoes_trabalho;

DELETE FROM cliente_favoritos;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- COMMIT DA TRANSAÇÃO
-- ============================================================
-- Confirma todas as alterações
COMMIT;

-- Se algo der errado antes do commit, você pode descomentar a linha abaixo:
-- ROLLBACK;

-- ============================================================
-- VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================================

-- Verificar quantos registros restaram (deve ser 0 para todas as tabelas deletadas)
SELECT 
    '=== CONTAGEM APÓS A LIMPEZA (DADOS DELETADOS) ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS total_itens_pedido,
    IFNULL((SELECT COUNT(*) FROM itens_pedido_pendente_mesa), 0) AS total_itens_pedido_pendente_mesa,
    IFNULL((SELECT COUNT(*) FROM pedidos_pendentes_mesa), 0) AS total_pedidos_pendentes_mesa,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS total_meios_pagamento,
    IFNULL((SELECT COUNT(*) FROM movimentacoes_caixa), 0) AS total_movimentacoes_caixa,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes_trabalho,
    IFNULL((SELECT COUNT(*) FROM cliente_favoritos), 0) AS total_cliente_favoritos,
    IFNULL((SELECT COUNT(*) FROM cliente_avaliacoes), 0) AS total_cliente_avaliacoes;

-- Confirmar que outras tabelas foram preservadas
SELECT 
    '=== DADOS PRESERVADOS (VERIFICAÇÃO FINAL) ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos,
    IFNULL((SELECT COUNT(*) FROM itens_estoque), 0) AS total_itens_estoque,
    IFNULL((SELECT COUNT(*) FROM mesas), 0) AS total_mesas,
    IFNULL((SELECT COUNT(*) FROM config_animacao), 0) AS total_config_animacao,
    IFNULL((SELECT COUNT(*) FROM config_impressora), 0) AS total_config_impressora;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================
SELECT '=== LIMPEZA CONCLUÍDA COM SUCESSO! ===' AS status;

