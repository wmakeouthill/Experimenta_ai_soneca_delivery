package com.snackbar.clientes.application.usecases;

import com.snackbar.clientes.application.dto.AtualizarTelefoneRequest;
import com.snackbar.clientes.application.dto.ClienteDTO;
import com.snackbar.clientes.application.ports.ClienteRepositoryPort;
import com.snackbar.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AtualizarTelefoneClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;

    public ClienteDTO executar(String clienteId, AtualizarTelefoneRequest request) {
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        cliente.atualizarTelefone(request.getTelefone());
        clienteRepository.salvar(cliente);

        return ClienteDTO.de(cliente);
    }
}
