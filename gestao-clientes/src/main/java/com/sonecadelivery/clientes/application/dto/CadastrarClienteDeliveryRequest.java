package com.sonecadelivery.clientes.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request para cadastro de cliente via delivery.
 * Contém todos os campos necessários para cadastro completo incluindo endereço.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CadastrarClienteDeliveryRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(min = 2, max = 200, message = "Nome deve ter entre 2 e 200 caracteres")
    private String nome;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(min = 10, max = 20, message = "Telefone inválido")
    private String telefone;

    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String senha;

    // ========== Campos de Endereço ==========

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
}
