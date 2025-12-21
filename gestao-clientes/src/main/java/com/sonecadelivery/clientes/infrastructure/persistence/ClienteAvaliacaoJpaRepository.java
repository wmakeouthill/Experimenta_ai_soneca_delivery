package com.sonecadelivery.clientes.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteAvaliacaoJpaRepository extends JpaRepository<ClienteAvaliacaoEntity, String> {

        List<ClienteAvaliacaoEntity> findByClienteId(String clienteId);

        List<ClienteAvaliacaoEntity> findByClienteIdOrderByCreatedAtDesc(String clienteId);

        List<ClienteAvaliacaoEntity> findByProdutoId(String produtoId);

        List<ClienteAvaliacaoEntity> findByProdutoIdOrderByCreatedAtDesc(String produtoId);

        List<ClienteAvaliacaoEntity> findByPedidoId(String pedidoId);

        List<ClienteAvaliacaoEntity> findByPedidoIdOrderByCreatedAtDesc(String pedidoId);

        Optional<ClienteAvaliacaoEntity> findByClienteIdAndProdutoId(String clienteId, String produtoId);

        Optional<ClienteAvaliacaoEntity> findByClienteIdAndProdutoIdAndPedidoId(
                        String clienteId, String produtoId, String pedidoId);

        boolean existsByClienteIdAndProdutoIdAndPedidoId(
                        String clienteId, String produtoId, String pedidoId);

        @Query("SELECT AVG(a.nota) FROM ClienteAvaliacaoEntity a WHERE a.produtoId = :produtoId")
        Double calcularMediaPorProduto(String produtoId);

        @Query("SELECT COUNT(a) FROM ClienteAvaliacaoEntity a WHERE a.produtoId = :produtoId")
        int countByProdutoId(String produtoId);

        @Query("SELECT a.produtoId, AVG(a.nota) as media FROM ClienteAvaliacaoEntity a " +
                        "GROUP BY a.produtoId ORDER BY media DESC")
        List<Object[]> listarProdutosPorMediaNota();
}
