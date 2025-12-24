package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.pedidos.application.dto.AtualizarLocalizacaoRequest;
import com.sonecadelivery.pedidos.application.ports.LocalizacaoMotoboyCachePort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.services.RastreamentoPedidoService;
import com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy;
import com.sonecadelivery.pedidos.infrastructure.events.RastreamentoEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Use Case para atualizar localização do motoboy.
 * O motoboy envia sua localização atual (sem precisar iniciar viagem manualmente)
 * e o sistema associa essa localização a todos os pedidos ativos atribuídos a ele.
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
     * 
     * Comportamento:
     * - Motoboy envia apenas sua localização atual (latitude/longitude, heading, velocidade)
     * - O sistema busca TODOS os pedidos ativos atribuídos a esse motoboy
     * - Para cada pedido elegível para rastreamento, atualiza o hot cache e publica evento
     * 
     * @param motoboyId ID do motoboy autenticado
     * @param request Dados da localização (sem vínculo direto a um pedido específico)
     */
    public void executar(String motoboyId, AtualizarLocalizacaoRequest request) {
        log.debug("Atualizando localização do motoboy {} (envio contínuo)", motoboyId);

        // Busca todos os pedidos atribuídos a este motoboy
        var pedidosDoMotoboy = pedidoRepository.buscarPorMotoboyId(motoboyId);

        if (pedidosDoMotoboy.isEmpty()) {
            log.debug("Nenhum pedido ativo encontrado para motoboy {}", motoboyId);
            return;
        }

        // Para cada pedido, verifica se pode rastrear e atualiza cache
        pedidosDoMotoboy.stream()
            .filter(pedido -> rastreamentoService.motoboyPodeEnviarLocalizacao(pedido, motoboyId))
            .forEach(pedido -> atualizarLocalizacaoParaPedido(pedido, motoboyId, request));

        log.debug("Localização atualizada para {} pedido(s) do motoboy {}", 
            pedidosDoMotoboy.size(), motoboyId);
    }

    private void atualizarLocalizacaoParaPedido(Pedido pedido, String motoboyId, AtualizarLocalizacaoRequest request) {
        // Cria value object para este pedido específico
        LocalizacaoMotoboy localizacao = new LocalizacaoMotoboy(
            motoboyId,
            pedido.getId(),
            request.getLatitude(),
            request.getLongitude(),
            request.getHeading(),
            request.getVelocidade(),
            null // timestamp será gerado no construtor
        );

        // Atualiza cache (chave por motoboy + por pedido)
        localizacaoCache.salvar(localizacao);

        // Publica evento para WebSocket/SSE (clientes conectados ao pedido)
        eventPublisher.publicarLocalizacaoAtualizada(localizacao);
    }
}

