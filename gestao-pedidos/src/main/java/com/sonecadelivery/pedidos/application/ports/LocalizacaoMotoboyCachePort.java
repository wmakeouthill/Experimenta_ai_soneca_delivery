package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy;
import java.util.Optional;

/**
 * Port para cache de localização de motoboys.
 * Abstração que permite trocar implementação (memória, Redis, etc).
 * 
 * Segue padrão Dependency Inversion (SOLID):
 * - Application Layer depende de abstração (Port)
 * - Infrastructure Layer implementa a abstração (Adapter)
 * 
 * Permite trocar implementação sem afetar Use Cases.
 */
public interface LocalizacaoMotoboyCachePort {
    
    /**
     * Salva localização no cache.
     * Substitui localização anterior do mesmo motoboy.
     * 
     * @param localizacao Localização a ser salva
     */
    void salvar(LocalizacaoMotoboy localizacao);
    
    /**
     * Busca localização por ID do motoboy.
     * Retorna Optional vazio se não encontrado ou se expirada.
     * 
     * @param motoboyId ID do motoboy
     * @return Localização encontrada ou Optional.empty()
     */
    Optional<LocalizacaoMotoboy> buscarPorMotoboyId(String motoboyId);
    
    /**
     * Busca localização por ID do pedido.
     * Útil para clientes que querem rastrear pelo pedido.
     * 
     * @param pedidoId ID do pedido
     * @return Localização encontrada ou Optional.empty()
     */
    Optional<LocalizacaoMotoboy> buscarPorPedidoId(String pedidoId);
    
    /**
     * Remove localização do cache.
     * Usado quando pedido é entregue ou cancelado.
     * 
     * @param motoboyId ID do motoboy
     */
    void remover(String motoboyId);
    
    /**
     * Limpa localizações expiradas.
     * Chamado por scheduler para manter cache limpo.
     */
    void limparExpiradas();
}

