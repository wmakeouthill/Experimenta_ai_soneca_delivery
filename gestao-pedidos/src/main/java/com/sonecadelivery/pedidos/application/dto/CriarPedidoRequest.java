package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CriarPedidoRequest {
    @NotBlank(message = "ID do cliente é obrigatório")
    private String clienteId;
    
    @NotBlank(message = "Nome do cliente é obrigatório")
    private String clienteNome;
    
    @NotEmpty(message = "Pedido deve ter pelo menos um item")
    @Valid
    private List<ItemPedidoRequest> itens;
    
    private String observacoes;
    
    @NotEmpty(message = "Pedido deve ter pelo menos um meio de pagamento")
    @Valid
    private List<MeioPagamentoRequest> meiosPagamento;
    
    @NotBlank(message = "ID do usuário é obrigatório")
    private String usuarioId;
}

