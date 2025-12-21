package com.sonecadelivery.cardapio.application.usecases;

import com.sonecadelivery.cardapio.application.dto.AtualizarProdutoRequest;
import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;
import com.sonecadelivery.cardapio.application.ports.ProdutoRepositoryPort;
import com.sonecadelivery.cardapio.domain.entities.Produto;
import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AtualizarProdutoUseCase {

    private final ProdutoRepositoryPort produtoRepository;

    @SuppressWarnings("null") // repository.salvar() nunca retorna null, .orElseThrow() nunca retorna null
    public ProdutoDTO executar(String id, AtualizarProdutoRequest request) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("ID do produto não pode ser nulo ou vazio");
        }

        Produto produto = produtoRepository.buscarPorId(id)
                .orElseThrow(() -> new ValidationException("Produto não encontrado com ID: " + id));

        if (request.getNome() != null) {
            produto.atualizarNome(request.getNome());
        }

        if (request.getDescricao() != null) {
            produto.atualizarDescricao(request.getDescricao());
        }

        if (request.getPreco() != null) {
            produto.atualizarPreco(Preco.of(request.getPreco()));
        }

        if (request.getCategoria() != null) {
            produto.atualizarCategoria(request.getCategoria());
        }

        Boolean disponibilidade = request.getDisponivel();
        if (disponibilidade != null) {
            if (disponibilidade.booleanValue()) {
                produto.marcarComoDisponivel();
            } else {
                produto.marcarComoIndisponivel();
            }
        }

        // Atualizar foto quando o campo vier na requisição
        // Se foto vier como null ou string vazia, remove a foto
        // Se não vier o campo, mantém a foto atual (não atualiza)
        if (request.getFoto() != null) {
            String fotoValue = request.getFoto().trim();
            produto.atualizarFoto(fotoValue.isEmpty() ? null : fotoValue);
        }

        Produto produtoAtualizado = produtoRepository.salvar(produto);

        return ProdutoDTO.de(produtoAtualizado);
    }
}
