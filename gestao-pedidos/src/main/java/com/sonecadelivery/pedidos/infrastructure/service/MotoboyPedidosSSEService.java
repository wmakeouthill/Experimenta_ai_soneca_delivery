package com.sonecadelivery.pedidos.infrastructure.service;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.usecases.ListarPedidosDoMotoboyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Serviço para gerenciar Server-Sent Events (SSE) de pedidos do motoboy.
 * Permite que motoboys recebam atualizações em tempo real quando seus pedidos mudam.
 * 
 * Suporta múltiplos motoboys conectados simultaneamente, cada um recebendo
 * apenas atualizações dos seus próprios pedidos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MotoboyPedidosSSEService {

    private final ListarPedidosDoMotoboyUseCase listarPedidosDoMotoboyUseCase;

    /**
     * Mapa thread-safe de motoboyId -> lista de emitters conectados.
     * Permite múltiplas conexões do mesmo motoboy (ex: múltiplas abas).
     */
    private final Map<String, List<SseEmitter>> emittersPorMotoboy = new ConcurrentHashMap<>();

    /**
     * Cache de última lista de pedidos por motoboy para detectar mudanças.
     */
    private final Map<String, List<PedidoDTO>> cachePedidos = new ConcurrentHashMap<>();

    /**
     * Registra um novo cliente SSE para um motoboy específico.
     * 
     * @param motoboyId ID do motoboy
     * @return SseEmitter para o cliente
     */
    public SseEmitter registrar(String motoboyId) {
        // Timeout de 5 minutos (reconecta automaticamente)
        SseEmitter emitter = new SseEmitter(5 * 60 * 1000L);

        // Remove ao completar, timeout ou erro
        emitter.onCompletion(() -> removerEmitter(motoboyId, emitter));
        emitter.onTimeout(() -> removerEmitter(motoboyId, emitter));
        emitter.onError(e -> {
            log.warn("Erro no SSE do motoboy {}: {}", motoboyId, e.getMessage());
            removerEmitter(motoboyId, emitter);
        });

        // Adiciona à lista de emitters do motoboy
        emittersPorMotoboy.computeIfAbsent(motoboyId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.debug("Novo cliente SSE registrado para motoboy {}. Total conectados: {}", 
                motoboyId, emittersPorMotoboy.get(motoboyId).size());

        // Envia lista atual de pedidos imediatamente
        try {
            List<PedidoDTO> pedidosAtuais = listarPedidosDoMotoboyUseCase.executar(motoboyId);
            cachePedidos.put(motoboyId, pedidosAtuais);
            
            emitter.send(SseEmitter.event()
                    .name("pedidos-update")
                    .data(pedidosAtuais));
        } catch (Exception e) {
            log.error("Erro ao enviar pedidos iniciais para motoboy {}: {}", motoboyId, e.getMessage(), e);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(Map.of("message", "Erro ao carregar pedidos iniciais")));
            } catch (IOException ioException) {
                emitter.completeWithError(ioException);
            }
        }

        return emitter;
    }

    /**
     * Remove um emitter da lista do motoboy.
     */
    private void removerEmitter(String motoboyId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersPorMotoboy.get(motoboyId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                emittersPorMotoboy.remove(motoboyId);
                cachePedidos.remove(motoboyId);
                log.debug("Removido último cliente SSE do motoboy {}. Limpando cache.", motoboyId);
            }
        }
    }

    /**
     * Verifica mudanças nos pedidos de todos os motoboys conectados e notifica.
     * Executa a cada 3 segundos.
     */
    @Scheduled(fixedRate = 3000)
    public void verificarENotificar() {
        if (emittersPorMotoboy.isEmpty()) {
            return;
        }

        for (Map.Entry<String, List<SseEmitter>> entry : emittersPorMotoboy.entrySet()) {
            String motoboyId = entry.getKey();
            List<SseEmitter> emitters = entry.getValue();

            if (emitters.isEmpty()) {
                continue;
            }

            try {
                List<PedidoDTO> pedidosAtuais = listarPedidosDoMotoboyUseCase.executar(motoboyId);
                List<PedidoDTO> pedidosAnteriores = cachePedidos.get(motoboyId);

                // Verifica se houve mudanças
                if (houveMudancas(pedidosAnteriores, pedidosAtuais)) {
                    log.debug("Mudanças detectadas nos pedidos do motoboy {}. Notificando {} clientes.", 
                            motoboyId, emitters.size());
                    
                    cachePedidos.put(motoboyId, pedidosAtuais);
                    notificarMotoboy(motoboyId, pedidosAtuais);
                }
            } catch (Exception e) {
                log.error("Erro ao verificar pedidos do motoboy {}: {}", motoboyId, e.getMessage(), e);
            }
        }
    }

    /**
     * Envia um heartbeat para manter conexões ativas.
     * Executa a cada 20 segundos.
     */
    @Scheduled(fixedRate = 20000)
    public void enviarHeartbeat() {
        if (emittersPorMotoboy.isEmpty()) {
            return;
        }

        for (Map.Entry<String, List<SseEmitter>> entry : emittersPorMotoboy.entrySet()) {
            String motoboyId = entry.getKey();
            List<SseEmitter> emitters = entry.getValue();

            List<SseEmitter> emittersMortos = new CopyOnWriteArrayList<>();

            for (SseEmitter emitter : emitters) {
                try {
                    emitter.send(SseEmitter.event().name("ping").data("pong"));
                } catch (IOException e) {
                    emittersMortos.add(emitter);
                }
            }

            if (!emittersMortos.isEmpty()) {
                emitters.removeAll(emittersMortos);
                log.debug("Removidos {} clientes mortos do motoboy {} durante heartbeat", 
                        emittersMortos.size(), motoboyId);
                
                if (emitters.isEmpty()) {
                    emittersPorMotoboy.remove(motoboyId);
                    cachePedidos.remove(motoboyId);
                }
            }
        }
    }

    /**
     * Notifica todos os clientes de um motoboy sobre mudanças nos pedidos.
     */
    private void notificarMotoboy(String motoboyId, List<PedidoDTO> pedidos) {
        List<SseEmitter> emitters = emittersPorMotoboy.get(motoboyId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        List<SseEmitter> emittersMortos = new CopyOnWriteArrayList<>();

        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("pedidos-update")
                        .data(pedidos));
            } catch (IOException e) {
                log.debug("Erro ao enviar atualização para cliente do motoboy {}: {}", motoboyId, e.getMessage());
                emittersMortos.add(emitter);
            }
        }

        // Remove emitters que falharam
        if (!emittersMortos.isEmpty()) {
            emitters.removeAll(emittersMortos);
            if (emitters.isEmpty()) {
                emittersPorMotoboy.remove(motoboyId);
                cachePedidos.remove(motoboyId);
            }
        }
    }

    /**
     * Verifica se houve mudanças comparando duas listas de pedidos.
     */
    private boolean houveMudancas(List<PedidoDTO> anteriores, List<PedidoDTO> atuais) {
        if (anteriores == null || anteriores.isEmpty()) {
            return !atuais.isEmpty();
        }

        if (anteriores.size() != atuais.size()) {
            return true;
        }

        // Cria map para comparação O(n)
        Map<String, PedidoDTO> mapAnteriores = new java.util.HashMap<>();
        for (PedidoDTO pedido : anteriores) {
            mapAnteriores.put(pedido.getId(), pedido);
        }

        // Verifica se algum pedido mudou
        for (PedidoDTO pedidoAtual : atuais) {
            PedidoDTO pedidoAnterior = mapAnteriores.get(pedidoAtual.getId());
            if (pedidoAnterior == null) {
                return true; // Novo pedido
            }
            
            // Verifica mudanças em status ou updatedAt
            if (!pedidoAnterior.getStatus().equals(pedidoAtual.getStatus()) ||
                !pedidoAnterior.getUpdatedAt().equals(pedidoAtual.getUpdatedAt())) {
                return true; // Pedido mudou
            }
        }

        return false;
    }

    /**
     * Força uma atualização imediata para um motoboy específico.
     * Útil quando há mudanças conhecidas (ex: após atualização de status).
     */
    public void forcarAtualizacao(String motoboyId) {
        List<SseEmitter> emitters = emittersPorMotoboy.get(motoboyId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        try {
            List<PedidoDTO> pedidos = listarPedidosDoMotoboyUseCase.executar(motoboyId);
            cachePedidos.put(motoboyId, pedidos);
            notificarMotoboy(motoboyId, pedidos);
        } catch (Exception e) {
            log.error("Erro ao forçar atualização para motoboy {}: {}", motoboyId, e.getMessage(), e);
        }
    }
}

