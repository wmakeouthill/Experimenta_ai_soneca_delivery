-- ============================================================
-- Script: Limpar Todo o Banco de Dados (Exceto Configurações e Usuários Admin/Operador)
-- Descrição: Remove TODOS os dados do banco (pedidos, clientes, 
--            cardápio, sessões), mantendo as configurações do sistema 
--            e usuários com roles ADMINISTRADOR ou OPERADOR
-- ============================================================
-- 
-- IMPORTANTE: 
-- - Este script deleta TODOS os dados: pedidos, clientes, produtos, 
--   categorias, sessões de trabalho
-- - As seguintes tabelas serão preservadas:
--   * config_animacao (configurações de animação)
--   * config_impressora (configurações de impressora)
--   * usuarios com role ADMINISTRADOR ou OPERADOR (credenciais preservadas)
-- - As tabelas do Liquibase (DATABASECHANGELOG) também serão preservadas
-- - Execute com MUITO CUIDADO em ambiente de produção
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

-- Verificar quantos registros existem ANTES da limpeza
SELECT 
    '=== CONTAGEM ANTES DA LIMPEZA ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS total_itens_pedido,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS total_meios_pagamento,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes_trabalho,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias,
    IFNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios;

-- Confirmar que as configurações e usuários admin/operador serão preservados
SELECT 
    '=== DADOS QUE SERÃO PRESERVADOS ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM config_animacao), 0) AS total_config_animacao,
    IFNULL((SELECT COUNT(*) FROM config_impressora), 0) AS total_config_impressora,
    IFNULL((SELECT COUNT(*) FROM usuarios WHERE role IN ('ADMINISTRADOR', 'OPERADOR')), 0) AS total_usuarios_admin_operador;

-- ============================================================
-- INÍCIO DA LIMPEZA
-- ============================================================
-- ATENÇÃO: A partir daqui os dados serão deletados!
-- 
-- O script usa uma transação, então se algo der errado,
-- você pode fazer ROLLBACK antes do COMMIT.
-- 
-- ORDEM DE EXCLUSÃO (importante devido às foreign keys):
-- 1. meios_pagamento_pedido (FK para pedidos com ON DELETE CASCADE)
-- 2. itens_pedido (FK para pedidos com ON DELETE CASCADE)
-- 3. pedidos (FK para clientes, usuarios, sessoes_trabalho)
-- 4. sessoes_trabalho (FK para usuarios)
-- 5. clientes (sem dependências)
-- 6. produtos (FK para categorias)
-- 7. categorias (sem dependências)
-- 8. usuarios (apenas usuários que NÃO são ADMINISTRADOR ou OPERADOR serão deletados)
-- ============================================================

START TRANSACTION;

-- Desabilitar verificação de chaves estrangeiras temporariamente
-- (garante que a exclusão seja realizada mesmo com dependências)
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. LIMPEZA DE DADOS DE PEDIDOS
-- ============================================================

-- 1.1. Deletar meios de pagamento dos pedidos
DELETE FROM meios_pagamento_pedido;

-- 1.2. Deletar itens de pedidos
DELETE FROM itens_pedido;

-- 1.3. Deletar todos os pedidos
DELETE FROM pedidos;

-- 1.4. Deletar todas as sessões de trabalho
DELETE FROM sessoes_trabalho;

-- ============================================================
-- 2. LIMPEZA DE DADOS DE CLIENTES
-- ============================================================

-- 2.1. Deletar todos os clientes
DELETE FROM clientes;

-- ============================================================
-- 3. LIMPEZA DE DADOS DE CARDÁPIO
-- ============================================================

-- 3.1. Deletar todos os produtos (antes das categorias devido à FK)
DELETE FROM produtos;

-- 3.2. Deletar todas as categorias
DELETE FROM categorias;

-- ============================================================
-- 4. LIMPEZA DE DADOS DE USUÁRIOS
-- ============================================================

-- 4.1. Deletar apenas usuários que NÃO são ADMINISTRADOR ou OPERADOR
-- NOTA: Usuários com roles ADMINISTRADOR e OPERADOR serão preservados
--       para manter as credenciais de acesso ao sistema
DELETE FROM usuarios 
WHERE role NOT IN ('ADMINISTRADOR', 'OPERADOR');

-- ============================================================
-- REABILITAR VERIFICAÇÃO DE CHAVES ESTRANGEIRAS
-- ============================================================

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

-- Verificar quantos registros restaram (devem ser todos zero)
SELECT 
    '=== CONTAGEM APÓS A LIMPEZA (DEVEM SER ZERO) ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM pedidos), 0) AS total_pedidos,
    IFNULL((SELECT COUNT(*) FROM itens_pedido), 0) AS total_itens_pedido,
    IFNULL((SELECT COUNT(*) FROM meios_pagamento_pedido), 0) AS total_meios_pagamento,
    IFNULL((SELECT COUNT(*) FROM sessoes_trabalho), 0) AS total_sessoes_trabalho,
    IFNULL((SELECT COUNT(*) FROM clientes), 0) AS total_clientes,
    IFNULL((SELECT COUNT(*) FROM produtos), 0) AS total_produtos,
    IFNULL((SELECT COUNT(*) FROM categorias), 0) AS total_categorias,
    IFNULL((SELECT COUNT(*) FROM usuarios), 0) AS total_usuarios;

-- Confirmar que as configurações e usuários admin/operador foram preservados
SELECT 
    '=== DADOS PRESERVADOS (VERIFICAÇÃO FINAL) ===' AS informacao,
    IFNULL((SELECT COUNT(*) FROM config_animacao), 0) AS total_config_animacao,
    IFNULL((SELECT COUNT(*) FROM config_impressora), 0) AS total_config_impressora,
    IFNULL((SELECT COUNT(*) FROM usuarios WHERE role IN ('ADMINISTRADOR', 'OPERADOR')), 0) AS total_usuarios_admin_operador;

-- ============================================================
-- FINALIZAÇÃO
-- ============================================================
SELECT '=== LIMPEZA COMPLETA CONCLUÍDA COM SUCESSO! ===' AS status;
SELECT '=== NOTA: Configurações e usuários ADMIN/OPERADOR foram preservados ===' AS informacao;

