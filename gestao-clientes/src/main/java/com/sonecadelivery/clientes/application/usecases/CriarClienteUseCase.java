package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.CriarClienteRequest;
import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CriarClienteUseCase {
    
    private final ClienteRepositoryPort clienteRepository;
    
    public ClienteDTO executar(CriarClienteRequest request) {
        Cliente cliente = Cliente.criar(
            request.getNome(),
            request.getTelefone(),
            request.getEmail(),
            request.getCpf(),
            request.getObservacoes()
        );
        
        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        Cliente clienteSalvo = clienteRepository.salvar(cliente);
        
        return ClienteDTO.de(clienteSalvo);
    }
}

