package com.sonecadelivery.orquestrador.service;

import com.sonecadelivery.pedidos.application.usecases.BuscarSessaoAtivaUseCase;
import com.sonecadelivery.pedidos.domain.entities.StatusSessao;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Serviço para gerenciar Server-Sent Events (SSE) do status da loja.
 * Permite que clientes do delivery recebam atualizações em tempo real
 * quando a sessão de trabalho muda (abre, pausa, fecha).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StatusLojaSSEService {

    private final BuscarSessaoAtivaUseCase buscarSessaoAtivaUseCase;

    /** Lista thread-safe de emitters conectados */
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    /** Status atual da loja (cache para detectar mudanças) */
    private volatile StatusLoja statusAtual = StatusLoja.FECHADA;
    private volatile String mensagemAtual = "A loja está fechada no momento.";
    private volatile Integer numeroSessaoAtual = null;

    /**
     * Enum para status da loja.
     */
    public enum StatusLoja {
        ABERTA, PAUSADA, FECHADA
    }

    /**
     * Record para resposta de status.
     */
    public record StatusLojaResponse(
            StatusLoja status,
            String mensagem,
            Integer numeroSessao) {
    }

    /**
     * Registra um novo cliente SSE.
     * 
     * @return SseEmitter para o cliente
     */
    public SseEmitter registrar() {
        // Timeout de 5 minutos (reconecta automaticamente)
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L);

        // Remove ao completar ou erro
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(e -> emitters.remove(emitter));

        emitters.add(emitter);
        log.debug("Novo cliente SSE registrado. Total: {}", emitters.size());

        // Envia status atual imediatamente
        try {
            emitter.send(SseEmitter.event()
                    .name("status")
                    .data(new StatusLojaResponse(statusAtual, mensagemAtual, numeroSessaoAtual)));
        } catch (IOException e) {
            emitter.completeWithError(e);
        }

        return emitter;
    }

    /**
     * Verifica o status da sessão periodicamente e notifica clientes se mudou.
     * Executa a cada 3 segundos.
     */
    @Scheduled(fixedRate = 3000)
    public void verificarENotificar() {
        var sessaoOpt = buscarSessaoAtivaUseCase.executar();

        StatusLoja novoStatus;
        String novaMensagem;
        Integer novoNumeroSessao;

        if (sessaoOpt.isEmpty()) {
            novoStatus = StatusLoja.FECHADA;
            novaMensagem = "A loja está fechada no momento.";
            novoNumeroSessao = null;
        } else {
            var sessao = sessaoOpt.get();
            novoNumeroSessao = sessao.getNumeroSessao();

            if (sessao.getStatus() == StatusSessao.PAUSADA) {
                novoStatus = StatusLoja.PAUSADA;
                novaMensagem = "Estamos temporariamente indisponíveis. Por favor, tente novamente em alguns minutos.";
            } else {
                novoStatus = StatusLoja.ABERTA;
                novaMensagem = null;
            }
        }

        // Só notifica se houve mudança
        if (novoStatus != statusAtual) {
            log.info("Status da loja mudou: {} -> {}", statusAtual, novoStatus);
            statusAtual = novoStatus;
            mensagemAtual = novaMensagem;
            numeroSessaoAtual = novoNumeroSessao;

            notificarTodos(new StatusLojaResponse(novoStatus, novaMensagem, novoNumeroSessao));
        }
    }

    /**
     * Envia um heartbeat para manter a conexão ativa (evita timeout de
     * proxies/navegadores).
     * Executa a cada 20 segundos.
     */
    @Scheduled(fixedRate = 20000)
    public void enviarHeartbeat() {
        if (emitters.isEmpty())
            return;

        List<SseEmitter> emittersMortos = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                // Envia um comentário vazio ou evento de ping
                emitter.send(SseEmitter.event().name("ping").data("pong"));
            } catch (IOException e) {
                emittersMortos.add(emitter);
            }
        }

        if (!emittersMortos.isEmpty()) {
            emitters.removeAll(emittersMortos);
            log.debug("Removidos {} clientes mortos durante heartbeat", emittersMortos.size());
        }
    }

    /**
     * Notifica todos os clientes conectados sobre uma mudança de status.
     */
    private void notificarTodos(StatusLojaResponse status) {
        log.debug("Notificando {} clientes sobre mudança de status", emitters.size());

        List<SseEmitter> emittersMortos = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("status")
                        .data(status));
            } catch (IOException e) {
                emittersMortos.add(emitter);
            }
        }

        // Remove emitters que falharam
        emitters.removeAll(emittersMortos);
    }

    /**
     * Retorna o status atual (para endpoint síncrono).
     */
    public StatusLojaResponse getStatusAtual() {
        return new StatusLojaResponse(statusAtual, mensagemAtual, numeroSessaoAtual);
    }

    /**
     * Força uma verificação e notificação imediata.
     * Útil quando a sessão é pausada/retomada manualmente.
     */
    public void forcarAtualizacao() {
        verificarENotificar();
    }
}
