package com.sonecadelivery.clientes.infrastructure.web;

import com.sonecadelivery.clientes.application.dto.AvaliarProdutoRequest;
import com.sonecadelivery.clientes.application.dto.ClienteAvaliacaoDTO;
import com.sonecadelivery.clientes.application.usecases.AvaliarProdutoUseCase;
import com.sonecadelivery.clientes.application.usecases.BuscarAvaliacoesUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller para operações de avaliação do cliente autenticado.
 * Usa X-Cliente-Id do header (adicionado pelo interceptor de autenticação).
 */
@RestController
@RequestMapping("/api/cliente/conta/avaliacoes")
@RequiredArgsConstructor
public class ClienteContaAvaliacoesController {

    private final AvaliarProdutoUseCase avaliarProdutoUseCase;
    private final BuscarAvaliacoesUseCase buscarAvaliacoesUseCase;

    /**
     * Cria ou atualiza uma avaliação de produto.
     */
    @PostMapping
    public ResponseEntity<ClienteAvaliacaoDTO> avaliar(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody AvaliarProdutoRequest request) {
        ClienteAvaliacaoDTO avaliacao = avaliarProdutoUseCase.executar(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    /**
     * Lista todas as avaliações do cliente.
     */
    @GetMapping
    public ResponseEntity<List<ClienteAvaliacaoDTO>> listar(
            @RequestHeader("X-Cliente-Id") String clienteId) {
        List<ClienteAvaliacaoDTO> avaliacoes = buscarAvaliacoesUseCase.buscarPorCliente(clienteId);
        return ResponseEntity.ok(avaliacoes);
    }
}
