package com.snackbar.clientes.application.usecases;

import com.snackbar.clientes.application.dto.ClienteDTO;
import com.snackbar.clientes.application.dto.VincularGoogleRequest;
import com.snackbar.clientes.application.ports.ClienteRepositoryPort;
import com.snackbar.clientes.application.ports.GoogleAuthServicePort;
import com.snackbar.clientes.application.ports.GoogleUserInfo;
import com.snackbar.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VincularGoogleUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final GoogleAuthServicePort googleAuthService;

    public ClienteDTO executar(String clienteId, VincularGoogleRequest request) {
        // Buscar cliente
        Cliente cliente = clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        // Validar token do Google
        GoogleUserInfo googleUser = googleAuthService.validarTokenGoogle(request.getGoogleToken());

        // Verificar se este Google já está vinculado a outro cliente
        Optional<Cliente> clienteComGoogle = clienteRepository.buscarPorGoogleId(googleUser.googleId());
        if (clienteComGoogle.isPresent() && !clienteComGoogle.get().getId().equals(clienteId)) {
            throw new IllegalArgumentException("Esta conta Google já está vinculada a outro cliente");
        }

        // Vincular Google
        cliente.vincularGoogle(googleUser.googleId(), googleUser.fotoUrl());

        // Se não tinha email, definir o email do Google
        if (cliente.getEmail() == null || cliente.getEmail().isEmpty()) {
            cliente.atualizarEmail(googleUser.email());
        }

        // Salvar
        Cliente salvo = clienteRepository.salvar(cliente);

        return ClienteDTO.de(salvo);
    }
}
