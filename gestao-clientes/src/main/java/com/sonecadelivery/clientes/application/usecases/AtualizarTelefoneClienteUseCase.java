package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.AtualizarTelefoneRequest;
import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
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
