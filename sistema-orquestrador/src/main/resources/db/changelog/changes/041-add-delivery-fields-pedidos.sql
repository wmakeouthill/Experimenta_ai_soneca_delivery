--liquibase formatted sql

--changeset snackbar:041-add-tipo-pedido-column
--comment: Adiciona coluna tipo_pedido na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'tipo_pedido'
ALTER TABLE pedidos ADD COLUMN tipo_pedido VARCHAR(20) DEFAULT 'BALCAO';

--changeset snackbar:041-add-endereco-entrega-column
--comment: Adiciona coluna endereco_entrega na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'endereco_entrega'
ALTER TABLE pedidos ADD COLUMN endereco_entrega TEXT;

--changeset snackbar:041-add-motoboy-id-column
--comment: Adiciona coluna motoboy_id na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'motoboy_id'
ALTER TABLE pedidos ADD COLUMN motoboy_id VARCHAR(36);

--changeset snackbar:041-add-taxa-entrega-column
--comment: Adiciona coluna taxa_entrega na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'taxa_entrega'
ALTER TABLE pedidos ADD COLUMN taxa_entrega DECIMAL(10,2);

--changeset snackbar:041-add-previsao-entrega-column
--comment: Adiciona coluna previsao_entrega na tabela pedidos
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND column_name = 'previsao_entrega'
ALTER TABLE pedidos ADD COLUMN previsao_entrega DATETIME;

--changeset snackbar:041-add-fk-motoboy
--comment: Adiciona foreign key de motoboy_id para motoboys
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.table_constraints WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND constraint_name = 'fk_pedidos_motoboy'
ALTER TABLE pedidos ADD CONSTRAINT fk_pedidos_motoboy 
    FOREIGN KEY (motoboy_id) REFERENCES motoboys(id) ON DELETE SET NULL;

--changeset snackbar:041-add-idx-tipo-pedido
--comment: Adiciona índice para tipo_pedido
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND index_name = 'idx_pedidos_tipo_pedido'
CREATE INDEX idx_pedidos_tipo_pedido ON pedidos(tipo_pedido);

--changeset snackbar:041-add-idx-motoboy-id
--comment: Adiciona índice para motoboy_id
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'pedidos' AND index_name = 'idx_pedidos_motoboy_id'
CREATE INDEX idx_pedidos_motoboy_id ON pedidos(motoboy_id);
