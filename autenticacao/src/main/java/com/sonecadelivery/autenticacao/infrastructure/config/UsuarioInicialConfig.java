package com.sonecadelivery.autenticacao.infrastructure.config;

import com.sonecadelivery.autenticacao.domain.entities.Role;
import com.sonecadelivery.autenticacao.domain.entities.Usuario;
import com.sonecadelivery.autenticacao.domain.ports.UsuarioRepositoryPort;
import com.sonecadelivery.autenticacao.domain.services.SenhaService;
import com.sonecadelivery.autenticacao.domain.valueobjects.Email;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UsuarioInicialConfig implements CommandLineRunner {

    private final UsuarioRepositoryPort usuarioRepository;
    private final SenhaService senhaService;

    @Override
    public void run(String... args) {
        criarUsuarioAdminSeNaoExistir();
    }

    @SuppressWarnings("null") // Usuario.criar() nunca retorna null, repository.salvar() nunca retorna null
    private void criarUsuarioAdminSeNaoExistir() {
        try {
            Email emailAdmin = Email.of("admin@snackbar.com");

            if (usuarioRepository.existePorEmail(emailAdmin)) {
                log.info("Usuário administrador inicial já existe");
                return;
            }

            var senhaHash = senhaService.criarSenhaComHash("admin123");
            Usuario admin = Usuario.criar(
                    "Admin",
                    emailAdmin,
                    senhaHash,
                    Role.ADMINISTRADOR);

            usuarioRepository.salvar(admin);
            log.info("Usuário administrador inicial criado com sucesso");
            log.info("Email: admin@snackbar.com | Senha: admin123");

        } catch (Exception e) {
            log.error("Erro ao criar usuário administrador inicial", e);
        }
    }
}
