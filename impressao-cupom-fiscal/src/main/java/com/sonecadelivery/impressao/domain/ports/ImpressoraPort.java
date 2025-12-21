package com.sonecadelivery.impressao.domain.ports;

import com.sonecadelivery.impressao.domain.entities.CupomFiscal;

public interface ImpressoraPort {
    void imprimir(CupomFiscal cupomFiscal) throws ImpressaoException;
    boolean verificarDisponibilidade() throws ImpressaoException;
}

