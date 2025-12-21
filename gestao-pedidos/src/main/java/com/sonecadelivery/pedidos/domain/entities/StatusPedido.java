package com.sonecadelivery.pedidos.domain.entities;

public enum StatusPedido {
    PENDENTE("Pendente"),
    PREPARANDO("Preparando"),
    PRONTO("Pronto"),
    FINALIZADO("Finalizado"),
    CANCELADO("Cancelado");

    private final String descricao;

    StatusPedido(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    @SuppressWarnings("java:S1172") // novoStatus mantido para compatibilidade futura
    public boolean podeSerAtualizadoPara(StatusPedido novoStatus) {
        // Permite mudanças reversas para flexibilidade operacional
        // Apenas CANCELADO não pode ser alterado (regra de negócio)
        // novoStatus é mantido para compatibilidade futura quando regras de transição
        // forem implementadas
        return this != CANCELADO;
    }
}
