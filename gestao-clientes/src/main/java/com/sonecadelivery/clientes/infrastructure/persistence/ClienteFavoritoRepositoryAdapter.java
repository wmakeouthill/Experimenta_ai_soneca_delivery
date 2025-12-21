package com.sonecadelivery.clientes.infrastructure.persistence;

import com.sonecadelivery.clientes.application.ports.ClienteFavoritoRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.ClienteFavorito;
import com.sonecadelivery.clientes.infrastructure.mappers.ClienteFavoritoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ClienteFavoritoRepositoryAdapter implements ClienteFavoritoRepositoryPort {

    private final ClienteFavoritoJpaRepository jpaRepository;
    private final ClienteFavoritoMapper mapper;

    @Override
    @SuppressWarnings("null")
    public ClienteFavorito salvar(@NonNull ClienteFavorito favorito) {
        ClienteFavoritoEntity entity = mapper.paraEntity(favorito);
        ClienteFavoritoEntity salvo = jpaRepository.save(entity);
        return mapper.paraDomain(salvo);
    }

    @Override
    @Transactional
    public void remover(@NonNull String clienteId, @NonNull String produtoId) {
        jpaRepository.deleteByClienteIdAndProdutoId(clienteId, produtoId);
    }

    @Override
    public Optional<ClienteFavorito> buscar(@NonNull String clienteId, @NonNull String produtoId) {
        return jpaRepository.findByClienteIdAndProdutoId(clienteId, produtoId)
                .map(mapper::paraDomain);
    }

    @Override
    public List<ClienteFavorito> buscarPorCliente(@NonNull String clienteId) {
        return jpaRepository.findByClienteIdOrderByCreatedAtDesc(clienteId).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public boolean existe(@NonNull String clienteId, @NonNull String produtoId) {
        return jpaRepository.existsByClienteIdAndProdutoId(clienteId, produtoId);
    }

    @Override
    public int contarPorCliente(@NonNull String clienteId) {
        return jpaRepository.countByClienteId(clienteId);
    }

    @Override
    public Map<String, Long> buscarMaisFavoritados() {
        List<Object[]> resultados = jpaRepository.findMaisFavoritados();
        Map<String, Long> mapa = new LinkedHashMap<>();
        for (Object[] row : resultados) {
            String produtoId = (String) row[0];
            Long count = (Long) row[1];
            mapa.put(produtoId, count);
        }
        return mapa;
    }
}
