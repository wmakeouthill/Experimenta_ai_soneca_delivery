package com.snackbar.cardapio.infrastructure.persistence;

import com.snackbar.cardapio.application.ports.AdicionalRepositoryPort;
import com.snackbar.cardapio.application.ports.ProdutoAdicionalRepositoryPort;
import com.snackbar.cardapio.domain.entities.Adicional;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProdutoAdicionalRepositoryAdapter implements ProdutoAdicionalRepositoryPort {

    private final ProdutoAdicionalJpaRepository jpaRepository;
    private final AdicionalRepositoryPort adicionalRepository;

    @Override
    @Transactional
    public void vincular(@NonNull String produtoId, @NonNull String adicionalId) {
        if (!existeVinculo(produtoId, adicionalId)) {
            ProdutoAdicionalEntity entity = ProdutoAdicionalEntity.builder()
                    .produtoId(produtoId)
                    .adicionalId(adicionalId)
                    .createdAt(LocalDateTime.now())
                    .build();
            jpaRepository.save(entity);
        }
    }

    @Override
    @Transactional
    public void desvincular(@NonNull String produtoId, @NonNull String adicionalId) {
        jpaRepository.deleteByProdutoIdAndAdicionalId(produtoId, adicionalId);
    }

    @Override
    @Transactional
    public void desvincularTodosDoProduto(@NonNull String produtoId) {
        jpaRepository.deleteByProdutoId(produtoId);
    }

    @Override
    public List<Adicional> buscarAdicionaisDoProduto(@NonNull String produtoId) {
        List<String> adicionalIds = buscarIdsAdicionaisDoProduto(produtoId);
        return adicionalRepository.buscarPorIds(adicionalIds);
    }

    @Override
    public List<String> buscarIdsAdicionaisDoProduto(@NonNull String produtoId) {
        return jpaRepository.findAdicionalIdsByProdutoId(produtoId);
    }

    @Override
    public boolean existeVinculo(@NonNull String produtoId, @NonNull String adicionalId) {
        return jpaRepository.existsByProdutoIdAndAdicionalId(produtoId, adicionalId);
    }

    @Override
    @Transactional
    public void atualizarVinculos(@NonNull String produtoId, @NonNull List<String> adicionalIds) {
        // Remove todos os vínculos existentes
        desvincularTodosDoProduto(produtoId);

        // Adiciona os novos vínculos
        for (String adicionalId : adicionalIds) {
            vincular(produtoId, adicionalId);
        }
    }
}
