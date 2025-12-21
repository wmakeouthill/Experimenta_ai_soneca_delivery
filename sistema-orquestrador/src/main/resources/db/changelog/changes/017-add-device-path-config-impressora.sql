--liquibase formatted sql

--changeset snackbar:017-add-device-path-config-impressora
--comment: Migration: Adiciona coluna device_path na tabela config_impressora para permitir configurar o caminho da impressora
--preconditions onFail:MARK_RAN
--precondition-sql-check expectedResult:0 SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'config_impressora' AND column_name = 'device_path'

ALTER TABLE config_impressora 
ADD COLUMN device_path VARCHAR(255) NULL COMMENT 'Caminho do dispositivo da impressora (ex: 127.0.0.1:9100 para rede, COM3 para Windows, /dev/usb/lp0 para Linux)'
AFTER tipo_impressora;

