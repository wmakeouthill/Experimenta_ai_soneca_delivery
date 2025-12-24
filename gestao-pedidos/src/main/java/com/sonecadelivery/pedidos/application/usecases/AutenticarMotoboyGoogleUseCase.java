package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.MotoboyDTO;
import com.sonecadelivery.pedidos.application.dto.MotoboyGoogleLoginRequest;
import com.sonecadelivery.pedidos.application.dto.MotoboyLoginResponse;
import com.sonecadelivery.pedidos.application.ports.GoogleAuthServicePort;
import com.sonecadelivery.pedidos.application.ports.MotoboyJwtServicePort;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Motoboy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Use case para autenticação de motoboy via Google OAuth.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AutenticarMotoboyGoogleUseCase {

    private final MotoboyRepositoryPort motoboyRepository;
    private final GoogleAuthServicePort googleAuthService;
    private final MotoboyJwtServicePort jwtService;

    @Transactional
    public MotoboyLoginResponse executar(MotoboyGoogleLoginRequest request) {
        log.info("Iniciando autenticação de motoboy via Google OAuth");

        // Validar token do Google e obter dados
        GoogleAuthServicePort.GoogleUserInfo googleUser = googleAuthService.validarTokenGoogle(request.getGoogleToken());

        // Buscar motoboy existente pelo googleId
        Optional<Motoboy> motoboyExistente = motoboyRepository.buscarPorGoogleId(googleUser.googleId());

        Motoboy motoboy;

        if (motoboyExistente.isPresent()) {
            // Motoboy já existe com este googleId - fazer login
            log.info("Motoboy encontrado pelo Google ID: {}", googleUser.googleId());
            motoboy = motoboyExistente.get();
            motoboy.registrarAcesso();
            motoboyRepository.salvar(motoboy);
        } else {
            // Verificar se existe motoboy com mesmo email
            Optional<Motoboy> motoboyPorEmail = motoboyRepository.buscarPorEmail(googleUser.email());

            if (motoboyPorEmail.isPresent()) {
                // Motoboy existe com este email - vincular Google
                log.info("Motoboy encontrado pelo email, vinculando Google: {}", googleUser.email());
                motoboy = motoboyPorEmail.get();
                motoboy.vincularGoogle(googleUser.googleId(), googleUser.fotoUrl());
                motoboy.registrarAcesso();
                motoboyRepository.salvar(motoboy);
            } else {
                // Criar novo motoboy via Google
                log.info("Criando novo motoboy via Google OAuth: {}", googleUser.email());
                motoboy = Motoboy.criarViaGoogle(
                        googleUser.nome(),
                        googleUser.email(),
                        googleUser.googleId(),
                        googleUser.fotoUrl());
                motoboyRepository.salvar(motoboy);
            }
        }

        // Gerar token JWT
        String token = jwtService.gerarToken(motoboy);

        log.info("Autenticação de motoboy concluída com sucesso. ID: {}", motoboy.getId());

        return MotoboyLoginResponse.of(token, MotoboyDTO.de(motoboy));
    }
}

