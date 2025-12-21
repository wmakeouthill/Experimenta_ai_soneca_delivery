package com.sonecadelivery.pedidos.infrastructure.web;

import com.sonecadelivery.pedidos.infrastructure.idempotency.IdempotencyService;
import com.sonecadelivery.pedidos.application.dto.CriarPedidoMesaRequest;
import com.sonecadelivery.pedidos.application.dto.MesaDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO;
import com.sonecadelivery.pedidos.application.dto.ClientePublicoDTO;
import com.sonecadelivery.pedidos.application.dto.CadastrarClienteRequest;
import com.sonecadelivery.pedidos.application.dto.ProdutoPopularDTO;
import com.sonecadelivery.pedidos.application.dto.StatusPedidoClienteDTO;
import com.sonecadelivery.pedidos.application.usecases.BuscarMesaPorTokenUseCase;
import com.sonecadelivery.pedidos.application.usecases.CriarPedidoMesaUseCase;
import com.sonecadelivery.pedidos.application.usecases.BuscarCardapioPublicoUseCase;
import com.sonecadelivery.pedidos.application.usecases.BuscarProdutosPopularesUseCase;
import com.sonecadelivery.pedidos.application.usecases.BuscarStatusPedidoClienteUseCase;
import com.sonecadelivery.pedidos.application.ports.ClienteGatewayPort;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST público para pedidos via mesa (QR Code).
 * Este controller não requer autenticação, pois é acessado pelo cliente via QR
 * code.
 * 
 * FLUXO:
 * 1. Cliente escaneia QR code → valida mesa
 * 2. Cliente se identifica pelo telefone
 * 3. Cliente faz pedido → vai para FILA DE PENDENTES
 * 4. Funcionário aceita o pedido → cria pedido real (via
 * FilaPedidosMesaController)
 * 
 * Suporta idempotência via header X-Idempotency-Key para evitar
 * criação de pedidos duplicados.
 */
@RestController
@RequestMapping("/api/public/mesa")
@RequiredArgsConstructor
public class PedidoMesaRestController {

    private final BuscarMesaPorTokenUseCase buscarMesaPorTokenUseCase;
    private final CriarPedidoMesaUseCase criarPedidoMesaUseCase;
    private final BuscarCardapioPublicoUseCase buscarCardapioPublicoUseCase;
    private final BuscarProdutosPopularesUseCase buscarProdutosPopularesUseCase;
    private final BuscarStatusPedidoClienteUseCase buscarStatusPedidoClienteUseCase;
    private final ClienteGatewayPort clienteGateway;
    private final IdempotencyService idempotencyService;

    /**
     * Valida o token da mesa e retorna os dados da mesa.
     * Endpoint público acessado quando cliente escaneia QR code.
     */
    @GetMapping("/{token}")
    public ResponseEntity<MesaDTO> validarMesa(@NonNull @PathVariable String token) {
        MesaDTO mesa = buscarMesaPorTokenUseCase.executar(token);
        return ResponseEntity.ok(mesa);
    }

    /**
     * Retorna o cardápio público para a mesa.
     * Contém categorias ativas e produtos disponíveis.
     */
    @GetMapping("/{token}/cardapio")
    public ResponseEntity<CardapioPublicoDTO> buscarCardapio(@NonNull @PathVariable String token) {
        // Primeiro valida se a mesa existe e está ativa
        buscarMesaPorTokenUseCase.executar(token);
        CardapioPublicoDTO cardapio = buscarCardapioPublicoUseCase.executar();
        return ResponseEntity.ok(cardapio);
    }

    /**
     * Busca cliente por telefone.
     * Retorna 404 se cliente não encontrado (para redirecionar para cadastro).
     */
    @GetMapping("/{token}/cliente/{telefone}")
    public ResponseEntity<ClientePublicoDTO> buscarClientePorTelefone(
            @NonNull @PathVariable String token,
            @NonNull @PathVariable String telefone) {
        // Valida se a mesa existe
        buscarMesaPorTokenUseCase.executar(token);

        return clienteGateway.buscarPorTelefone(telefone)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Cadastra novo cliente via mesa.
     * Endpoint público para auto-cadastro do cliente.
     */
    @PostMapping("/{token}/cliente")
    public ResponseEntity<ClientePublicoDTO> cadastrarCliente(
            @NonNull @PathVariable String token,
            @Valid @RequestBody CadastrarClienteRequest request) {
        // Valida se a mesa existe
        buscarMesaPorTokenUseCase.executar(token);

        // Verifica se já existe cliente com este telefone
        var clienteExistente = clienteGateway.buscarPorTelefone(request.getTelefone());
        if (clienteExistente.isPresent()) {
            return ResponseEntity.ok(clienteExistente.get());
        }

        ClientePublicoDTO novoCliente = clienteGateway.cadastrar(request.getNome(), request.getTelefone());
        return ResponseEntity.status(HttpStatus.CREATED).body(novoCliente);
    }

    /**
     * Cria um pedido via mesa (QR Code).
     * O pedido vai para uma fila de pendentes e aguarda aceitação de um
     * funcionário.
     * Endpoint público que não requer autenticação.
     * 
     * Suporta idempotência via header X-Idempotency-Key para evitar
     * criação de pedidos duplicados em caso de retry.
     * 
     * @param request        Dados do pedido
     * @param idempotencyKey Chave de idempotência opcional
     * @return PedidoPendenteDTO com os dados do pedido na fila
     */
    @PostMapping("/pedido")
    public ResponseEntity<PedidoPendenteDTO> criarPedido(
            @Valid @RequestBody CriarPedidoMesaRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            return idempotencyService.executeIdempotent(
                    idempotencyKey,
                    "POST /api/public/mesa/pedido",
                    () -> criarPedidoMesaUseCase.executar(request.mesaToken(), request),
                    PedidoPendenteDTO.class);
        }

        PedidoPendenteDTO pedidoPendente = criarPedidoMesaUseCase.executar(request.mesaToken(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pedidoPendente);
    }

    /**
     * Busca o status de um pedido do cliente.
     * Retorna o status atual do pedido (na fila ou já aceito).
     * Endpoint público para polling do cliente.
     */
    @GetMapping("/pedido/{pedidoId}/status")
    public ResponseEntity<StatusPedidoClienteDTO> buscarStatusPedido(@NonNull @PathVariable String pedidoId) {
        return buscarStatusPedidoClienteUseCase.executar(pedidoId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Retorna os produtos mais pedidos.
     * Baseado na quantidade de vezes que o produto aparece em pedidos.
     */
    @GetMapping("/{token}/produtos/mais-pedidos")
    public ResponseEntity<List<ProdutoPopularDTO>> buscarMaisPedidos(
            @NonNull @PathVariable String token,
            @RequestParam(defaultValue = "8") int limite) {
        buscarMesaPorTokenUseCase.executar(token);
        List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarMaisPedidos(limite);
        return ResponseEntity.ok(produtos);
    }

    /**
     * Retorna os produtos mais pedidos por um cliente específico.
     * Baseado no histórico de pedidos do cliente.
     */
    @GetMapping("/{token}/produtos/mais-pedidos-cliente/{clienteId}")
    public ResponseEntity<List<ProdutoPopularDTO>> buscarMaisPedidosCliente(
            @NonNull @PathVariable String token,
            @NonNull @PathVariable String clienteId,
            @RequestParam(defaultValue = "8") int limite) {
        buscarMesaPorTokenUseCase.executar(token);
        List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarMaisPedidosPorCliente(clienteId,
                limite);
        return ResponseEntity.ok(produtos);
    }

    /**
     * Retorna os produtos mais bem avaliados.
     * Baseado na média de avaliações dos clientes.
     */
    @GetMapping("/{token}/produtos/bem-avaliados")
    public ResponseEntity<List<ProdutoPopularDTO>> buscarBemAvaliados(
            @NonNull @PathVariable String token,
            @RequestParam(defaultValue = "8") int limite) {
        buscarMesaPorTokenUseCase.executar(token);
        List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarBemAvaliados(limite);
        return ResponseEntity.ok(produtos);
    }

    /**
     * Retorna os produtos mais favoritados.
     * Baseado na quantidade de clientes que favoritaram cada produto.
     */
    @GetMapping("/{token}/produtos/mais-favoritados")
    public ResponseEntity<List<ProdutoPopularDTO>> buscarMaisFavoritados(
            @NonNull @PathVariable String token,
            @RequestParam(defaultValue = "20") int limite) {
        buscarMesaPorTokenUseCase.executar(token);
        List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarMaisFavoritados(limite);
        return ResponseEntity.ok(produtos);
    }
}
