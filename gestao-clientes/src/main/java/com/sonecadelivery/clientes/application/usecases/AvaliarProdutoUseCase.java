package com.sonecadelivery.clientes.application.usecases;

import com.sonecadelivery.clientes.application.dto.AvaliarProdutoRequest;
import com.sonecadelivery.clientes.application.dto.ClienteAvaliacaoDTO;
import com.sonecadelivery.clientes.application.ports.ClienteAvaliacaoRepositoryPort;
import com.sonecadelivery.clientes.application.ports.ClienteRepositoryPort;
import com.sonecadelivery.clientes.domain.entities.ClienteAvaliacao;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AvaliarProdutoUseCase {

    private final ClienteAvaliacaoRepositoryPort avaliacaoRepository;
    private final ClienteRepositoryPort clienteRepository;

    public ClienteAvaliacaoDTO executar(String clienteId, AvaliarProdutoRequest request) {
        // Validar se cliente existe
        clienteRepository.buscarPorId(clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado: " + clienteId));

        // Verificar se já avaliou este produto neste pedido específico
        Optional<ClienteAvaliacao> avaliacaoExistente = avaliacaoRepository.buscar(
                clienteId,
                request.getProdutoId(),
                request.getPedidoId());

        ClienteAvaliacao avaliacao;

        if (avaliacaoExistente.isPresent()) {
            // Atualizar avaliação existente para este pedido+produto
            avaliacao = avaliacaoExistente.get();
            avaliacao.atualizar(request.getNota(), request.getComentario());
        } else {
            // Criar nova avaliação para este pedido+produto
            avaliacao = ClienteAvaliacao.criar(
                    clienteId,
                    request.getProdutoId(),
                    request.getPedidoId(),
                    request.getNota(),
                    request.getComentario());
        }

        ClienteAvaliacao salva = avaliacaoRepository.salvar(avaliacao);
        return ClienteAvaliacaoDTO.de(salva);
    }
}
