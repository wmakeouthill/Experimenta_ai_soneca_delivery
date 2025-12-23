package com.sonecadelivery.pedidos.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Entidade JPA para pedidos pendentes de mesa.
 * 
 * Pedidos criados por clientes via QR code ficam nesta tabela
 * aguardando aceitação por um funcionário. Ao serem aceitos,
 * são convertidos para pedidos reais e removidos desta tabela.
 * 
 * VANTAGENS DA PERSISTÊNCIA:
 * - Não perde pedidos em caso de restart do servidor
 * - Funciona com múltiplas instâncias da aplicação
 * - Auditoria e histórico de pedidos pendentes
 */
@Entity
@Table(name = "pedidos_pendentes_mesa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PedidoPendenteEntity {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "mesa_token", nullable = true, length = 100)
    private String mesaToken;

    @Column(name = "mesa_id", nullable = true, length = 36)
    private String mesaId;

    @Column(name = "numero_mesa", nullable = true)
    private Integer numeroMesa;

    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "nome_cliente", nullable = false, length = 200)
    private String nomeCliente;

    @Column(name = "telefone_cliente", length = 20)
    private String telefoneCliente;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(name = "valor_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "data_hora_solicitacao", nullable = false)
    private LocalDateTime dataHoraSolicitacao;

    @Column(name = "pedido_real_id", length = 36)
    private String pedidoRealId;

    // ========== Campos de Delivery ==========
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pedido", length = 20)
    @Builder.Default
    private com.sonecadelivery.pedidos.domain.entities.TipoPedido tipoPedido = com.sonecadelivery.pedidos.domain.entities.TipoPedido.MESA;

    @Column(name = "endereco_entrega", columnDefinition = "TEXT")
    private String enderecoEntrega;

    @Column(name = "previsao_entrega_cliente", length = 100)
    private String previsaoEntregaCliente;

    @OneToMany(mappedBy = "pedidoPendente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<ItemPedidoPendenteEntity> itens = new HashSet<>();

    @OneToMany(mappedBy = "pedidoPendente", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<MeioPagamentoPendenteEntity> meiosPagamento = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Adiciona um item ao pedido pendente.
     */
    public void adicionarItem(ItemPedidoPendenteEntity item) {
        itens.add(item);
        item.setPedidoPendente(this);
    }

    /**
     * Adiciona um meio de pagamento ao pedido pendente.
     */
    public void adicionarMeioPagamento(MeioPagamentoPendenteEntity meioPagamento) {
        meiosPagamento.add(meioPagamento);
        meioPagamento.setPedidoPendente(this);
    }
}
