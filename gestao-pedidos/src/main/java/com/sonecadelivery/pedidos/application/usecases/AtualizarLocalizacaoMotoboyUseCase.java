package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.AtualizarLocalizacaoRequest;
import com.sonecadelivery.pedidos.application.ports.LocalizacaoMotoboyCachePort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.services.RastreamentoPedidoService;
import com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy;
import com.sonecadelivery.pedidos.infrastructure.events.RastreamentoEventPublisher;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Use Case para atualizar localização do motoboy.
 * Valida que o motoboy tem permissão para enviar localização do pedido.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AtualizarLocalizacaoMotoboyUseCase {
    
    private final PedidoRepositoryPort pedidoRepository;
    private final LocalizacaoMotoboyCachePort localizacaoCache;
    private final RastreamentoPedidoService rastreamentoService;
    private final RastreamentoEventPublisher eventPublisher;
    
    /**
     * Atualiza localização do motoboy.
     * Valida que o motoboy tem permissão para enviar localização do pedido.
     * 
     * @param motoboyId ID do motoboy autenticado
     * @param request Dados da localização
     */
    public void executar(String motoboyId, AtualizarLocalizacaoRequest request) {
        log.debug("Atualizando localização do motoboy {} para pedido {}", 
            motoboyId, request.getPedidoId());
        
        // Valida que o pedido existe e o motoboy está atribuído
        Pedido pedido = pedidoRepository.buscarPorId(request.getPedidoId())
            .orElseThrow(() -> new NotFoundException("Pedido não encontrado"));
        
        if (!rastreamentoService.motoboyPodeEnviarLocalizacao(pedido, motoboyId)) {
            throw new com.sonecadelivery.kernel.domain.exceptions.ValidationException(
                "Você não tem permissão para enviar localização deste pedido");
        }
        
        // Cria value object
        LocalizacaoMotoboy localizacao = new LocalizacaoMotoboy(
            motoboyId,
            request.getPedidoId(),
            request.getLatitude(),
            request.getLongitude(),
            request.getHeading(),
            request.getVelocidade(),
            null // timestamp será gerado no construtor
        );
        
        // Atualiza cache
        localizacaoCache.salvar(localizacao);
        
        // Publica evento para WebSocket/SSE
        eventPublisher.publicarLocalizacaoAtualizada(localizacao);
        
        log.debug("Localização atualizada com sucesso");
    }
}

