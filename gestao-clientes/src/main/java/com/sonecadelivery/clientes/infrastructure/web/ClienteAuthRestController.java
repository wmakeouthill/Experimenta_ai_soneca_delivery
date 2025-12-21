package com.sonecadelivery.clientes.infrastructure.web;

import com.sonecadelivery.clientes.application.dto.*;
import com.sonecadelivery.clientes.application.usecases.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/publico/cliente/auth")
@RequiredArgsConstructor
public class ClienteAuthRestController {

    private final AutenticarClienteUseCase autenticarClienteUseCase;
    private final AutenticarClienteGoogleUseCase autenticarClienteGoogleUseCase;

    /**
     * Login com telefone e senha
     */
    @PostMapping("/login")
    public ResponseEntity<ClienteLoginResponse> login(
            @Valid @RequestBody ClienteLoginRequest request) {
        ClienteLoginResponse response = autenticarClienteUseCase.executar(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Login/Cadastro via Google OAuth
     */
    @PostMapping("/google")
    public ResponseEntity<ClienteLoginResponse> loginGoogle(
            @Valid @RequestBody ClienteGoogleLoginRequest request) {
        ClienteLoginResponse response = autenticarClienteGoogleUseCase.executar(request);
        return ResponseEntity.ok(response);
    }
}

/**
 * Controller para operações autenticadas de conta do cliente
 */
@RestController
@RequestMapping("/api/cliente/conta")
@RequiredArgsConstructor
class ClienteContaRestController {

    private final DefinirSenhaClienteUseCase definirSenhaClienteUseCase;
    private final SalvarSenhaClienteUseCase salvarSenhaClienteUseCase;
    private final VincularGoogleUseCase vincularGoogleUseCase;
    private final DesvincularGoogleUseCase desvincularGoogleUseCase;
    private final BuscarClientePorIdUseCase buscarClientePorIdUseCase;
    private final AdicionarFavoritoUseCase adicionarFavoritoUseCase;
    private final RemoverFavoritoUseCase removerFavoritoUseCase;
    private final ListarFavoritosUseCase listarFavoritosUseCase;
    private final AvaliarProdutoUseCase avaliarProdutoUseCase;
    private final BuscarAvaliacoesUseCase buscarAvaliacoesUseCase;
    private final AtualizarTelefoneClienteUseCase atualizarTelefoneClienteUseCase;

    /**
     * Obtém dados do cliente logado
     * O clienteId virá do token JWT (será implementado via SecurityContext)
     */
    @GetMapping("/me")
    public ResponseEntity<ClienteDTO> me(@RequestHeader("X-Cliente-Id") String clienteId) {
        ClienteDTO cliente = buscarClientePorIdUseCase.executar(clienteId);
        return ResponseEntity.ok(cliente);
    }

    /**
     * Define ou altera senha do cliente
     */
    @PostMapping("/senha")
    public ResponseEntity<ClienteDTO> definirSenha(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody DefinirSenhaClienteRequest request) {
        ClienteDTO cliente = definirSenhaClienteUseCase.executar(clienteId, request);
        return ResponseEntity.ok(cliente);
    }

    /**
     * Salva senha do cliente (criação ou alteração).
     * Se o cliente já tiver senha, exige a senha atual.
     */
    @PutMapping("/senha")
    public ResponseEntity<Void> salvarSenha(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody SalvarSenhaRequest request) {
        salvarSenhaClienteUseCase.executar(clienteId, request);
        return ResponseEntity.ok().build();
    }

    /**
     * Atualiza o telefone do cliente.
     * Útil para clientes que fizeram login via Google (que não fornece telefone).
     */
    @PutMapping("/telefone")
    public ResponseEntity<ClienteDTO> atualizarTelefone(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody AtualizarTelefoneRequest request) {
        ClienteDTO cliente = atualizarTelefoneClienteUseCase.executar(clienteId, request);
        return ResponseEntity.ok(cliente);
    }

    /**
     * Vincula conta Google ao cliente
     */
    @PostMapping("/vincular-google")
    public ResponseEntity<ClienteDTO> vincularGoogle(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody VincularGoogleRequest request) {
        ClienteDTO cliente = vincularGoogleUseCase.executar(clienteId, request);
        return ResponseEntity.ok(cliente);
    }

    /**
     * Desvincula conta Google do cliente
     */
    @DeleteMapping("/desvincular-google")
    public ResponseEntity<ClienteDTO> desvincularGoogle(
            @RequestHeader("X-Cliente-Id") String clienteId) {
        ClienteDTO cliente = desvincularGoogleUseCase.executar(clienteId);
        return ResponseEntity.ok(cliente);
    }

    // ========== FAVORITOS (endpoint público para cliente) ==========

    /**
     * Adiciona produto aos favoritos do cliente
     */
    @PostMapping("/favoritos")
    public ResponseEntity<ClienteFavoritoDTO> adicionarFavorito(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody AdicionarFavoritoRequest request) {
        ClienteFavoritoDTO favorito = adicionarFavoritoUseCase.executar(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(favorito);
    }

    /**
     * Remove produto dos favoritos do cliente
     */
    @DeleteMapping("/favoritos/{produtoId}")
    public ResponseEntity<Void> removerFavorito(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @PathVariable String produtoId) {
        removerFavoritoUseCase.executar(clienteId, produtoId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Lista favoritos do cliente
     */
    @GetMapping("/favoritos")
    public ResponseEntity<List<ClienteFavoritoDTO>> listarFavoritos(
            @RequestHeader("X-Cliente-Id") String clienteId) {
        List<ClienteFavoritoDTO> favoritos = listarFavoritosUseCase.executar(clienteId);
        return ResponseEntity.ok(favoritos);
    }

    /**
     * Lista IDs dos produtos favoritos do cliente
     */
    @GetMapping("/favoritos/ids")
    public ResponseEntity<List<String>> listarIdsProdutosFavoritos(
            @RequestHeader("X-Cliente-Id") String clienteId) {
        List<String> ids = listarFavoritosUseCase.listarIdsProdutos(clienteId);
        return ResponseEntity.ok(ids);
    }

    // ========== AVALIAÇÕES (endpoint público para cliente) ==========

    /**
     * Avalia ou atualiza avaliação de um produto
     */
    @PostMapping("/avaliacoes")
    public ResponseEntity<ClienteAvaliacaoDTO> avaliarProduto(
            @RequestHeader("X-Cliente-Id") String clienteId,
            @Valid @RequestBody AvaliarProdutoRequest request) {
        ClienteAvaliacaoDTO avaliacao = avaliarProdutoUseCase.executar(clienteId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(avaliacao);
    }

    /**
     * Lista avaliações do cliente
     */
    @GetMapping("/avaliacoes")
    public ResponseEntity<List<ClienteAvaliacaoDTO>> listarAvaliacoes(
            @RequestHeader("X-Cliente-Id") String clienteId) {
        List<ClienteAvaliacaoDTO> avaliacoes = buscarAvaliacoesUseCase.buscarPorCliente(clienteId);
        return ResponseEntity.ok(avaliacoes);
    }
}
