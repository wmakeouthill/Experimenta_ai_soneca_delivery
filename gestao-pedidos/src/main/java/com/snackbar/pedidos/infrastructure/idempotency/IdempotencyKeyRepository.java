package com.snackbar.pedidos.infrastructure.idempotency;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository para gerenciar chaves de idempotência.
 */
@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKeyEntity, Long> {

    /**
     * Busca uma chave de idempotência pelo valor da chave e endpoint.
     */
    @Query("SELECT i FROM IdempotencyKeyEntity i WHERE i.idempotencyKey = :key AND i.endpoint = :endpoint AND i.expiresAt > :now")
    Optional<IdempotencyKeyEntity> findByKeyAndEndpoint(
            @Param("key") String key,
            @Param("endpoint") String endpoint,
            @Param("now") LocalDateTime now);

    /**
     * Remove chaves expiradas.
     */
    @Modifying
    @Query("DELETE FROM IdempotencyKeyEntity i WHERE i.expiresAt < :now")
    void deleteExpiredKeys(@Param("now") LocalDateTime now);
}
