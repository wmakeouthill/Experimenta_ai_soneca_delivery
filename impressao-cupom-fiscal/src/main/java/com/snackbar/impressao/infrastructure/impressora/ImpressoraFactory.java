package com.snackbar.impressao.infrastructure.impressora;

import com.snackbar.impressao.domain.entities.TipoImpressora;
import com.snackbar.impressao.domain.ports.ImpressoraPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ImpressoraFactory {
    
    private final EpsonTmT20ImpressoraAdapter epsonAdapter;
    private final Daruma800ImpressoraAdapter darumaAdapter;
    private final GenericaEscPosImpressoraAdapter genericaAdapter;
    
    public ImpressoraPort criar(TipoImpressora tipoImpressora) {
        return switch (tipoImpressora) {
            case EPSON_TM_T20 -> epsonAdapter;
            case DARUMA_800 -> darumaAdapter;
            case GENERICA_ESCPOS -> genericaAdapter;
        };
    }
}

