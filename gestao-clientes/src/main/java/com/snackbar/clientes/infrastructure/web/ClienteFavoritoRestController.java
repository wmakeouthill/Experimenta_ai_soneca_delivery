package com.snackbar.clientes.infrastructure.web;

import com.snackbar.clientes.application.dto.AdicionarFavoritoRequest;
import com.snackbar.clientes.application.dto.ClienteFavoritoDTO;
import com.snackbar.clientes.application.usecases.AdicionarFavoritoUseCase;
import com.snackbar.clientes.application.usecases.ListarFavoritosUseCase;
import com.snackbar.clientes.application.usecases.RemoverFavoritoUseCase;
import com.snackbar.clientes.application.usecases.ToggleFavoritoUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes/{clienteId}/favoritos")
@RequiredArgsConstructor
public class ClienteFavoritoRestController {

    private final AdicionarFavoritoUseCase adicionarFavoritoUseCase;
    private final RemoverFavoritoUseCase removerFavoritoUseCase;
    private final ListarFavoritosUseCase listarFavoritosUseCase;
    private final ToggleFavoritoUseCase toggleFavoritoUseCase;

    @PostMapping
    public ResponseEntity<ClienteFavoritoDTO> adicionar(
            @PathVariable String clienteId,
            @Valid @RequestBody AdicionarFavoritoRequest request) {
        ClienteFavoritoDTO favorito = adicionarFavoritoUseCase.executar(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(favorito);
    }

    @DeleteMapping("/{produtoId}")
    public ResponseEntity<Void> remover(
            @PathVariable String clienteId,
            @PathVariable String produtoId) {
        removerFavoritoUseCase.executar(clienteId, produtoId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{produtoId}/toggle")
    public ResponseEntity<Map<String, Boolean>> toggle(
            @PathVariable String clienteId,
            @PathVariable String produtoId) {
        boolean adicionado = toggleFavoritoUseCase.executar(clienteId, produtoId);
        return ResponseEntity.ok(Map.of("favorito", adicionado));
    }

    @GetMapping
    public ResponseEntity<List<ClienteFavoritoDTO>> listar(@PathVariable String clienteId) {
        List<ClienteFavoritoDTO> favoritos = listarFavoritosUseCase.executar(clienteId);
        return ResponseEntity.ok(favoritos);
    }

    @GetMapping("/ids")
    public ResponseEntity<List<String>> listarIdsProdutos(@PathVariable String clienteId) {
        List<String> ids = listarFavoritosUseCase.listarIdsProdutos(clienteId);
        return ResponseEntity.ok(ids);
    }

    @GetMapping("/{produtoId}/check")
    public ResponseEntity<Map<String, Boolean>> verificar(
            @PathVariable String clienteId,
            @PathVariable String produtoId) {
        boolean isFavorito = listarFavoritosUseCase.isFavorito(clienteId, produtoId);
        return ResponseEntity.ok(Map.of("favorito", isFavorito));
    }
}
