package com.snackbar.impressao.domain.ports;

import com.snackbar.impressao.domain.entities.CupomFiscal;

public interface ImpressoraPort {
    void imprimir(CupomFiscal cupomFiscal) throws ImpressaoException;
    boolean verificarDisponibilidade() throws ImpressaoException;
}

