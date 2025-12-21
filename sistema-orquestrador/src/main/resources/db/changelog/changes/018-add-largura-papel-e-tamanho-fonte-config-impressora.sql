--liquibase formatted sql

--changeset snackbar:018-add-largura-papel-e-tamanho-fonte-config-impressora
--comment: Adiciona colunas largura_papel e tamanho_fonte na tabela config_impressora para configurar layout do cupom
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'config_impressora' AND column_name = 'largura_papel'

ALTER TABLE config_impressora
ADD COLUMN largura_papel INT NULL COMMENT 'Largura da bobina em mm (ex: 58, 80)'
AFTER logo_esc_pos;

ALTER TABLE config_impressora
ADD COLUMN tamanho_fonte VARCHAR(20) NULL COMMENT 'Preset de tamanho da fonte do cupom (PEQUENA, NORMAL, GRANDE)'
AFTER largura_papel;


