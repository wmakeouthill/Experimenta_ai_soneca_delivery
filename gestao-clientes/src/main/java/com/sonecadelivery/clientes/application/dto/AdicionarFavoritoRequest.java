package com.sonecadelivery.clientes.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdicionarFavoritoRequest {

    @NotBlank(message = "ID do produto é obrigatório")
    private String produtoId;
}
