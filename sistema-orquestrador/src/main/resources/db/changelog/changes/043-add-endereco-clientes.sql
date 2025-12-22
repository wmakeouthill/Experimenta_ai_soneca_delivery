--liquibase formatted sql

--changeset sonecadelivery:043-add-endereco-clientes-logradouro
--comment: Adiciona campo logradouro na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'logradouro';
ALTER TABLE clientes ADD COLUMN logradouro VARCHAR(255) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-numero
--comment: Adiciona campo numero na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'numero';
ALTER TABLE clientes ADD COLUMN numero VARCHAR(20) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-complemento
--comment: Adiciona campo complemento na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'complemento';
ALTER TABLE clientes ADD COLUMN complemento VARCHAR(100) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-bairro
--comment: Adiciona campo bairro na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'bairro';
ALTER TABLE clientes ADD COLUMN bairro VARCHAR(100) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-cidade
--comment: Adiciona campo cidade na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'cidade';
ALTER TABLE clientes ADD COLUMN cidade VARCHAR(100) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-estado
--comment: Adiciona campo estado na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'estado';
ALTER TABLE clientes ADD COLUMN estado VARCHAR(2) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-cep
--comment: Adiciona campo cep na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'cep';
ALTER TABLE clientes ADD COLUMN cep VARCHAR(9) NULL;

--changeset sonecadelivery:043-add-endereco-clientes-ponto-referencia
--comment: Adiciona campo ponto_referencia na tabela clientes para delivery
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'clientes' AND column_name = 'ponto_referencia';
ALTER TABLE clientes ADD COLUMN ponto_referencia VARCHAR(255) NULL;

--rollback ALTER TABLE clientes DROP COLUMN ponto_referencia;
--rollback ALTER TABLE clientes DROP COLUMN cep;
--rollback ALTER TABLE clientes DROP COLUMN estado;
--rollback ALTER TABLE clientes DROP COLUMN cidade;
--rollback ALTER TABLE clientes DROP COLUMN bairro;
--rollback ALTER TABLE clientes DROP COLUMN complemento;
--rollback ALTER TABLE clientes DROP COLUMN numero;
--rollback ALTER TABLE clientes DROP COLUMN logradouro;
