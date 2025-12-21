package com.snackbar.chatia.infrastructure.persistence.repository;

import com.snackbar.chatia.infrastructure.persistence.entity.HistoricoConversaChatEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório JPA para histórico de conversas do chat.
 */
@Repository
public interface HistoricoConversaChatJpaRepository extends JpaRepository<HistoricoConversaChatEntity, String> {
    
    /**
     * Busca as últimas N conversas de um cliente ordenadas por data da última mensagem.
     */
    @Query("SELECT h FROM HistoricoConversaChatEntity h WHERE h.clienteId = :clienteId ORDER BY h.dataUltimaMensagem DESC")
    List<HistoricoConversaChatEntity> findByClienteIdOrderByDataUltimaMensagemDesc(@Param("clienteId") String clienteId);
    
    /**
     * Busca as últimas N conversas de um cliente.
     */
    @Query(value = "SELECT * FROM historico_conversas_chat WHERE cliente_id = :clienteId ORDER BY data_ultima_mensagem DESC LIMIT :limite", nativeQuery = true)
    List<HistoricoConversaChatEntity> findTopNByClienteId(@Param("clienteId") String clienteId, @Param("limite") int limite);
    
    /**
     * Conta quantas conversas um cliente tem.
     */
    long countByClienteId(String clienteId);
    
    /**
     * Deleta as conversas mais antigas de um cliente, mantendo apenas as N mais recentes.
     */
    @Modifying
    @Query(value = """
        DELETE FROM historico_conversas_chat 
        WHERE cliente_id = :clienteId 
        AND id NOT IN (
            SELECT id FROM (
                SELECT id FROM historico_conversas_chat 
                WHERE cliente_id = :clienteId 
                ORDER BY data_ultima_mensagem DESC 
                LIMIT :manter
            ) AS subquery
        )
        """, nativeQuery = true)
    void deleteOldestByClienteId(@Param("clienteId") String clienteId, @Param("manter") int manter);
    
    /**
     * Verifica se uma conversa pertence a um cliente específico.
     */
    boolean existsByIdAndClienteId(String id, String clienteId);
    
    /**
     * Deleta uma conversa por ID e cliente ID.
     */
    @Modifying
    void deleteByIdAndClienteId(String id, String clienteId);
}
