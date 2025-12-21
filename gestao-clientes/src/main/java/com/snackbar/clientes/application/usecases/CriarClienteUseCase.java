package com.snackbar.clientes.application.usecases;

import com.snackbar.clientes.application.dto.CriarClienteRequest;
import com.snackbar.clientes.application.dto.ClienteDTO;
import com.snackbar.clientes.application.ports.ClienteRepositoryPort;
import com.snackbar.clientes.domain.entities.Cliente;
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

