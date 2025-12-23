package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.AtualizarEnderecoRequest;
import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * UseCase para atualizar endereço do cliente.
 */
@Service
@RequiredArgsConstructor
public class AtualizarEnderecoClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;

    public ClienteDTO executar(String clienteId, AtualizarEnderecoRequest request) {
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado"));

        cliente.atualizarEndereco(
                request.getLogradouro(),
                request.getNumero(),
                request.getComplemento(),
                request.getBairro(),
                request.getCidade(),
                request.getEstado(),
                request.getCep(),
                request.getPontoReferencia(),
                request.getLatitude(),
                request.getLongitude());

        clienteRepository.salvar(cliente);

        return ClienteDTO.de(cliente);
    }
}
