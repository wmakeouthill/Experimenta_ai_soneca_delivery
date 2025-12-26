package com.sonecadelivery.impressao.infrastructure.impressora;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import com.sonecadelivery.impressao.domain.ports.ImpressoraPort;
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
            case EPSON_TM_T20, EPSON_TM_T88 -> epsonAdapter;
            case DARUMA_800, DARUMA_700 -> darumaAdapter;
            // A maioria das impressoras usa protocolo ESC/POS padrão (compatível com Epson)
            case DIEBOLD_IM693H, STAR_TSP100, STAR_TSP650, BEMATECH_MP4200,
                    ELGIN_I9, ELGIN_I7, POS_58, POS_80, GENERICA_ESCPOS ->
                genericaAdapter;
        };
    }
}
