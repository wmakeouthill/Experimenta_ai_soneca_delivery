package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.dto.SessaoTrabalhoDTO;
import com.snackbar.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.snackbar.pedidos.domain.entities.SessaoTrabalho;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Use case para iniciar uma nova sessão de trabalho.
 * 
 * PROTEÇÃO DE CONCORRÊNCIA:
 * A anotação @Transactional garante que a verificação de sessão ativa
 * e a criação da nova sessão aconteçam de forma atômica, evitando que
 * duas sessões sejam criadas simultaneamente.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IniciarSessaoTrabalhoUseCase {

    private final SessaoTrabalhoRepositoryPort repository;

    @Transactional
    public SessaoTrabalhoDTO executar(String usuarioId, BigDecimal valorAbertura) {
        validarNaoHaSessaoAtiva();

        Integer numeroSessao = calcularProximoNumeroSessao();
        SessaoTrabalho sessao = SessaoTrabalho.criar(numeroSessao, usuarioId, valorAbertura);

        @SuppressWarnings("null") // repository.salvar() nunca retorna null
        SessaoTrabalho sessaoSalva = repository.salvar(sessao);

        log.info("Sessão de trabalho iniciada - Número: {}, Usuário: {}",
                sessaoSalva.getNumeroSessao(), usuarioId);

        return SessaoTrabalhoDTO.de(sessaoSalva);
    }

    private void validarNaoHaSessaoAtiva() {
        Optional<SessaoTrabalho> sessaoAtiva = repository.buscarSessaoAtiva();
        if (sessaoAtiva.isPresent()) {
            throw new ValidationException(
                    "Já existe uma sessão ativa. Finalize ou pause a sessão atual antes de iniciar uma nova.");
        }
    }

    private Integer calcularProximoNumeroSessao() {
        LocalDate hoje = LocalDate.now();
        Optional<SessaoTrabalho> ultimaSessao = repository.buscarUltimaSessaoPorData(hoje);

        if (ultimaSessao.isEmpty()) {
            return 1;
        }

        return ultimaSessao.get().getNumeroSessao() + 1;
    }
}
