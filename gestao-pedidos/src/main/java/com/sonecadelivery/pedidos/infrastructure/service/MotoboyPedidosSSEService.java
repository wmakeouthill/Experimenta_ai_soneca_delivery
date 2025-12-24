package com.sonecadelivery.pedidos.infrastructure.service;

import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.usecases.ListarPedidosDoMotoboyUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
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
            // Erros de conexão fechada são esperados e não devem ser logados
            // Remove silenciosamente - comportamento normal quando cliente desconecta
            removerEmitter(motoboyId, emitter);
        });

        // Adiciona à lista de emitters do motoboy
        emittersPorMotoboy.computeIfAbsent(motoboyId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("Novo cliente SSE registrado para motoboy {}. Total conectados: {}", 
                motoboyId, emittersPorMotoboy.get(motoboyId).size());

        // Envia lista atual de pedidos imediatamente
        // Usa executor assíncrono para não bloquear a thread principal
        try {
            List<PedidoDTO> pedidosAtuais = listarPedidosDoMotoboyUseCase.executar(motoboyId);
            cachePedidos.put(motoboyId, pedidosAtuais);
            
            // Tenta enviar, mas não falha se cliente já desconectou
            try {
                emitter.send(SseEmitter.event()
                        .name("pedidos-update")
                        .data(pedidosAtuais));
            } catch (IOException | IllegalStateException e) {
                // Cliente pode ter desconectado imediatamente ou emitter já completado
                // Remove silenciosamente - comportamento esperado
                removerEmitter(motoboyId, emitter);
            }
        } catch (Exception e) {
            log.error("Erro ao carregar pedidos iniciais para motoboy {}: {}", motoboyId, e.getMessage(), e);
            try {
                emitter.send(SseEmitter.event()
                        .name("error")
                        .data(Map.of("message", "Erro ao carregar pedidos iniciais: " + e.getMessage())));
            } catch (IOException | IllegalStateException ioException) {
                // Cliente desconectou ou emitter já completado - remove silenciosamente
                removerEmitter(motoboyId, emitter);
            }
        }

        return emitter;
    }

    /**
     * Remove um emitter da lista do motoboy de forma thread-safe.
     */
    private void removerEmitter(String motoboyId, SseEmitter emitter) {
        List<SseEmitter> emitters = emittersPorMotoboy.get(motoboyId);
        if (emitters != null) {
            synchronized (emitters) {
                // Re-valida dentro do lock para evitar remoção de lista que mudou
                List<SseEmitter> emittersAtuais = emittersPorMotoboy.get(motoboyId);
                if (emittersAtuais != null && emittersAtuais.remove(emitter)) {
                    if (emittersAtuais.isEmpty()) {
                        emittersPorMotoboy.remove(motoboyId);
                        cachePedidos.remove(motoboyId);
                    }
                }
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
                    log.info("Mudanças detectadas nos pedidos do motoboy {}. Notificando {} clientes.", 
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

            if (emitters == null || emitters.isEmpty()) {
                continue;
            }

            // Cria snapshot da lista para evitar race condition durante iteração
            List<SseEmitter> emittersSnapshot = new ArrayList<>(emitters);
            List<SseEmitter> emittersMortos = new ArrayList<>();

            for (SseEmitter emitter : emittersSnapshot) {
                // Pula emitters nulos (não deveria acontecer, mas segurança adicional)
                if (emitter == null) {
                    continue;
                }
                
                try {
                    emitter.send(SseEmitter.event().name("ping").data("pong"));
                } catch (IOException e) {
                    // Broken pipe ou cliente desconectado - comportamento esperado
                    // Não loga como erro, apenas remove silenciosamente
                    emittersMortos.add(emitter);
                } catch (IllegalStateException e) {
                    // Emitter já completado/timeout - remove silenciosamente
                    emittersMortos.add(emitter);
                } catch (RuntimeException e) {
                    // Pode incluir exceções do Spring/Tomcat relacionadas a conexões fechadas
                    String errorMsg = e.getMessage();
                    if (errorMsg != null && (errorMsg.contains("Broken pipe") || 
                                             errorMsg.contains("Connection reset") ||
                                             errorMsg.contains("closed") ||
                                             errorMsg.contains("Socket closed"))) {
                        // Comportamento esperado - remove silenciosamente
                        emittersMortos.add(emitter);
                    } else {
                        // Outros erros inesperados - loga como warning
                        log.warn("Erro inesperado no heartbeat para motoboy {}: {}", 
                                motoboyId, errorMsg);
                        emittersMortos.add(emitter);
                    }
                } catch (Exception e) {
                    // Outros erros inesperados - loga como warning
                    log.warn("Erro inesperado no heartbeat para motoboy {}: {}", 
                            motoboyId, e.getMessage());
                    emittersMortos.add(emitter);
                }
            }

            // Remove emitters que falharam de forma thread-safe
            if (!emittersMortos.isEmpty()) {
                synchronized (emitters) {
                    // Re-valida a lista dentro do lock para evitar remover de lista que mudou
                    List<SseEmitter> emittersAtuais = emittersPorMotoboy.get(motoboyId);
                    if (emittersAtuais != null) {
                        emittersAtuais.removeAll(emittersMortos);
                        if (emittersAtuais.isEmpty()) {
                            emittersPorMotoboy.remove(motoboyId);
                            cachePedidos.remove(motoboyId);
                        }
                    }
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

        // Cria snapshot da lista para evitar race condition durante iteração
        // CopyOnWriteArrayList garante thread-safety, mas snapshot evita modificações
        // durante a iteração que podem causar problemas
        List<SseEmitter> emittersSnapshot = new ArrayList<>(emitters);
        List<SseEmitter> emittersMortos = new ArrayList<>();

        for (SseEmitter emitter : emittersSnapshot) {
            // Pula emitters nulos (não deveria acontecer, mas segurança adicional)
            if (emitter == null) {
                continue;
            }
            
            try {
                emitter.send(SseEmitter.event()
                        .name("pedidos-update")
                        .data(pedidos));
            } catch (IOException e) {
                // Broken pipe ou cliente desconectado - comportamento esperado
                // Não loga como erro, apenas remove silenciosamente
                emittersMortos.add(emitter);
            } catch (IllegalStateException e) {
                // Emitter já completado/timeout - remove silenciosamente
                emittersMortos.add(emitter);
            } catch (RuntimeException e) {
                // Pode incluir exceções do Spring/Tomcat relacionadas a conexões fechadas
                String errorMsg = e.getMessage();
                if (errorMsg != null && (errorMsg.contains("Broken pipe") || 
                                         errorMsg.contains("Connection reset") ||
                                         errorMsg.contains("closed") ||
                                         errorMsg.contains("Socket closed"))) {
                    // Comportamento esperado - remove silenciosamente
                    emittersMortos.add(emitter);
                } else {
                    // Outros erros inesperados - loga como warning
                    log.warn("Erro ao enviar atualização para cliente do motoboy {}: {}", 
                            motoboyId, errorMsg);
                    emittersMortos.add(emitter);
                }
            } catch (Exception e) {
                // Outros erros inesperados - loga como warning
                log.warn("Erro ao enviar atualização para cliente do motoboy {}: {}", 
                        motoboyId, e.getMessage());
                emittersMortos.add(emitter);
            }
        }

        // Remove emitters que falharam de forma thread-safe
        if (!emittersMortos.isEmpty()) {
            synchronized (emitters) {
                // Re-valida a lista dentro do lock para evitar remover de lista que mudou
                List<SseEmitter> emittersAtuais = emittersPorMotoboy.get(motoboyId);
                if (emittersAtuais != null) {
                    emittersAtuais.removeAll(emittersMortos);
                    if (emittersAtuais.isEmpty()) {
                        emittersPorMotoboy.remove(motoboyId);
                        cachePedidos.remove(motoboyId);
                    }
                }
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

