package com.snackbar.impressao.infrastructure.impressora;

import com.snackbar.impressao.domain.entities.CupomFiscal;
import com.snackbar.impressao.domain.ports.ImpressaoException;
import com.snackbar.impressao.domain.ports.ImpressoraPort;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;

public abstract class BaseImpressoraAdapter implements ImpressoraPort {
    
    @Override
    public void imprimir(CupomFiscal cupomFiscal) throws ImpressaoException {
        byte[] dadosImpressao = FormatoCupomFiscal.formatarCupom(cupomFiscal);
        
        try {
            OutputStream outputStream = obterOutputStream(cupomFiscal);
            outputStream.write(dadosImpressao);
            outputStream.flush();
            fecharOutputStream(outputStream);
            
            String nomeArquivoTeste = obterNomeArquivoTeste(cupomFiscal);
            if (nomeArquivoTeste != null && nomeArquivoTeste.endsWith(".prn")) {
                salvarVersaoTexto(nomeArquivoTeste, cupomFiscal);
            }
        } catch (IOException e) {
            throw new ImpressaoException("Erro ao imprimir cupom fiscal: " + e.getMessage(), e);
        }
    }
    
    private void salvarVersaoTexto(String nomeArquivoPrn, CupomFiscal cupomFiscal) {
        try {
            String nomeArquivoTxt = nomeArquivoPrn.replace(".prn", ".txt");
            String conteudoLegivel = FormatoCupomFiscal.formatarCupomLegivel(cupomFiscal);
            Path caminhoTxt = Paths.get(nomeArquivoTxt);
            Files.write(caminhoTxt, conteudoLegivel.getBytes(StandardCharsets.UTF_8), 
                StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (Exception e) {
            System.err.println("Aviso: Não foi possível salvar versão texto do cupom: " + e.getMessage());
        }
    }
    
    protected String obterNomeArquivoTeste(CupomFiscal cupomFiscal) {
        return null;
    }
    
    @Override
    public boolean verificarDisponibilidade() throws ImpressaoException {
        try {
            return verificarImpressoraDisponivel();
        } catch (Exception e) {
            throw new ImpressaoException("Erro ao verificar disponibilidade da impressora: " + e.getMessage(), e);
        }
    }
    
    protected abstract OutputStream obterOutputStream(CupomFiscal cupomFiscal) throws ImpressaoException;
    
    protected abstract void fecharOutputStream(OutputStream outputStream) throws IOException;
    
    protected abstract boolean verificarImpressoraDisponivel() throws Exception;
    
    protected OutputStream criarOutputStreamArquivo(String nomeArquivo) throws ImpressaoException {
        try {
            Path caminho = Paths.get(nomeArquivo);
            return Files.newOutputStream(caminho, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new ImpressaoException("Erro ao criar arquivo de impressão: " + e.getMessage(), e);
        }
    }
}

