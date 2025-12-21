package com.sonecadelivery.impressao.domain.ports;

public class ImpressaoException extends Exception {
    public ImpressaoException(String message) {
        super(message);
    }
    
    public ImpressaoException(String message, Throwable cause) {
        super(message, cause);
    }
}

