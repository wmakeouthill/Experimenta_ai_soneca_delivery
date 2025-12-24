package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.RastreamentoPedidoResponse;
import com.sonecadelivery.pedidos.application.ports.ClienteGatewayPort;
import com.sonecadelivery.pedidos.application.ports.LocalizacaoMotoboyCachePort;
import com.sonecadelivery.pedidos.application.ports.MotoboyRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.services.RastreamentoPedidoService;
import com.sonecadelivery.kernel.domain.exceptions.NotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Use Case para obter dados de rastreamento de um pedido.
 * Valida que o cliente tem permissão para rastrear.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ObterRastreamentoPedidoUseCase {
    
    private final PedidoRepositoryPort pedidoRepository;
    private final LocalizacaoMotoboyCachePort localizacaoCache;
    private final RastreamentoPedidoService rastreamentoService;
    private final ClienteGatewayPort clienteGateway;
    private final MotoboyRepositoryPort motoboyRepository;
    
    /**
     * Obtém dados de rastreamento de um pedido.
     * Valida que o cliente tem permissão para rastrear.
     * 
     * @param pedidoId ID do pedido
     * @param clienteId ID do cliente autenticado
     * @return Dados de rastreamento
     */
    public RastreamentoPedidoResponse executar(String pedidoId, String clienteId) {
        log.info("Buscando rastreamento do pedido {} para cliente {}", pedidoId, clienteId);
        
        // Busca pedido
        Pedido pedido = pedidoRepository.buscarPorId(pedidoId)
            .orElseThrow(() -> new NotFoundException("Pedido não encontrado"));
        
        // Valida se o pedido pode ser rastreado (tipo, status, motoboy atribuído)
        if (!rastreamentoService.podeRastrear(pedido)) {
            throw new com.sonecadelivery.kernel.domain.exceptions.ValidationException(
                "Este pedido não está disponível para rastreamento no momento");
        }
        
        // Busca localização do motoboy no cache
        var localizacaoMotoboy = pedido.getMotoboyId() != null
            ? localizacaoCache.buscarPorMotoboyId(pedido.getMotoboyId())
            : java.util.Optional.<com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy>empty();
        
        // Busca nome do motoboy
        String motoboyNome = null;
        if (pedido.getMotoboyId() != null) {
            motoboyNome = motoboyRepository.buscarPorId(pedido.getMotoboyId())
                .map(m -> m.getNome())
                .orElse(null);
        }
        
        // Busca latitude/longitude do endereço do cliente
        final Double[] latitudeDestino = new Double[1];
        final Double[] longitudeDestino = new Double[1];
        if (pedido.getClienteId() != null) {
            clienteGateway.buscarPorId(pedido.getClienteId())
                .ifPresent(cliente -> {
                    latitudeDestino[0] = cliente.getLatitude();
                    longitudeDestino[0] = cliente.getLongitude();
                });
        }
        
        // Constrói resposta
        return RastreamentoPedidoResponse.builder()
            .pedidoId(pedido.getId())
            .numeroPedido(pedido.getNumeroPedido().getNumero())
            .statusPedido(pedido.getStatus().name())
            .motoboyId(pedido.getMotoboyId())
            .motoboyNome(motoboyNome)
            .localizacaoMotoboy(localizacaoMotoboy.map(this::toDTO).orElse(null))
            .latitudeDestino(latitudeDestino[0])
            .longitudeDestino(longitudeDestino[0])
            .enderecoEntrega(pedido.getEnderecoEntrega())
            .permiteRastreamento(true)
            .ultimaAtualizacao(LocalDateTime.now())
            .build();
    }
    
    private RastreamentoPedidoResponse.LocalizacaoMotoboyDTO toDTO(
            com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy loc) {
        return RastreamentoPedidoResponse.LocalizacaoMotoboyDTO.builder()
            .latitude(loc.getLatitude())
            .longitude(loc.getLongitude())
            .heading(loc.getHeading())
            .velocidade(loc.getVelocidade())
            .timestamp(loc.getTimestamp())
            .valida(loc.isValida())
            .build();
    }
}

