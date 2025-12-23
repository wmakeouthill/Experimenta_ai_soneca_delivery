package com.sonecadelivery.clientes.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para atualizar endereço do cliente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AtualizarEnderecoRequest {

    @NotBlank(message = "Logradouro é obrigatório")
    @Size(max = 255, message = "Logradouro muito longo")
    private String logradouro;

    @NotBlank(message = "Número é obrigatório")
    @Size(max = 20, message = "Número muito longo")
    private String numero;

    @Size(max = 100, message = "Complemento muito longo")
    private String complemento;

    @NotBlank(message = "Bairro é obrigatório")
    @Size(max = 100, message = "Bairro muito longo")
    private String bairro;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 100, message = "Cidade muito longa")
    private String cidade;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres (ex: SP)")
    private String estado;

    @NotBlank(message = "CEP é obrigatório")
    @Size(min = 8, max = 9, message = "CEP inválido")
    private String cep;

    @Size(max = 255, message = "Ponto de referência muito longo")
    private String pontoReferencia;

    private Double latitude;
    private Double longitude;
}
