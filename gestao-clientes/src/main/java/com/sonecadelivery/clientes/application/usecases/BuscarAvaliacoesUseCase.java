package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.ClienteAvaliacaoDTO;
import com.sonecadelivery.clientes.application.ports.ClienteAvaliacaoRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuscarAvaliacoesUseCase {

    private final ClienteAvaliacaoRepositoryPort avaliacaoRepository;

    public List<ClienteAvaliacaoDTO> buscarPorCliente(String clienteId) {
        return avaliacaoRepository.buscarPorCliente(clienteId)
                .stream()
                .map(ClienteAvaliacaoDTO::de)
                .collect(Collectors.toList());
    }

    public List<ClienteAvaliacaoDTO> buscarPorProduto(String produtoId) {
        return avaliacaoRepository.buscarPorProduto(produtoId)
                .stream()
                .map(ClienteAvaliacaoDTO::de)
                .collect(Collectors.toList());
    }

    public Optional<ClienteAvaliacaoDTO> buscarAvaliacaoCliente(String clienteId, String produtoId) {
        return avaliacaoRepository.buscarPorClienteProduto(clienteId, produtoId)
                .map(ClienteAvaliacaoDTO::de);
    }

    public Double calcularMediaProduto(String produtoId) {
        return avaliacaoRepository.calcularMediaPorProduto(produtoId);
    }

    public int contarAvaliacoesProduto(String produtoId) {
        return avaliacaoRepository.contarAvaliacoesPorProduto(produtoId);
    }
}
