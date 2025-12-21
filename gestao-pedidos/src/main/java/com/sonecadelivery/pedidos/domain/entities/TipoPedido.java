package com.sonecadelivery.pedidos.domain.entities;

/**
 * Enum para os tipos de pedido suportados pelo sistema.
 */
public enum TipoPedido {
    /**
     * Pedido feito no balcão pelo operador.
     */
    BALCAO("Balcão"),

    /**
     * Pedido feito via QR Code da mesa.
     */
    MESA("Mesa"),

    /**
     * Pedido para entrega (delivery).
     */
    DELIVERY("Delivery"),

    /**
     * Pedido para retirada no local.
     */
    RETIRADA("Retirada");

    private final String descricao;

    TipoPedido(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
