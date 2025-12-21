package com.snackbar.impressao.application.ports;

/**
 * Exceção lançada quando há erro ao comunicar com o Electron Gateway
 */
public class ElectronGatewayException extends Exception {
    
    public ElectronGatewayException(String mensagem) {
        super(mensagem);
    }
    
    public ElectronGatewayException(String mensagem, Throwable causa) {
        super(mensagem, causa);
    }
}

