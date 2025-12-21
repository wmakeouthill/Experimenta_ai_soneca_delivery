package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.SalvarSenhaRequest;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.application.ports.ClienteSenhaServicePort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Use case para criar ou alterar senha do cliente.
 * Se o cliente já tem senha, exige a senha atual para alteração.
 */
@Service
@RequiredArgsConstructor
public class SalvarSenhaClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final ClienteSenhaServicePort senhaService;

    public void executar(String clienteId, SalvarSenhaRequest request) {
        // Validar nova senha
        if (request.novaSenha() == null || request.novaSenha().length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres");
        }

        // Buscar cliente
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        // Se cliente já tem senha, validar senha atual
        if (cliente.temSenha()) {
            if (request.senhaAtual() == null || request.senhaAtual().isBlank()) {
                throw new IllegalArgumentException("Senha atual é obrigatória para alterar a senha");
            }

            if (!senhaService.verificarSenha(request.senhaAtual(), cliente.getSenhaHash())) {
                throw new IllegalArgumentException("Senha atual incorreta");
            }
        }

        // Gerar hash e definir nova senha
        String senhaHash = senhaService.hashSenha(request.novaSenha());
        cliente.definirSenha(senhaHash);

        // Salvar
        clienteRepository.salvar(cliente);
    }
}
