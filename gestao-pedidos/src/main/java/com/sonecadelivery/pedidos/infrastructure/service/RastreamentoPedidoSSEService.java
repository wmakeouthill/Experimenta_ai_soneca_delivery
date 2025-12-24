package com.sonecadelivery.pedidos.infrastructure.service;

import com.sonecadelivery.pedidos.infrastructure.events.RastreamentoEventPublisher.LocalizacaoAtualizadaEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Serviço SSE para rastreamento de pedidos.
 * Similar ao MotoboyPedidosSSEService existente.
 * 
 * Performance:
 * - CopyOnWriteArrayList para lista de emitters (thread-safe, leitura rápida)
 * - ConcurrentHashMap para índice pedidoId -> emitters
 * - @Async para não bloquear thread principal ao enviar eventos
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
        // Timeout de 5 minutos (reconecta automaticamente)
        SseEmitter emitter = new SseEmitter(300_000L);
        
        // Remove ao completar, timeout ou erro
        emitter.onCompletion(() -> removerEmitter(pedidoId, emitter));
        emitter.onTimeout(() -> removerEmitter(pedidoId, emitter));
        emitter.onError((ex) -> {
            log.error("Erro no SSE para pedido {}: {}", pedidoId, ex.getMessage());
            removerEmitter(pedidoId, emitter);
        });
        
        // Adiciona à lista de emitters do pedido
        emittersPorPedido.computeIfAbsent(pedidoId, k -> new CopyOnWriteArrayList<>())
            .add(emitter);
        
        log.info("Novo cliente SSE registrado para rastreamento do pedido {}. Total: {}", 
            pedidoId, emittersPorPedido.get(pedidoId).size());
        
        return emitter;
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
            return;
        }
        
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
}

