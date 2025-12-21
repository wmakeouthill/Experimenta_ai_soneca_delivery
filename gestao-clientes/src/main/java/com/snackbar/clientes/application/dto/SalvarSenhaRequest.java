package com.snackbar.clientes.application.dto;

/**
 * DTO para requisição de criação ou alteração de senha do cliente.
 */
public record SalvarSenhaRequest(
        String novaSenha,
        String senhaAtual) {
    public boolean isAlterarSenha() {
        return senhaAtual != null && !senhaAtual.isBlank();
    }
}
