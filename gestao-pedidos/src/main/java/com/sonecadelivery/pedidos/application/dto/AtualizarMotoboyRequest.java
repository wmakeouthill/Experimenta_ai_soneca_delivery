package com.sonecadelivery.pedidos.application.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para atualizar um motoboy existente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarMotoboyRequest {

    @Size(max = 200, message = "Nome deve ter no máximo 200 caracteres")
    private String nome;

    @Size(max = 200, message = "Apelido deve ter no máximo 200 caracteres")
    private String apelido; // Nome exibido, editável pelo admin

    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    private String telefone;

    @Size(max = 100, message = "Veículo deve ter no máximo 100 caracteres")
    private String veiculo;

    @Size(max = 10, message = "Placa deve ter no máximo 10 caracteres")
    private String placa;

    private Boolean ativo;
}
