package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.dto.DefinirSenhaClienteRequest;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.application.ports.ClienteSenhaServicePort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DefinirSenhaClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final ClienteSenhaServicePort senhaService;

    public ClienteDTO executar(String clienteId, DefinirSenhaClienteRequest request) {
        // Validar confirmação de senha
        if (!request.getSenha().equals(request.getConfirmacaoSenha())) {
            throw new IllegalArgumentException("Confirmação de senha não confere");
        }

        // Buscar cliente
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        // Gerar hash e definir senha
        String senhaHash = senhaService.hashSenha(request.getSenha());
        cliente.definirSenha(senhaHash);

        // Salvar
        Cliente salvo = clienteRepository.salvar(cliente);

        return ClienteDTO.de(salvo);
    }
}
