package com.snackbar.clientes.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvaliarProdutoRequest {

    @NotBlank(message = "ID do produto é obrigatório")
    private String produtoId;

    @NotBlank(message = "ID do pedido é obrigatório")
    private String pedidoId;

    @NotNull(message = "Nota é obrigatória")
    @Min(value = 1, message = "Nota mínima é 1")
    @Max(value = 5, message = "Nota máxima é 5")
    private Integer nota;

    private String comentario;
}
