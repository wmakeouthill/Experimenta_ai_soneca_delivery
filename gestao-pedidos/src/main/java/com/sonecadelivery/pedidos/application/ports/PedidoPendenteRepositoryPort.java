package com.sonecadelivery.pedidos.application.ports;

import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;

import java.util.List;
import java.util.Optional;

/**
 * Port para repositório de pedidos pendentes de mesa.
 * 
 * Abstração para a camada de aplicação não depender da infraestrutura.
 */
public interface PedidoPendenteRepositoryPort {

    /**
     * Salva um pedido pendente.
     */
    PedidoPendenteDTO salvar(PedidoPendenteDTO pedidoPendente);

    /**
     * Lista todos os pedidos pendentes (ainda não aceitos) ordenados por data.
     */
    List<PedidoPendenteDTO> listarPendentes();

    /**
     * Busca um pedido pendente que ainda não foi aceito.
     */
    Optional<PedidoPendenteDTO> buscarPendentePorId(String id);

    /**
     * Busca um pedido pendente COM LOCK PESSIMISTA.
     * 
     * Usa SELECT FOR UPDATE para garantir que apenas uma transação
     * consiga processar o mesmo pedido simultaneamente.
     * Essencial para evitar race condition na aceitação de pedidos.
     */
    Optional<PedidoPendenteDTO> buscarPendentePorIdComLock(String id);

    /**
     * Busca qualquer pedido pendente por ID (aceito ou não).
     */
    Optional<PedidoPendenteDTO> buscarPorId(String id);

    /**
     * Conta a quantidade de pedidos pendentes na fila.
     */
    long contarPendentes();

    /**
     * Remove um pedido pendente da fila.
     */
    void remover(String id);

    /**
     * Remove pedidos expirados (mais antigos que o tempo limite).
     * 
     * @param tempoLimiteMinutos Tempo máximo em minutos na fila
     * @return Quantidade de pedidos removidos
     */
    int removerExpirados(long tempoLimiteMinutos);

    /**
     * Marca um pedido pendente como aceito, vinculando ao pedido real criado.
     * 
     * @param pedidoPendenteId ID do pedido pendente
     * @param pedidoRealId     ID do pedido real criado
     */
    void marcarComoAceito(String pedidoPendenteId, String pedidoRealId);

    /**
     * Busca o ID do pedido real associado a um pedido pendente.
     * Útil para o cliente acompanhar o status após aceitação.
     */
    Optional<String> buscarPedidoRealPorPendente(String pedidoPendenteId);
}
