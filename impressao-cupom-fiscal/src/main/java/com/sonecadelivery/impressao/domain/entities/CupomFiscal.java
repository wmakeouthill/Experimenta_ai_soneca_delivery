package com.sonecadelivery.impressao.domain.entities;

import com.sonecadelivery.impressao.domain.valueobjects.ConfiguracaoImpressora;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Getter
public class CupomFiscal {
    private final PedidoDTO pedido;
    private final ConfiguracaoImpressora configuracaoImpressora;
    private final String nomeEstabelecimento;
    private final String enderecoEstabelecimento;
    private final String telefoneEstabelecimento;
    private final String cnpjEstabelecimento;
    private final String logoBase64;
    private final byte[] logoEscPos;
    
    private CupomFiscal(PedidoDTO pedido, ConfiguracaoImpressora configuracaoImpressora,
                       String nomeEstabelecimento, String enderecoEstabelecimento,
                       String telefoneEstabelecimento, String cnpjEstabelecimento, 
                       String logoBase64, byte[] logoEscPos) {
        this.pedido = pedido;
        this.configuracaoImpressora = configuracaoImpressora;
        this.nomeEstabelecimento = nomeEstabelecimento;
        this.enderecoEstabelecimento = enderecoEstabelecimento;
        this.telefoneEstabelecimento = telefoneEstabelecimento;
        this.cnpjEstabelecimento = cnpjEstabelecimento;
        this.logoBase64 = logoBase64;
        this.logoEscPos = logoEscPos;
    }
    
    public static CupomFiscal criar(PedidoDTO pedido, ConfiguracaoImpressora configuracaoImpressora,
                                    String nomeEstabelecimento, String enderecoEstabelecimento,
                                    String telefoneEstabelecimento, String cnpjEstabelecimento, 
                                    String logoBase64, byte[] logoEscPos) {
        validarDados(pedido, configuracaoImpressora, nomeEstabelecimento);
        return new CupomFiscal(pedido, configuracaoImpressora, nomeEstabelecimento,
                enderecoEstabelecimento, telefoneEstabelecimento, cnpjEstabelecimento, logoBase64, logoEscPos);
    }
    
    public List<ItemPedidoDTO> getItens() {
        return pedido.getItens();
    }
    
    public List<MeioPagamentoDTO> getMeiosPagamento() {
        return pedido.getMeiosPagamento();
    }
    
    public BigDecimal getValorTotal() {
        return pedido.getValorTotal();
    }
    
    public String getDataFormatada() {
        LocalDateTime data = pedido.getDataPedido() != null ? pedido.getDataPedido() : LocalDateTime.now();
        return data.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss"));
    }
    
    private static void validarDados(PedidoDTO pedido, ConfiguracaoImpressora configuracaoImpressora, String nomeEstabelecimento) {
        if (pedido == null) {
            throw new IllegalArgumentException("Pedido não pode ser nulo");
        }
        if (configuracaoImpressora == null) {
            throw new IllegalArgumentException("Configuração da impressora não pode ser nula");
        }
        if (nomeEstabelecimento == null || nomeEstabelecimento.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do estabelecimento não pode ser nulo ou vazio");
        }
    }
}

