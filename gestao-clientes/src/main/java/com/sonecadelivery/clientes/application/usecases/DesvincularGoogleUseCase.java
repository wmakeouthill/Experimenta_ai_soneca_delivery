package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DesvincularGoogleUseCase {

    private final ClienteRepositoryPort clienteRepository;

    public ClienteDTO executar(String clienteId) {
        // Buscar cliente
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        // Verificar se tem Google vinculado
        if (!cliente.temGoogleVinculado()) {
            throw new IllegalArgumentException("Cliente não possui Google vinculado");
        }

        // Verificar se tem outra forma de login (senha ou telefone)
        if (!cliente.temSenha() && cliente.getTelefone() == null) {
            throw new IllegalArgumentException(
                    "Não é possível desvincular o Google sem outra forma de login configurada");
        }

        // Desvincular
        cliente.desvincularGoogle();

        // Salvar
        Cliente salvo = clienteRepository.salvar(cliente);

        return ClienteDTO.de(salvo);
    }
}
