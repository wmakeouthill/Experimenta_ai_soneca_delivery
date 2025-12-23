package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.AtualizarPerfilRequest;
import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AtualizarPerfilClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;

    @Transactional
    public ClienteDTO executar(String clienteId, AtualizarPerfilRequest request) {
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new NotFoundException("Cliente não encontrado: " + clienteId));

        cliente.atualizarDadosCadastrais(request.getNome(), request.getTelefone(), request.getEmail());

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
