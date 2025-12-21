package com.sonecadelivery.pedidos.application.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para pedido pendente de aceitação (na fila).
 * Representa um pedido feito pelo cliente via QR code que aguarda
 * aceitação de um funcionário.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoPendenteDTO {

    private String id;
    private String mesaToken;
    private String mesaId;
    private Integer numeroMesa;
    private String clienteId;
    private String nomeCliente;
    private String telefoneCliente;
    private List<ItemPedidoPendenteDTO> itens;
    private List<MeioPagamentoRequest> meiosPagamento;
    private String observacoes;
    private BigDecimal valorTotal;
    private LocalDateTime dataHoraSolicitacao;
    private long tempoEsperaSegundos;

    // ========== Campos de Delivery ==========
    private String tipoPedido; // MESA, DELIVERY, RETIRADA
    private String enderecoEntrega;
    private String previsaoEntregaCliente;

    /**
     * Calcula o tempo de espera em segundos.
     */
    public void atualizarTempoEspera() {
        if (dataHoraSolicitacao != null) {
            this.tempoEsperaSegundos = java.time.Duration.between(
                    dataHoraSolicitacao,
                    LocalDateTime.now()).getSeconds();
        }
    }
}
