package com.snackbar.clientes.application.usecases;

import com.snackbar.clientes.application.dto.ClienteDTO;
import com.snackbar.clientes.application.dto.ClienteLoginRequest;
import com.snackbar.clientes.application.dto.ClienteLoginResponse;
import com.snackbar.clientes.application.ports.ClienteJwtServicePort;
import com.snackbar.clientes.application.ports.ClienteRepositoryPort;
import com.snackbar.clientes.application.ports.ClienteSenhaServicePort;
import com.snackbar.clientes.domain.entities.Cliente;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AutenticarClienteUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final ClienteSenhaServicePort senhaService;
    private final ClienteJwtServicePort jwtService;

    public ClienteLoginResponse executar(ClienteLoginRequest request) {
        // Buscar cliente pelo telefone
        Cliente cliente = clienteRepository.buscarPorTelefone(request.getTelefone())
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Credenciais inválidas"));

        // Verificar se tem senha definida
        if (!cliente.temSenha()) {
            throw new IllegalArgumentException("Cliente não possui senha definida. Por favor, cadastre uma senha.");
        }

        // Validar senha
        boolean senhaValida = senhaService.verificarSenha(request.getSenha(), cliente.getSenhaHash());
        if (!senhaValida) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }

        // Registrar acesso
        cliente.registrarAcesso();
        clienteRepository.salvar(cliente);

        // Gerar token
        String token = jwtService.gerarToken(cliente);

        return ClienteLoginResponse.of(token, ClienteDTO.de(cliente));
    }
}
