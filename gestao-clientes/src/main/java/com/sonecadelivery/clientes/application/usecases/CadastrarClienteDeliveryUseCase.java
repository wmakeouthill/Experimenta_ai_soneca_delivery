package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.CadastrarClienteDeliveryRequest;
import com.sonecadelivery.clientes.application.dto.ClienteDTO;
import com.sonecadelivery.clientes.application.dto.ClienteLoginResponse;
import com.sonecadelivery.clientes.application.ports.ClienteJwtServicePort;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.kernel.domain.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.sonecadelivery.clientes.domain.entities.Cliente;

/**
 * UseCase para cadastrar cliente via tela de delivery.
 * Cria cliente com nome, telefone, email, senha e endereço completo.
 */
@Service
@RequiredArgsConstructor
public class CadastrarClienteDeliveryUseCase {

    private final ClienteRepositoryPort clienteRepository;
    private final ClienteJwtServicePort jwtService;
    private final PasswordEncoder passwordEncoder;

    public ClienteLoginResponse executar(CadastrarClienteDeliveryRequest request) {
        // Normalizar telefone
        String telefone = normalizarTelefone(request.getTelefone());

        // Verificar se já existe cliente com este telefone
        if (!clienteRepository.buscarPorTelefone(telefone).isEmpty()) {
            throw new BusinessException("Já existe um cliente cadastrado com este telefone");
        }

        // Verificar se já existe cliente com este email (se informado)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!clienteRepository.buscarPorEmail(request.getEmail()).isEmpty()) {
                throw new BusinessException("Já existe um cliente cadastrado com este email");
            }
        }

        // Criar cliente
        Cliente cliente = Cliente.criar(
                request.getNome(),
                telefone,
                request.getEmail(),
                null, // CPF não é obrigatório no cadastro delivery
                null // Observações
        );

        // Definir senha
        String senhaHash = passwordEncoder.encode(request.getSenha());
        cliente.definirSenha(senhaHash);

        // Definir endereço
        cliente.atualizarEndereco(
                request.getLogradouro(),
                request.getNumero(),
                request.getComplemento(),
                request.getBairro(),
                request.getCidade(),
                request.getEstado(),
                request.getCep(),
                request.getPontoReferencia());

        // Salvar cliente
        clienteRepository.salvar(cliente);

        // Gerar token JWT
        String token = jwtService.gerarToken(cliente);

        return ClienteLoginResponse.builder()
                .token(token)
                .tipo("Bearer")
                .cliente(ClienteDTO.de(cliente))
                .build();
    }

    private String normalizarTelefone(String telefone) {
        if (telefone == null)
            return null;
        return telefone.replaceAll("\\D", "");
    }
}
