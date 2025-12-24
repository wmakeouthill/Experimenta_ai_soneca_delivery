package com.sonecadelivery.pedidos.infrastructure.gateway;

import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.dto.CriarClienteRequest;
import com.sonecadelivery.clientes.application.usecases.BuscarClientePorIdUseCase;
import com.sonecadelivery.clientes.application.usecases.CriarClienteUseCase;
import com.sonecadelivery.clientes.application.usecases.ListarClientesUseCase;
import com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO;
import com.sonecadelivery.pedidos.application.ports.ClienteGatewayPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Implementação do gateway de clientes para o módulo de pedidos.
 * Delega para os use cases do módulo gestao-clientes.
 */
@Component
@RequiredArgsConstructor
public class ClienteGatewayAdapter implements ClienteGatewayPort {

    private final ListarClientesUseCase listarClientesUseCase;
    private final CriarClienteUseCase criarClienteUseCase;
    private final BuscarClientePorIdUseCase buscarClientePorIdUseCase;

    @Override
    public Optional<ClientePublicoDTO> buscarPorTelefone(String telefone) {
        List<ClienteDTO> clientes = listarClientesUseCase.executarPorTelefone(telefone);

        return clientes.stream()
                .filter(c -> c.getTelefone() != null &&
                        c.getTelefone().replaceAll("\\D", "").equals(telefone.replaceAll("\\D", "")))
                .findFirst()
                .map(this::toPublicoDTO);
    }

    @Override
    public ClientePublicoDTO cadastrar(String nome, String telefone) {
        CriarClienteRequest request = new CriarClienteRequest();
        request.setNome(nome);
        request.setTelefone(telefone);
        // Outros campos ficam null pois são opcionais

        ClienteDTO clienteCriado = criarClienteUseCase.executar(request);
        return toPublicoDTO(clienteCriado);
    }

    @Override
    public Optional<ClientePublicoDTO> buscarPorId(String id) {
        try {
            ClienteDTO cliente = buscarClientePorIdUseCase.executar(id);
            return Optional.of(toPublicoDTO(cliente));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private ClientePublicoDTO toPublicoDTO(ClienteDTO cliente) {
        return new ClientePublicoDTO(
                cliente.getId(),
                cliente.getNome(),
                cliente.getTelefone(),
                cliente.getLatitude(),
                cliente.getLongitude());
    }
}
