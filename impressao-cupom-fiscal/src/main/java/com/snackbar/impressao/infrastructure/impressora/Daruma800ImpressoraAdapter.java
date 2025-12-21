package com.snackbar.impressao.infrastructure.impressora;

import com.snackbar.impressao.domain.entities.CupomFiscal;
import com.snackbar.impressao.domain.ports.ImpressaoException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.OutputStream;

@Component
@RequiredArgsConstructor
public class Daruma800ImpressoraAdapter extends BaseImpressoraAdapter {

    @Value("${impressao.daruma.800.device:/dev/usb/lp1}")
    private String devicePath;

    @Value("${impressao.daruma.800.modo-teste:true}")
    private boolean modoTeste;

    private String nomeArquivoTeste;

    @Override
    protected OutputStream obterOutputStream(CupomFiscal cupomFiscal) throws ImpressaoException {
        if (modoTeste) {
            nomeArquivoTeste = "cupom_daruma_" + cupomFiscal.getPedido().getNumeroPedido() + ".prn";
            return criarOutputStreamArquivo(nomeArquivoTeste);
        }

        String devicePathParaUsar = obterDevicePath(cupomFiscal);

        try {
            if (ConexaoImpressoraUtil.eConexaoRede(devicePathParaUsar)) {
                return ConexaoImpressoraUtil.criarConexaoRede(devicePathParaUsar);
            } else {
                return ConexaoImpressoraUtil.criarConexaoLocal(devicePathParaUsar);
            }
        } catch (IOException e) {
            throw new ImpressaoException("Erro ao conectar com impressora DARUMA 800: " + e.getMessage(), e);
        }
    }

    private String obterDevicePath(CupomFiscal cupomFiscal) {
        String devicePathConfigurado = cupomFiscal.getConfiguracaoImpressora().getDevicePath();
        return devicePathConfigurado != null && !devicePathConfigurado.trim().isEmpty()
                ? devicePathConfigurado
                : devicePath;
    }

    @Override
    protected String obterNomeArquivoTeste(CupomFiscal cupomFiscal) {
        return nomeArquivoTeste;
    }

    @Override
    protected void fecharOutputStream(OutputStream outputStream) throws IOException {
        outputStream.close();
    }

    @Override
    protected boolean verificarImpressoraDisponivel() throws Exception {
        if (modoTeste) {
            return true;
        }

        if (ConexaoImpressoraUtil.eConexaoRede(devicePath)) {
            return ConexaoImpressoraUtil.verificarConexaoRede(devicePath);
        } else {
            return ConexaoImpressoraUtil.verificarConexaoLocal(devicePath);
        }
    }
}
