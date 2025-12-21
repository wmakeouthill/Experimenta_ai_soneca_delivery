package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BuscarClientePorIdUseCase {
    
    private final ClienteRepositoryPort clienteRepository;
    
    public ClienteDTO executar(String id) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do cliente não pode ser nulo ou vazio");
        }
        
        return clienteRepository.buscarPorId(id)
            .map(ClienteDTO::de)
            .orElseThrow(() -> new ValidationException("Cliente não encontrado com ID: " + id));
    }
}

