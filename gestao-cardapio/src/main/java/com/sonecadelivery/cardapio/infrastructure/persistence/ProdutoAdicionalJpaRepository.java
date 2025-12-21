package com.sonecadelivery.cardapio.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProdutoAdicionalJpaRepository extends JpaRepository<ProdutoAdicionalEntity, ProdutoAdicionalId> {
    
    List<ProdutoAdicionalEntity> findByProdutoId(String produtoId);
    
    List<ProdutoAdicionalEntity> findByAdicionalId(String adicionalId);
    
    void deleteByProdutoId(String produtoId);
    
    void deleteByProdutoIdAndAdicionalId(String produtoId, String adicionalId);
    
    boolean existsByProdutoIdAndAdicionalId(String produtoId, String adicionalId);
    
    @Query("SELECT pa.adicionalId FROM ProdutoAdicionalEntity pa WHERE pa.produtoId = :produtoId")
    List<String> findAdicionalIdsByProdutoId(@Param("produtoId") String produtoId);
}
