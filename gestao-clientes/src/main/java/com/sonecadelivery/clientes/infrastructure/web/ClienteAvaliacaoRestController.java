package com.sonecadelivery.clientes.infrastructure.web;

import com.sonecadelivery.clientes.application.dto.AvaliarProdutoRequest;
import com.sonecadelivery.clientes.application.dto.ClienteAvaliacaoDTO;
import com.sonecadelivery.clientes.application.usecases.AvaliarProdutoUseCase;
import com.sonecadelivery.clientes.application.usecases.BuscarAvaliacoesUseCase;
import com.sonecadelivery.clientes.application.usecases.RemoverAvaliacaoUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes/{clienteId}/avaliacoes")
@RequiredArgsConstructor
public class ClienteAvaliacaoRestController {

    private final AvaliarProdutoUseCase avaliarProdutoUseCase;
    private final BuscarAvaliacoesUseCase buscarAvaliacoesUseCase;
    private final RemoverAvaliacaoUseCase removerAvaliacaoUseCase;

    @PostMapping
    public ResponseEntity<ClienteAvaliacaoDTO> avaliar(
            @PathVariable String clienteId,
            @Valid @RequestBody AvaliarProdutoRequest request) {
        ClienteAvaliacaoDTO avaliacao = avaliarProdutoUseCase.executar(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    @PutMapping("/{produtoId}")
    public ResponseEntity<ClienteAvaliacaoDTO> atualizar(
            @PathVariable String clienteId,
            @PathVariable String produtoId,
            @Valid @RequestBody AvaliarProdutoRequest request) {
        // Garante que o produtoId do path é o mesmo do body
        request.setProdutoId(produtoId);
        ClienteAvaliacaoDTO avaliacao = avaliarProdutoUseCase.executar(clienteId, request);
        return ResponseEntity.ok(avaliacao);
    }

    @DeleteMapping("/{produtoId}")
    public ResponseEntity<Void> remover(
            @PathVariable String clienteId,
            @PathVariable String produtoId) {
        removerAvaliacaoUseCase.executar(clienteId, produtoId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<ClienteAvaliacaoDTO>> listar(@PathVariable String clienteId) {
        List<ClienteAvaliacaoDTO> avaliacoes = buscarAvaliacoesUseCase.buscarPorCliente(clienteId);
        return ResponseEntity.ok(avaliacoes);
    }

    @GetMapping("/{produtoId}")
    public ResponseEntity<ClienteAvaliacaoDTO> buscarPorProduto(
            @PathVariable String clienteId,
            @PathVariable String produtoId) {
        Optional<ClienteAvaliacaoDTO> avaliacao = buscarAvaliacoesUseCase.buscarAvaliacaoCliente(clienteId, produtoId);
        return avaliacao
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

/**
 * Controller adicional para endpoints públicos de avaliações por produto
 */
@RestController
@RequestMapping("/api/produtos/{produtoId}/avaliacoes")
@RequiredArgsConstructor
class ProdutoAvaliacaoRestController {

    private final BuscarAvaliacoesUseCase buscarAvaliacoesUseCase;

    @GetMapping
    public ResponseEntity<List<ClienteAvaliacaoDTO>> listarPorProduto(@PathVariable String produtoId) {
        List<ClienteAvaliacaoDTO> avaliacoes = buscarAvaliacoesUseCase.buscarPorProduto(produtoId);
        return ResponseEntity.ok(avaliacoes);
    }

    @GetMapping("/media")
    public ResponseEntity<Map<String, Object>> mediaProduto(@PathVariable String produtoId) {
        Double media = buscarAvaliacoesUseCase.calcularMediaProduto(produtoId);
        int total = buscarAvaliacoesUseCase.contarAvaliacoesProduto(produtoId);

        return ResponseEntity.ok(Map.of(
                "produtoId", produtoId,
                "media", media != null ? media : 0.0,
                "totalAvaliacoes", total));
    }
}
