package com.sonecadelivery.clientes.application.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AtualizarPerfilRequest {
    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    private String telefone;
    private String email;

    // Dados de endereço
    private String logradouro;
    private String numero;
    private String complemento;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String pontoReferencia;

    private Double latitude;
    private Double longitude;
}
