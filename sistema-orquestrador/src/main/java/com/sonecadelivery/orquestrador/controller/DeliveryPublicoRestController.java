package com.sonecadelivery.orquestrador.controller;

import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;
import com.sonecadelivery.cardapio.application.usecases.BuscarProdutoPorIdUseCase;
import com.sonecadelivery.cardapio.application.usecases.ListarCategoriasUseCase;
import com.sonecadelivery.cardapio.application.usecases.ListarProdutosUseCase;
import com.sonecadelivery.pedidos.application.usecase.CriarPedidoDeliveryUseCase;
import com.sonecadelivery.pedidos.application.usecase.CriarPedidoDeliveryUseCase.*;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryEntity;
import com.sonecadelivery.pedidos.infrastructure.persistence.PedidoDeliveryJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Controller público para operações de delivery.
 * Endpoints acessíveis sem autenticação para clientes fazerem pedidos.
 * 
 * IDEMPOTÊNCIA: O header X-Idempotency-Key é usado para garantir que o mesmo
 * pedido
 * não seja criado duas vezes, mesmo em caso de retry do cliente.
 */
@RestController
@RequestMapping("/api/public/delivery")
@RequiredArgsConstructor
@Slf4j
public class DeliveryPublicoRestController {

    private final ListarCategoriasUseCase listarCategoriasUseCase;
    private final ListarProdutosUseCase listarProdutosUseCase;
    private final BuscarProdutoPorIdUseCase buscarProdutoPorIdUseCase;
    private final CriarPedidoDeliveryUseCase criarPedidoDeliveryUseCase;
    private final PedidoDeliveryJpaRepository pedidoDeliveryRepository;

    /**
     * Retorna o cardápio público para delivery.
     */
    @GetMapping("/cardapio")
    public ResponseEntity<CardapioPublicoResponse> buscarCardapio() {
        log.info("Buscando cardápio público para delivery");

        List<CategoriaDTO> categorias = listarCategoriasUseCase.executarAtivas();
        List<ProdutoDTO> produtos = listarProdutosUseCase.executarDisponiveis();

        CardapioPublicoResponse response = new CardapioPublicoResponse(categorias, produtos);
        return ResponseEntity.ok(response);
    }

    /**
     * Cria um novo pedido de delivery/retirada.
     * 
     * IDEMPOTÊNCIA:
     * - Se o header X-Idempotency-Key for fornecido e já existir um pedido com essa
     * key,
     * retorna o pedido existente com status 200 (OK) em vez de 201 (Created).
     * - Isso garante que o cliente pode fazer retry da requisição sem criar
     * duplicatas.
     * 
     * RECOMENDAÇÃO: O frontend deve gerar um UUID único para cada tentativa de
     * pedido
     * e enviar no header X-Idempotency-Key.
     */
    @PostMapping("/pedido")
    public ResponseEntity<PedidoDeliveryResponse> criarPedido(
            @Valid @RequestBody CriarPedidoDeliveryRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

        log.info("Criando pedido delivery para cliente: {}. IdempotencyKey: {}",
                request.nomeCliente(), idempotencyKey);

        // Gerar idempotencyKey se não fornecido
        String finalIdempotencyKey = idempotencyKey != null ? idempotencyKey : UUID.randomUUID().toString();

        // Converter DTOs para comandos do UseCase
        List<ItemPedidoInput> itensInput = new ArrayList<>();
        for (ItemPedidoDeliveryRequest itemRequest : request.itens()) {
            // Buscar dados do produto
            ProdutoDTO produto = buscarProdutoPorIdUseCase.executar(itemRequest.produtoId());

            List<AdicionalItemInput> adicionaisInput = new ArrayList<>();
            if (itemRequest.adicionais() != null) {
                for (AdicionalItemDeliveryRequest adicionalRequest : itemRequest.adicionais()) {
                    // TODO: Buscar dados do adicional
                    adicionaisInput.add(new AdicionalItemInput(
                            adicionalRequest.adicionalId(),
                            adicionalRequest.nomeAdicional() != null ? adicionalRequest.nomeAdicional() : "Adicional",
                            adicionalRequest.quantidade(),
                            adicionalRequest.precoUnitario() != null ? adicionalRequest.precoUnitario()
                                    : BigDecimal.ZERO));
                }
            }

            itensInput.add(new ItemPedidoInput(
                    itemRequest.produtoId(),
                    produto != null ? produto.getNome() : "Produto",
                    produto != null ? produto.getDescricao() : "",
                    itemRequest.quantidade(),
                    produto != null ? produto.getPreco() : BigDecimal.ZERO,
                    itemRequest.observacoes(),
                    adicionaisInput));
        }

        // Converter meios de pagamento
        List<MeioPagamentoInput> meiosPagamentoInput = new ArrayList<>();
        if (request.meiosPagamento() != null) {
            for (MeioPagamentoDeliveryRequest mpRequest : request.meiosPagamento()) {
                meiosPagamentoInput.add(new MeioPagamentoInput(
                        mpRequest.meioPagamento(),
                        mpRequest.valor(),
                        mpRequest.trocoPara(),
                        null));
            }
        }

        // Criar comando
        ComandoCriarPedido comando = new ComandoCriarPedido(
                finalIdempotencyKey,
                request.clienteId(),
                request.nomeCliente(),
                request.telefoneCliente(),
                request.emailCliente(),
                request.enderecoEntrega(),
                request.logradouro(),
                request.numero(),
                request.complemento(),
                request.bairro(),
                request.cidade(),
                request.estado(),
                request.cep(),
                request.pontoReferencia(),
                "RETIRADA".equalsIgnoreCase(request.tipoPedido())
                        ? PedidoDeliveryEntity.TipoPedidoDelivery.RETIRADA
                        : PedidoDeliveryEntity.TipoPedidoDelivery.DELIVERY,
                request.taxaEntrega(),
                request.valorDesconto(),
                request.meioPagamento(),
                request.trocoPara(),
                request.observacoes(),
                itensInput,
                meiosPagamentoInput);

        // Executar criação com idempotência
        ResultadoCriacaoPedido resultado = criarPedidoDeliveryUseCase.executar(comando);

        // Mapear para response
        PedidoDeliveryEntity pedido = resultado.pedido();
        PedidoDeliveryResponse response = new PedidoDeliveryResponse(
                pedido.getId(),
                pedido.getNumeroPedido(),
                pedido.getNomeCliente(),
                pedido.getTelefoneCliente(),
                pedido.getTipoPedido().name(),
                pedido.getEnderecoEntrega(),
                pedido.getStatus().name(),
                pedido.getValorTotal(),
                pedido.getPrevisaoEntrega() != null ? pedido.getPrevisaoEntrega().toString() : null,
                pedido.getCreatedAt().toString());

        // Retornar 200 se já existia, 201 se criou novo
        if (resultado.jáExistia()) {
            log.info("Pedido já existia. Retornando existente: {}", pedido.getId());
            return ResponseEntity.ok(response);
        } else {
            log.info("Pedido criado com sucesso: {}", pedido.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }
    }

    /**
     * Busca o status de um pedido.
     */
    @GetMapping("/pedido/{pedidoId}/status")
    public ResponseEntity<StatusPedidoResponse> buscarStatusPedido(@PathVariable String pedidoId) {
        log.info("Buscando status do pedido: {}", pedidoId);

        return pedidoDeliveryRepository.findById(pedidoId)
                .map(pedido -> {
                    StatusPedidoResponse response = new StatusPedidoResponse(
                            pedido.getId(),
                            pedido.getNumeroPedido(),
                            pedido.getStatus().name(),
                            pedido.getMotoboyNome(),
                            null, // TODO: Adicionar telefone do motoboy se necessário
                            pedido.getPrevisaoEntrega() != null ? pedido.getPrevisaoEntrega().toString() : null);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Lista pedidos de um cliente (por clienteId ou telefone).
     */
    @GetMapping("/pedidos")
    public ResponseEntity<List<PedidoDeliveryResponse>> listarPedidosCliente(
            @RequestParam(required = false) String clienteId,
            @RequestParam(required = false) String telefone) {

        List<PedidoDeliveryEntity> pedidos;

        if (clienteId != null && !clienteId.isBlank()) {
            pedidos = pedidoDeliveryRepository.findByClienteIdOrderByCreatedAtDesc(clienteId);
        } else if (telefone != null && !telefone.isBlank()) {
            pedidos = pedidoDeliveryRepository.findByTelefoneClienteOrderByCreatedAtDesc(telefone);
        } else {
            return ResponseEntity.badRequest().build();
        }

        List<PedidoDeliveryResponse> responses = pedidos.stream()
                .map(pedido -> new PedidoDeliveryResponse(
                        pedido.getId(),
                        pedido.getNumeroPedido(),
                        pedido.getNomeCliente(),
                        pedido.getTelefoneCliente(),
                        pedido.getTipoPedido().name(),
                        pedido.getEnderecoEntrega(),
                        pedido.getStatus().name(),
                        pedido.getValorTotal(),
                        pedido.getPrevisaoEntrega() != null ? pedido.getPrevisaoEntrega().toString() : null,
                        pedido.getCreatedAt().toString()))
                .toList();

        return ResponseEntity.ok(responses);
    }

    // ===== DTOs =====

    public record CardapioPublicoResponse(
            List<CategoriaDTO> categorias,
            List<ProdutoDTO> produtos) {
    }

    public record CriarPedidoDeliveryRequest(
            String clienteId,
            @NotBlank(message = "Nome do cliente é obrigatório") String nomeCliente,
            @NotBlank(message = "Telefone do cliente é obrigatório") String telefoneCliente,
            String emailCliente,
            @NotEmpty(message = "Pelo menos um item é obrigatório") List<ItemPedidoDeliveryRequest> itens,
            List<MeioPagamentoDeliveryRequest> meiosPagamento,
            @NotBlank(message = "Tipo do pedido é obrigatório") String tipoPedido,
            String enderecoEntrega,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String estado,
            String cep,
            String pontoReferencia,
            BigDecimal taxaEntrega,
            BigDecimal valorDesconto,
            String meioPagamento,
            BigDecimal trocoPara,
            String observacoes) {
    }

    public record ItemPedidoDeliveryRequest(
            @NotBlank(message = "ID do produto é obrigatório") String produtoId,
            @NotNull(message = "Quantidade é obrigatória") Integer quantidade,
            String observacoes,
            List<AdicionalItemDeliveryRequest> adicionais) {
    }

    public record AdicionalItemDeliveryRequest(
            @NotBlank(message = "ID do adicional é obrigatório") String adicionalId,
            String nomeAdicional,
            @NotNull(message = "Quantidade é obrigatória") Integer quantidade,
            BigDecimal precoUnitario) {
    }

    public record MeioPagamentoDeliveryRequest(
            @NotBlank(message = "Meio de pagamento é obrigatório") String meioPagamento,
            @NotNull(message = "Valor é obrigatório") BigDecimal valor,
            BigDecimal trocoPara) {
    }

    public record PedidoDeliveryResponse(
            String id,
            String numeroPedido,
            String nomeCliente,
            String telefoneCliente,
            String tipoPedido,
            String enderecoEntrega,
            String status,
            BigDecimal total,
            String previsaoEntrega,
            String createdAt) {
    }

    public record StatusPedidoResponse(
            String id,
            String numeroPedido,
            String status,
            String nomeMotoboyAtribuido,
            String telefoneMotoboyAtribuido,
            String previsaoEntrega) {
    }
}
