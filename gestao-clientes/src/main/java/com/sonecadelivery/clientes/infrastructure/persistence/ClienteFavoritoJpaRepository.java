package com.sonecadelivery.clientes.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteFavoritoJpaRepository extends JpaRepository<ClienteFavoritoEntity, String> {

    List<ClienteFavoritoEntity> findByClienteId(String clienteId);

    List<ClienteFavoritoEntity> findByClienteIdOrderByCreatedAtDesc(String clienteId);

    Optional<ClienteFavoritoEntity> findByClienteIdAndProdutoId(String clienteId, String produtoId);

    boolean existsByClienteIdAndProdutoId(String clienteId, String produtoId);

    void deleteByClienteIdAndProdutoId(String clienteId, String produtoId);

    int countByClienteId(String clienteId);

    /**
     * Busca os produtos mais favoritados, ordenados pela quantidade de favoritos.
     * Retorna pares [produtoId, count] ordenados descendentemente.
     */
    @Query("SELECT f.produtoId, COUNT(f) as total FROM ClienteFavoritoEntity f " +
            "GROUP BY f.produtoId ORDER BY total DESC")
    List<Object[]> findMaisFavoritados();
}
