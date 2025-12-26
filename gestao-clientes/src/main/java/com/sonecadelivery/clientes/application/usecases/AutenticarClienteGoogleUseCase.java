package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.dto.ClienteGoogleLoginRequest;
import com.sonecadelivery.clientes.application.dto.ClienteLoginResponse;
import com.sonecadelivery.clientes.application.ports.ClienteJwtServicePort;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.application.ports.GoogleAuthServicePort;
import com.sonecadelivery.clientes.application.ports.GoogleUserInfo;
import com.sonecadelivery.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AutenticarClienteGoogleUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final GoogleAuthServicePort googleAuthService;
    private final ClienteJwtServicePort jwtService;

    public ClienteLoginResponse executar(ClienteGoogleLoginRequest request) {
        // Validar token do Google e obter dados
        GoogleUserInfo googleUser = googleAuthService.validarTokenGoogle(request.getGoogleToken());

        // Buscar cliente existente pelo googleId
        Optional<Cliente> clienteExistente = clienteRepository.buscarPorGoogleId(googleUser.googleId());

        Cliente cliente;

        if (clienteExistente.isPresent()) {
            // Cliente já existe com este googleId - fazer login
            cliente = clienteExistente.get();
            cliente.registrarAcesso();
            cliente = clienteRepository.salvar(cliente); // Usa o cliente retornado
        } else {
            // Verificar se existe cliente com mesmo email
            Optional<Cliente> clientePorEmail = clienteRepository.buscarPorEmail(googleUser.email());

            if (clientePorEmail.isPresent()) {
                // Cliente existe com este email - vincular Google
                cliente = clientePorEmail.get();
                cliente.vincularGoogle(googleUser.googleId(), googleUser.fotoUrl());
                cliente.registrarAcesso();
                cliente = clienteRepository.salvar(cliente); // Usa o cliente retornado
            } else {
                // Criar novo cliente via Google
                Cliente novoCliente = Cliente.criarViaGoogle(
                        googleUser.nome(),
                        googleUser.email(),
                        googleUser.googleId(),
                        googleUser.fotoUrl());
                // IMPORTANTE: Usar o cliente retornado do repositório com o ID correto do banco
                cliente = clienteRepository.salvar(novoCliente);
            }
        }

        // Gerar token com o cliente que tem o ID correto do banco de dados
        String token = jwtService.gerarToken(cliente);

        return ClienteLoginResponse.of(token, ClienteDTO.de(cliente));
    }
}
