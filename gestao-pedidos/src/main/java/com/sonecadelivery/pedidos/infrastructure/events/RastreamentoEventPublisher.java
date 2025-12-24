package com.sonecadelivery.pedidos.infrastructure.events;

import com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Publisher de eventos de rastreamento para WebSocket/SSE.
 * Usa ApplicationEventPublisher do Spring (padrão Observer).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RastreamentoEventPublisher {
    
    private final ApplicationEventPublisher eventPublisher;
    
    /**
     * Publica evento de localização atualizada.
     * O evento será capturado pelo RastreamentoPedidoSSEService
     * e enviado para os clientes conectados via SSE.
     * 
     * @param localizacao Localização atualizada do motoboy
     */
    public void publicarLocalizacaoAtualizada(LocalizacaoMotoboy localizacao) {
        LocalizacaoAtualizadaEvent event = new LocalizacaoAtualizadaEvent(
            localizacao.getPedidoId(),
            localizacao.getMotoboyId(),
            localizacao.getLatitude(),
            localizacao.getLongitude(),
            localizacao.getHeading(),
            localizacao.getVelocidade(),
            localizacao.getTimestamp()
        );
        
        eventPublisher.publishEvent(event);
        log.debug("Evento de localização publicado: pedido={}", localizacao.getPedidoId());
    }
    
    /**
     * Evento de localização atualizada.
     * Record imutável para transporte de dados.
     */
    public record LocalizacaoAtualizadaEvent(
        String pedidoId,
        String motoboyId,
        double latitude,
        double longitude,
        Double heading,
        Double velocidade,
        LocalDateTime timestamp
    ) {}
}

