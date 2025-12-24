package com.sonecadelivery.pedidos.domain.services;

import com.sonecadelivery.pedidos.domain.entities.Pedido;

/**
 * Domain Service para regras de negócio de rastreamento.
 * Não depende de frameworks externos (Clean Architecture).
 * 
 * Define as regras de negócio para quando um pedido pode ser rastreado
 * e quem tem permissão para rastrear ou enviar localização.
 */
public interface RastreamentoPedidoService {
    
    /**
     * Verifica se um pedido pode ser rastreado.
     * Regras:
     * - Pedido deve ser de delivery
     * - Pedido deve ter motoboy atribuído
     * - Status deve permitir rastreamento (PREPARANDO, SAIU_PARA_ENTREGA)
     * 
     * @param pedido Pedido a verificar
     * @return true se pode ser rastreado, false caso contrário
     */
    boolean podeRastrear(Pedido pedido);
    
    /**
     * Verifica se um cliente pode rastrear um pedido específico.
     * Regras:
     * - Cliente deve ser o dono do pedido
     * - Pedido deve permitir rastreamento
     * 
     * @param pedido Pedido a verificar
     * @param clienteId ID do cliente
     * @return true se o cliente pode rastrear, false caso contrário
     */
    boolean clientePodeRastrear(Pedido pedido, String clienteId);
    
    /**
     * Verifica se um motoboy pode enviar localização para um pedido.
     * Regras:
     * - Motoboy deve ser o atribuído ao pedido
     * - Pedido deve permitir rastreamento
     * 
     * @param pedido Pedido a verificar
     * @param motoboyId ID do motoboy
     * @return true se o motoboy pode enviar localização, false caso contrário
     */
    boolean motoboyPodeEnviarLocalizacao(Pedido pedido, String motoboyId);
}

