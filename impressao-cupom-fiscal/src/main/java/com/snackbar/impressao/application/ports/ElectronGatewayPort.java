package com.snackbar.impressao.application.ports;

import com.snackbar.impressao.domain.entities.CupomFiscal;

/**
 * Porta para comunicação com o Electron Gateway Local
 * Permite que o backend online envie comandos de impressão para o Electron
 * que então imprime localmente nas impressoras do cliente
 */
public interface ElectronGatewayPort {
    
    /**
     * Verifica se o servidor Electron está disponível
     * @return true se o Electron estiver rodando e acessível
     */
    boolean estaDisponivel();
    
    /**
     * Envia comando de impressão para o Electron
     * @param cupomFiscal Cupom fiscal a ser impresso
     * @param devicePath Caminho do dispositivo da impressora (ex: COM3, /dev/usb/lp1)
     * @return true se o comando foi enviado com sucesso
     * @throws ElectronGatewayException se houver erro ao comunicar com o Electron
     */
    boolean enviarComandoImpressao(CupomFiscal cupomFiscal, String devicePath) throws ElectronGatewayException;
}

