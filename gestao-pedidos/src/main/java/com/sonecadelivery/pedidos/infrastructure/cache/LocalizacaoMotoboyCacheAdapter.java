package com.sonecadelivery.pedidos.infrastructure.cache;

import com.sonecadelivery.pedidos.application.ports.LocalizacaoMotoboyCachePort;
import com.sonecadelivery.pedidos.domain.valueobjects.LocalizacaoMotoboy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Cache em memória para localização de motoboys.
 * 
 * Singleton gerenciado pelo Spring (@Component).
 * Thread-safe usando ConcurrentHashMap.
 * 
 * Performance:
 * - O(1) para busca e inserção
 * - Sem I/O de disco ou rede
 * - Thread-safe com ConcurrentHashMap
 * 
 * Uso em container:
 * - Cache compartilhado entre todas as requisições
 * - Não cria múltiplas instâncias (Spring singleton)
 * - Economia de memória: apenas localizações ativas são mantidas
 * 
 * NOTA: Para ambiente distribuído (múltiplos containers), considere
 * implementar uma versão com Redis que implementa a mesma interface.
 */
@Component
@Slf4j
public class LocalizacaoMotoboyCacheAdapter implements LocalizacaoMotoboyCachePort {
    
    /**
     * Cache principal: motoboyId -> LocalizacaoMotoboy
     * ConcurrentHashMap é thread-safe e performático.
     */
    private final Map<String, LocalizacaoMotoboy> cachePorMotoboy = new ConcurrentHashMap<>();
    
    /**
     * Índice reverso: pedidoId -> motoboyId
     * Permite buscar por pedido sem iterar todo o cache.
     */
    private final Map<String, String> pedidoParaMotoboy = new ConcurrentHashMap<>();
    
    @Override
    public void salvar(LocalizacaoMotoboy localizacao) {
        if (localizacao == null) {
            return;
        }
        
        // Atualiza cache principal
        cachePorMotoboy.put(localizacao.getMotoboyId(), localizacao);
        
        // Atualiza índice reverso
        pedidoParaMotoboy.put(localizacao.getPedidoId(), localizacao.getMotoboyId());
        
        log.debug("Localização salva no cache: motoboy={}, pedido={}", 
            localizacao.getMotoboyId(), localizacao.getPedidoId());
    }
    
    @Override
    public Optional<LocalizacaoMotoboy> buscarPorMotoboyId(String motoboyId) {
        if (motoboyId == null || motoboyId.isBlank()) {
            return Optional.empty();
        }
        
        LocalizacaoMotoboy localizacao = cachePorMotoboy.get(motoboyId);
        
        if (localizacao == null) {
            return Optional.empty();
        }
        
        // Verifica se não expirou
        if (!localizacao.isValida()) {
            // Remove do cache se expirou
            remover(motoboyId);
            return Optional.empty();
        }
        
        return Optional.of(localizacao);
    }
    
    @Override
    public Optional<LocalizacaoMotoboy> buscarPorPedidoId(String pedidoId) {
        if (pedidoId == null || pedidoId.isBlank()) {
            return Optional.empty();
        }
        
        String motoboyId = pedidoParaMotoboy.get(pedidoId);
        if (motoboyId == null) {
            return Optional.empty();
        }
        
        return buscarPorMotoboyId(motoboyId);
    }
    
    @Override
    public void remover(String motoboyId) {
        if (motoboyId == null || motoboyId.isBlank()) {
            return;
        }
        
        LocalizacaoMotoboy removida = cachePorMotoboy.remove(motoboyId);
        if (removida != null) {
            pedidoParaMotoboy.remove(removida.getPedidoId());
            log.debug("Localização removida do cache: motoboy={}", motoboyId);
        }
    }
    
    /**
     * Limpa localizações expiradas automaticamente.
     * Executa a cada minuto via @Scheduled.
     * 
     * Performance: O(n) onde n = número de entradas no cache.
     * Como localizações expiram em 5 minutos e são removidas quando buscadas,
     * este método apenas limpa "lixo" residual.
     */
    @Scheduled(fixedRate = 60000) // A cada 1 minuto
    public void limparExpiradas() {
        int removidas = 0;
        
        // Itera sobre cópia para evitar ConcurrentModificationException
        for (Map.Entry<String, LocalizacaoMotoboy> entry : cachePorMotoboy.entrySet()) {
            LocalizacaoMotoboy loc = entry.getValue();
            if (!loc.isValida()) {
                remover(entry.getKey());
                removidas++;
            }
        }
        
        if (removidas > 0) {
            log.debug("Limpeza automática: {} localizações expiradas removidas", removidas);
        }
    }
    
    /**
     * Método para monitoramento (actuator/metrics).
     * Retorna estatísticas do cache.
     */
    public CacheStats getStats() {
        return new CacheStats(
            cachePorMotoboy.size(),
            pedidoParaMotoboy.size()
        );
    }
    
    public record CacheStats(int localizacoesAtivas, int pedidosRastreaveis) {}
}

