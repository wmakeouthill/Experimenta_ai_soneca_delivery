package com.sonecadelivery.impressao.infrastructure.impressora;

import com.sonecadelivery.impressao.domain.entities.CupomFiscal;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class FormatoCupomFiscal {
    
    private static final int LARGURA_PADRAO = 48;
    
    /**
     * Formata apenas o CONTEÚDO do cupom (sem comandos de impressora)
     * 
     * O Electron será responsável por adicionar comandos de inicialização,
     * finalização e corte específicos da impressora.
     * 
     * @param cupomFiscal - Dados do cupom fiscal
     * @return bytes ESC/POS contendo apenas o conteúdo formatado
     */
    public static byte[] formatarCupom(CupomFiscal cupomFiscal) {
        byte[] cupom = new byte[0];
        
        // 1. Cabeçalho/Logo (bitmap centralizado no topo)
        cupom = concatenar(cupom, EscPosComandos.alinharCentro());
        
        byte[] logoEscPos = obterLogoEscPos(cupomFiscal);
        if (logoEscPos != null && logoEscPos.length > 0) {
            cupom = concatenar(cupom, logoEscPos);
            cupom = concatenar(cupom, EscPosComandos.linhaEmBranco(2));
        } else {
            cupom = concatenar(cupom, EscPosComandos.textoDuplo());
            cupom = concatenar(cupom, formatarCabecalho(cupomFiscal));
        }
        
        // 2. Conteúdo do cupom (dados do pedido)
        cupom = concatenar(cupom, EscPosComandos.textoNormal());
        cupom = concatenar(cupom, EscPosComandos.alinharEsquerda());
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarDadosPedido(cupomFiscal));
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarItens(cupomFiscal.getItens()));
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarTotal(cupomFiscal.getValorTotal()));
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarMeiosPagamento(cupomFiscal.getMeiosPagamento()));
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarRodape(cupomFiscal));
        
        // NOTA: Comandos de inicialização (reset) e finalização (corte, feeds)
        // são adicionados pelo Electron conforme a impressora específica
        
        return cupom;
    }
    
    private static byte[] formatarCabecalho(CupomFiscal cupomFiscal) {
        StringBuilder cabecalho = new StringBuilder();
        cabecalho.append(cupomFiscal.getNomeEstabelecimento()).append("\n");
        
        if (cupomFiscal.getEnderecoEstabelecimento() != null) {
            cabecalho.append(cupomFiscal.getEnderecoEstabelecimento()).append("\n");
        }
        
        if (cupomFiscal.getTelefoneEstabelecimento() != null) {
            cabecalho.append("Tel: ").append(cupomFiscal.getTelefoneEstabelecimento()).append("\n");
        }
        
        if (cupomFiscal.getCnpjEstabelecimento() != null) {
            cabecalho.append("CNPJ: ").append(formatarCnpj(cupomFiscal.getCnpjEstabelecimento())).append("\n");
        }
        
        cabecalho.append("\n");
        cabecalho.append("CUPOM FISCAL").append("\n");
        cabecalho.append("\n");
        
        return cabecalho.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static byte[] formatarDadosPedido(CupomFiscal cupomFiscal) {
        StringBuilder dados = new StringBuilder();
        dados.append("Pedido: #").append(cupomFiscal.getPedido().getNumeroPedido()).append("\n");
        dados.append("Cliente: ").append(cupomFiscal.getPedido().getClienteNome()).append("\n");
        dados.append("Data: ").append(cupomFiscal.getDataFormatada()).append("\n");
        
        if (cupomFiscal.getPedido().getObservacoes() != null && !cupomFiscal.getPedido().getObservacoes().trim().isEmpty()) {
            dados.append("Obs: ").append(cupomFiscal.getPedido().getObservacoes()).append("\n");
        }
        
        dados.append("\n");
        
        return dados.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static byte[] formatarItens(List<ItemPedidoDTO> itens) {
        StringBuilder itensFormatados = new StringBuilder();
        itensFormatados.append("ITEM | DESCRICAO | QTD | VALOR\n");
        
        int numeroItem = 1;
        for (ItemPedidoDTO item : itens) {
            String nome = truncarTexto(item.getProdutoNome(), 20);
            String linha = String.format("%-4d | %-20s | %-3d | R$ %7.2f\n",
                    numeroItem++,
                    nome,
                    item.getQuantidade(),
                    item.getSubtotal().doubleValue());
            
            itensFormatados.append(linha);
            
            if (item.getObservacoes() != null && !item.getObservacoes().trim().isEmpty()) {
                itensFormatados.append("     * ").append(item.getObservacoes()).append("\n");
            }
        }
        
        return itensFormatados.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static byte[] formatarTotal(BigDecimal valorTotal) {
        StringBuilder total = new StringBuilder();
        total.append("\n");
        total.append("TOTAL: R$ ").append(String.format("%.2f", valorTotal.doubleValue())).append("\n");
        
        return total.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static byte[] formatarMeiosPagamento(List<MeioPagamentoDTO> meiosPagamento) {
        StringBuilder pagamentos = new StringBuilder();
        pagamentos.append("FORMA DE PAGAMENTO:\n");
        
        for (MeioPagamentoDTO meioPagamento : meiosPagamento) {
            pagamentos.append(String.format("%-20s R$ %7.2f\n",
                    meioPagamento.getMeioPagamento().getDescricao(),
                    meioPagamento.getValor().doubleValue()));
        }
        
        return pagamentos.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static byte[] formatarRodape(CupomFiscal cupomFiscal) {
        StringBuilder rodape = new StringBuilder();
        rodape.append("\n");
        rodape.append("Obrigado pela preferencia!\n");
        rodape.append("Volte sempre!\n");
        
        return rodape.toString().getBytes(StandardCharsets.UTF_8);
    }
    
    private static String formatarCnpj(String cnpj) {
        if (cnpj == null || cnpj.length() != 14) {
            return cnpj;
        }
        return String.format("%s.%s.%s/%s-%s",
                cnpj.substring(0, 2),
                cnpj.substring(2, 5),
                cnpj.substring(5, 8),
                cnpj.substring(8, 12),
                cnpj.substring(12, 14));
    }
    
    private static String truncarTexto(String texto, int tamanhoMaximo) {
        if (texto == null) {
            return "";
        }
        if (texto.length() <= tamanhoMaximo) {
            return texto;
        }
        return texto.substring(0, tamanhoMaximo - 3) + "...";
    }
    
    private static byte[] concatenar(byte[] array1, byte[] array2) {
        byte[] resultado = new byte[array1.length + array2.length];
        System.arraycopy(array1, 0, resultado, 0, array1.length);
        System.arraycopy(array2, 0, resultado, array1.length, array2.length);
        return resultado;
    }
    
    public static String formatarCupomLegivel(CupomFiscal cupomFiscal) {
        StringBuilder cupom = new StringBuilder();
        
        cupom.append("=".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarCabecalhoLegivel(cupomFiscal));
        cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarDadosPedidoLegivel(cupomFiscal));
        cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarItensLegivel(cupomFiscal.getItens()));
        cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarTotalLegivel(cupomFiscal.getValorTotal()));
        cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarMeiosPagamentoLegivel(cupomFiscal.getMeiosPagamento()));
        cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
        cupom.append(formatarRodapeLegivel(cupomFiscal));
        cupom.append("\n\n");
        cupom.append("=".repeat(LARGURA_PADRAO)).append("\n");
        
        return cupom.toString();
    }
    
    private static String formatarCabecalhoLegivel(CupomFiscal cupomFiscal) {
        StringBuilder cabecalho = new StringBuilder();
        
        byte[] logoEscPos = obterLogoEscPos(cupomFiscal);
        if (logoEscPos != null && logoEscPos.length > 0) {
            int alturaLogo = calcularAlturaLogo(logoEscPos);
            cabecalho.append(centralizarTexto("┌─────────────────────────────┐", LARGURA_PADRAO)).append("\n");
            for (int i = 0; i < alturaLogo; i++) {
                cabecalho.append(centralizarTexto("│     [LOGO BITMAP AQUI]      │", LARGURA_PADRAO)).append("\n");
            }
            cabecalho.append(centralizarTexto("└─────────────────────────────┘", LARGURA_PADRAO)).append("\n");
            cabecalho.append(centralizarTexto("(Logo carregado do assets)", LARGURA_PADRAO)).append("\n");
            cabecalho.append("\n");
        } else {
            cabecalho.append(centralizarTexto(cupomFiscal.getNomeEstabelecimento(), LARGURA_PADRAO)).append("\n");
        }
        
        if (cupomFiscal.getEnderecoEstabelecimento() != null) {
            cabecalho.append(centralizarTexto(cupomFiscal.getEnderecoEstabelecimento(), LARGURA_PADRAO)).append("\n");
        }
        
        if (cupomFiscal.getTelefoneEstabelecimento() != null) {
            cabecalho.append(centralizarTexto("Tel: " + cupomFiscal.getTelefoneEstabelecimento(), LARGURA_PADRAO)).append("\n");
        }
        
        if (cupomFiscal.getCnpjEstabelecimento() != null) {
            cabecalho.append(centralizarTexto("CNPJ: " + formatarCnpj(cupomFiscal.getCnpjEstabelecimento()), LARGURA_PADRAO)).append("\n");
        }
        
        cabecalho.append("\n");
        cabecalho.append(centralizarTexto("CUPOM FISCAL", LARGURA_PADRAO)).append("\n");
        cabecalho.append("\n");
        
        return cabecalho.toString();
    }
    
    private static String formatarDadosPedidoLegivel(CupomFiscal cupomFiscal) {
        StringBuilder dados = new StringBuilder();
        dados.append("Pedido: #").append(cupomFiscal.getPedido().getNumeroPedido()).append("\n");
        dados.append("Cliente: ").append(cupomFiscal.getPedido().getClienteNome()).append("\n");
        dados.append("Data: ").append(cupomFiscal.getDataFormatada()).append("\n");
        
        if (cupomFiscal.getPedido().getObservacoes() != null && !cupomFiscal.getPedido().getObservacoes().trim().isEmpty()) {
            dados.append("Obs: ").append(cupomFiscal.getPedido().getObservacoes()).append("\n");
        }
        
        dados.append("\n");
        
        return dados.toString();
    }
    
    private static String formatarItensLegivel(List<ItemPedidoDTO> itens) {
        StringBuilder itensFormatados = new StringBuilder();
        itensFormatados.append("ITEM | DESCRICAO | QTD | VALOR\n");
        
        int numeroItem = 1;
        for (ItemPedidoDTO item : itens) {
            String nome = truncarTexto(item.getProdutoNome(), 20);
            String linha = String.format("%-4d | %-20s | %-3d | R$ %7.2f\n",
                    numeroItem++,
                    nome,
                    item.getQuantidade(),
                    item.getSubtotal().doubleValue());
            
            itensFormatados.append(linha);
            
            if (item.getObservacoes() != null && !item.getObservacoes().trim().isEmpty()) {
                itensFormatados.append("     * ").append(item.getObservacoes()).append("\n");
            }
        }
        
        return itensFormatados.toString();
    }
    
    private static String formatarTotalLegivel(BigDecimal valorTotal) {
        StringBuilder total = new StringBuilder();
        total.append("\n");
        total.append("TOTAL: R$ ").append(String.format("%.2f", valorTotal.doubleValue())).append("\n");
        
        return total.toString();
    }
    
    private static String formatarMeiosPagamentoLegivel(List<MeioPagamentoDTO> meiosPagamento) {
        StringBuilder pagamentos = new StringBuilder();
        pagamentos.append("FORMA DE PAGAMENTO:\n");
        
        for (MeioPagamentoDTO meioPagamento : meiosPagamento) {
            pagamentos.append(String.format("%-20s R$ %7.2f\n",
                    meioPagamento.getMeioPagamento().getDescricao(),
                    meioPagamento.getValor().doubleValue()));
        }
        
        return pagamentos.toString();
    }
    
    private static String formatarRodapeLegivel(CupomFiscal cupomFiscal) {
        StringBuilder rodape = new StringBuilder();
        rodape.append("\n");
        rodape.append(centralizarTexto("Obrigado pela preferencia!", LARGURA_PADRAO)).append("\n");
        rodape.append(centralizarTexto("Volte sempre!", LARGURA_PADRAO)).append("\n");
        
        return rodape.toString();
    }
    
    private static String centralizarTexto(String texto, int largura) {
        if (texto == null) {
            return "";
        }
        int espacos = (largura - texto.length()) / 2;
        if (espacos <= 0) {
            return texto;
        }
        return " ".repeat(espacos) + texto;
    }
    
    private static byte[] obterLogoEscPos(CupomFiscal cupomFiscal) {
        if (cupomFiscal.getLogoEscPos() != null && cupomFiscal.getLogoEscPos().length > 0) {
            return cupomFiscal.getLogoEscPos();
        }
        
        return new byte[0];
    }
    
    private static int calcularAlturaLogo(byte[] logoEscPos) {
        if (logoEscPos == null || logoEscPos.length < 7) {
            return 0;
        }
        int alturaL = logoEscPos[5] & 0xFF;
        int alturaH = logoEscPos[6] & 0xFF;
        return alturaL | (alturaH << 8);
    }
}

