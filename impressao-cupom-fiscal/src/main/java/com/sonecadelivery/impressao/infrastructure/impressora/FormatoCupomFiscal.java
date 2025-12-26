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

        // 1. Cabeçalho (texto centralizado)
        // Logo é tratado separadamente pelo Electron via node-thermal-printer
        cupom = concatenar(cupom, EscPosComandos.alinharCentro());
        cupom = concatenar(cupom, formatarCabecalho(cupomFiscal));

        // 2. Conteúdo do cupom (dados do pedido)
        cupom = concatenar(cupom, EscPosComandos.textoNormal());
        cupom = concatenar(cupom, EscPosComandos.alinharEsquerda());
        cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
        cupom = concatenar(cupom, formatarDadosPedido(cupomFiscal));

        // 2.1 Seção de Delivery (apenas para pedidos de entrega)
        byte[] dadosEntrega = formatarDadosEntrega(cupomFiscal);
        if (dadosEntrega.length > 0) {
            cupom = concatenar(cupom, EscPosComandos.linhaSeparadora(LARGURA_PADRAO));
            cupom = concatenar(cupom, dadosEntrega);
        }

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
        byte[] cabecalho = new byte[0];

        // Nome do estabelecimento: altura dupla + negrito (mais evidente)
        cabecalho = concatenar(cabecalho, EscPosComandos.textoDuploAltura());
        String nome = cupomFiscal.getNomeEstabelecimento() + "\n";
        cabecalho = concatenar(cabecalho, nome.getBytes(StandardCharsets.UTF_8));

        // Volta para texto normal para o resto do cabeçalho
        cabecalho = concatenar(cabecalho, EscPosComandos.textoNormal());

        StringBuilder resto = new StringBuilder();

        if (cupomFiscal.getEnderecoEstabelecimento() != null
                && !cupomFiscal.getEnderecoEstabelecimento().trim().isEmpty()) {
            resto.append(cupomFiscal.getEnderecoEstabelecimento()).append("\n");
        }

        if (cupomFiscal.getTelefoneEstabelecimento() != null
                && !cupomFiscal.getTelefoneEstabelecimento().trim().isEmpty()) {
            resto.append("Tel: ").append(cupomFiscal.getTelefoneEstabelecimento()).append("\n");
        }

        if (cupomFiscal.getCnpjEstabelecimento() != null && !cupomFiscal.getCnpjEstabelecimento().trim().isEmpty()) {
            resto.append("CNPJ: ").append(formatarCnpj(cupomFiscal.getCnpjEstabelecimento())).append("\n");
        }

        resto.append("\n");

        // CUPOM FISCAL em negrito
        cabecalho = concatenar(cabecalho, resto.toString().getBytes(StandardCharsets.UTF_8));
        cabecalho = concatenar(cabecalho, EscPosComandos.textoNegrito());
        cabecalho = concatenar(cabecalho, "CUPOM FISCAL\n".getBytes(StandardCharsets.UTF_8));
        cabecalho = concatenar(cabecalho, EscPosComandos.textoNormal());
        cabecalho = concatenar(cabecalho, "\n".getBytes(StandardCharsets.UTF_8));

        return cabecalho;
    }

    private static byte[] formatarDadosPedido(CupomFiscal cupomFiscal) {
        StringBuilder dados = new StringBuilder();
        dados.append("Pedido: #").append(cupomFiscal.getPedido().getNumeroPedido()).append("\n");
        dados.append("Cliente: ").append(cupomFiscal.getPedido().getClienteNome()).append("\n");
        dados.append("Data: ").append(cupomFiscal.getDataFormatada()).append("\n");

        if (cupomFiscal.getPedido().getObservacoes() != null
                && !cupomFiscal.getPedido().getObservacoes().trim().isEmpty()) {
            dados.append("Obs: ").append(cupomFiscal.getPedido().getObservacoes()).append("\n");
        }

        dados.append("\n");

        return dados.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Formata a seção de dados de entrega para pedidos do tipo DELIVERY.
     * Inclui: endereço, taxa de entrega, motoboy responsável.
     * Retorna array vazio se não for pedido de delivery.
     */
    private static byte[] formatarDadosEntrega(CupomFiscal cupomFiscal) {
        var pedido = cupomFiscal.getPedido();

        // Verifica se é pedido de delivery
        String tipoPedido = pedido.getTipoPedido();
        if (tipoPedido == null || !tipoPedido.equalsIgnoreCase("DELIVERY")) {
            return new byte[0];
        }

        StringBuilder entrega = new StringBuilder();
        entrega.append("     DADOS DA ENTREGA\n");
        entrega.append("\n");

        // Endereço de entrega
        if (pedido.getEnderecoEntrega() != null && !pedido.getEnderecoEntrega().trim().isEmpty()) {
            entrega.append("Endereco: ").append(pedido.getEnderecoEntrega()).append("\n");
        }

        // Taxa de entrega
        if (pedido.getTaxaEntrega() != null && pedido.getTaxaEntrega().doubleValue() > 0) {
            entrega.append(String.format("Taxa entrega: R$ %.2f\n", pedido.getTaxaEntrega().doubleValue()));
        }

        // Motoboy responsável
        String motoboyInfo = formatarMotoboyInfo(pedido);
        if (!motoboyInfo.isEmpty()) {
            entrega.append("Motoboy: ").append(motoboyInfo).append("\n");
        }

        entrega.append("\n");

        return entrega.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Formata as informações do motoboy para exibição.
     * Prioriza: apelido > nome > id. Adiciona telefone se disponível.
     */
    private static String formatarMotoboyInfo(com.sonecadelivery.pedidos.application.dto.PedidoDTO pedido) {
        StringBuilder info = new StringBuilder();

        // Nome ou apelido do motoboy
        String nomeExibicao = null;
        if (pedido.getMotoboyApelido() != null && !pedido.getMotoboyApelido().trim().isEmpty()) {
            nomeExibicao = pedido.getMotoboyApelido();
        } else if (pedido.getMotoboyNome() != null && !pedido.getMotoboyNome().trim().isEmpty()) {
            nomeExibicao = pedido.getMotoboyNome();
        }

        if (nomeExibicao == null || nomeExibicao.isEmpty()) {
            return "";
        }

        info.append(nomeExibicao);

        // Telefone do motoboy
        if (pedido.getMotoboyTelefone() != null && !pedido.getMotoboyTelefone().trim().isEmpty()) {
            info.append(" - ").append(pedido.getMotoboyTelefone());
        }

        return info.toString();
    }

    private static byte[] formatarItens(List<ItemPedidoDTO> itens) {
        StringBuilder itensFormatados = new StringBuilder();

        // Cabeçalho da tabela
        itensFormatados.append("ITEM | DESCRICAO          | QTD | VALOR\n");
        itensFormatados.append("\n"); // Espaço após cabeçalho

        int numeroItem = 1;
        for (ItemPedidoDTO item : itens) {
            String nome = truncarTexto(item.getProdutoNome(), 18);
            String linha = String.format("%2d   | %-18s | %3d | R$%7.2f\n",
                    numeroItem++,
                    nome,
                    item.getQuantidade(),
                    item.getSubtotal().doubleValue());

            itensFormatados.append(linha);

            // Observações do item (se houver)
            if (item.getObservacoes() != null && !item.getObservacoes().trim().isEmpty()) {
                itensFormatados.append("       > ").append(item.getObservacoes()).append("\n");
            }
        }

        itensFormatados.append("\n"); // Espaço após itens

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

        // Seção de delivery (se aplicável)
        String dadosEntrega = formatarDadosEntregaLegivel(cupomFiscal);
        if (!dadosEntrega.isEmpty()) {
            cupom.append("-".repeat(LARGURA_PADRAO)).append("\n");
            cupom.append(dadosEntrega);
        }

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

    /**
     * Versão legível (texto plano) dos dados de entrega.
     */
    private static String formatarDadosEntregaLegivel(CupomFiscal cupomFiscal) {
        var pedido = cupomFiscal.getPedido();

        String tipoPedido = pedido.getTipoPedido();
        if (tipoPedido == null || !tipoPedido.equalsIgnoreCase("DELIVERY")) {
            return "";
        }

        StringBuilder entrega = new StringBuilder();
        entrega.append(centralizarTexto("DADOS DA ENTREGA", LARGURA_PADRAO)).append("\n");
        entrega.append("\n");

        if (pedido.getEnderecoEntrega() != null && !pedido.getEnderecoEntrega().trim().isEmpty()) {
            entrega.append("Endereco: ").append(pedido.getEnderecoEntrega()).append("\n");
        }

        if (pedido.getTaxaEntrega() != null && pedido.getTaxaEntrega().doubleValue() > 0) {
            entrega.append(String.format("Taxa entrega: R$ %.2f\n", pedido.getTaxaEntrega().doubleValue()));
        }

        String motoboyInfo = formatarMotoboyInfo(pedido);
        if (!motoboyInfo.isEmpty()) {
            entrega.append("Motoboy: ").append(motoboyInfo).append("\n");
        }

        entrega.append("\n");

        return entrega.toString();
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
            cabecalho.append(centralizarTexto("Tel: " + cupomFiscal.getTelefoneEstabelecimento(), LARGURA_PADRAO))
                    .append("\n");
        }

        if (cupomFiscal.getCnpjEstabelecimento() != null) {
            cabecalho.append(
                    centralizarTexto("CNPJ: " + formatarCnpj(cupomFiscal.getCnpjEstabelecimento()), LARGURA_PADRAO))
                    .append("\n");
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

        if (cupomFiscal.getPedido().getObservacoes() != null
                && !cupomFiscal.getPedido().getObservacoes().trim().isEmpty()) {
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
