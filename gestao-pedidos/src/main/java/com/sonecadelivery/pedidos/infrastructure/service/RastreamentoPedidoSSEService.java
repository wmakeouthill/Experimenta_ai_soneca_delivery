package com.sonecadelivery.pedidos.infrastructure.service;

import com.sonecadelivery.pedidos.infrastructure.events.RastreamentoEventPublisher.LocalizacaoAtualizadaEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Serviço SSE para rastreamento de pedidos.
 * Envia atualizações de localização em tempo real para clientes.
 * 
 * Performance:
 * - CopyOnWriteArrayList para lista de emitters (thread-safe, leitura rápida)
 * - ConcurrentHashMap para índice pedidoId -> emitters
 * - @Async para não bloquear thread principal ao enviar eventos
 * - Heartbeat a cada 25 segundos para manter conexões ativas
 * 
 * Permite que múltiplos clientes rastreiem o mesmo pedido simultaneamente.
 */
@Service
@Slf4j
public class RastreamentoPedidoSSEService {

    /**
     * Mapa de pedidoId -> lista de emitters conectados.
     * Permite múltiplos clientes rastreando o mesmo pedido.
     */
    private final Map<String, List<SseEmitter>> emittersPorPedido = new ConcurrentHashMap<>();

    /**
     * Registra um novo cliente SSE para rastreamento de um pedido.
     * 
     * @param pedidoId ID do pedido a ser rastreado
     * @return SseEmitter para o cliente
     */
    public SseEmitter registrar(String pedidoId) {
        // Timeout de 10 minutos (com heartbeat a cada 25s)
        SseEmitter emitter = new SseEmitter(600_000L);

        // Remove ao completar, timeout ou erro
        emitter.onCompletion(() -> {
            log.debug("SSE completado para pedido {}", pedidoId);
            removerEmitter(pedidoId, emitter);
        });
        emitter.onTimeout(() -> {
            log.debug("SSE timeout para pedido {}", pedidoId);
            removerEmitter(pedidoId, emitter);
        });
        emitter.onError((ex) -> {
            log.warn("Erro no SSE para pedido {}: {}", pedidoId, ex.getMessage());
            removerEmitter(pedidoId, emitter);
        });

        // Adiciona à lista de emitters do pedido
        emittersPorPedido.computeIfAbsent(pedidoId, k -> new CopyOnWriteArrayList<>())
                .add(emitter);

        log.info("Novo cliente SSE registrado para rastreamento do pedido {}. Total: {}",
                pedidoId, emittersPorPedido.get(pedidoId).size());

        // Envia evento inicial para confirmar conexão
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("{\"status\":\"connected\",\"pedidoId\":\"" + pedidoId + "\"}"));
        } catch (IOException e) {
            log.warn("Erro ao enviar evento de conexão para pedido {}", pedidoId);
        }

        return emitter;
    }

    /**
     * Heartbeat a cada 25 segundos para manter conexões SSE ativas.
     * Evita timeout de proxies e navegadores.
     */
    @Scheduled(fixedRate = 25000)
    public void enviarHeartbeat() {
        if (emittersPorPedido.isEmpty()) {
            return;
        }

        log.debug("Enviando heartbeat para {} pedidos", emittersPorPedido.size());

        emittersPorPedido.forEach((pedidoId, emitters) -> {
            emitters.removeIf(emitter -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("ping")
                            .data("{\"timestamp\":" + System.currentTimeMillis() + "}"));
                    return false; // Mantém emitter
                } catch (IOException e) {
                    log.debug("Heartbeat falhou para pedido {}, removendo emitter", pedidoId);
                    return true; // Remove emitter com erro
                }
            });

            // Remove entrada se não há mais emitters
            if (emitters.isEmpty()) {
                emittersPorPedido.remove(pedidoId);
            }
        });
    }

    /**
     * Escuta eventos de localização atualizada e envia para clientes conectados.
     * Executado de forma assíncrona para não bloquear a thread principal.
     */
    @EventListener
    @Async
    public void onLocalizacaoAtualizada(LocalizacaoAtualizadaEvent event) {
        String pedidoId = event.pedidoId();
        List<SseEmitter> emitters = emittersPorPedido.get(pedidoId);

        if (emitters == null || emitters.isEmpty()) {
            log.debug("Nenhum cliente SSE conectado para pedido {}", pedidoId);
            return;
        }

        log.info("Enviando localização para {} cliente(s) do pedido {}", emitters.size(), pedidoId);

        // Envia evento para todos os clientes conectados
        emitters.removeIf(emitter -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("localizacao-atualizada")
                        .data(event));
                return false; // Mantém o emitter
            } catch (IOException e) {
                log.warn("Erro ao enviar evento SSE para pedido {}: {}", pedidoId, e.getMessage());
                return true; // Remove emitter com erro
            }
        });

        // Remove entrada do mapa se não há mais emitters
        if (emitters.isEmpty()) {
            emittersPorPedido.remove(pedidoId);
        }
    }

    /**
     * Remove um emitter da lista do pedido de forma thread-safe.
     */
    private void removerEmitter(String pedidoId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersPorPedido.get(pedidoId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersPorPedido.remove(pedidoId);
                log.debug("Todos os clientes desconectados do pedido {}", pedidoId);
            }
        }
    }

    /**
     * Retorna o número de conexões SSE ativas.
     */
    public int getConexoesAtivas() {
        return emittersPorPedido.values().stream()
                .mapToInt(List::size)
                .sum();
    }
}
