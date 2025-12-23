package com.sonecadelivery.orquestrador.controller;

import com.sonecadelivery.cardapio.application.dto.AdicionalDTO;
import com.sonecadelivery.cardapio.application.dto.CategoriaDTO;
import com.sonecadelivery.cardapio.application.dto.ProdutoDTO;
import com.sonecadelivery.cardapio.application.usecases.GerenciarAdicionaisProdutoUseCase;
import com.sonecadelivery.cardapio.application.usecases.ListarCategoriasUseCase;
import com.sonecadelivery.cardapio.application.usecases.ListarProdutosUseCase;
import com.sonecadelivery.pedidos.application.dto.CriarPedidoDeliveryRequest;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoAdicionalRequest;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoRequest;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoRequest;
import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.ProdutoPopularDTO;
import com.sonecadelivery.pedidos.application.services.FilaPedidosMesaService;
import com.sonecadelivery.pedidos.application.usecases.BuscarProdutosPopularesUseCase;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamento;
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
        private final FilaPedidosMesaService filaPedidosMesaService;
        private final PedidoDeliveryJpaRepository pedidoDeliveryRepository;
        private final BuscarProdutosPopularesUseCase buscarProdutosPopularesUseCase;
        private final GerenciarAdicionaisProdutoUseCase gerenciarAdicionaisProdutoUseCase;

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

        // Injeção do serviço SSE (adicionado via construtor do
        // @RequiredArgsConstructor)
        private final com.sonecadelivery.orquestrador.service.StatusLojaSSEService statusLojaSSEService;

        /**
         * Retorna o status atual da loja para o delivery.
         * Usado pelo frontend para verificar se pode aceitar pedidos.
         * 
         * Possíveis status:
         * - ABERTA: Loja está funcionando normalmente
         * - PAUSADA: Loja temporariamente indisponível (alta demanda, etc.)
         * - FECHADA: Não há sessão de trabalho ativa (loja fechada)
         */
        @GetMapping("/status")
        public ResponseEntity<StatusLojaResponse> verificarStatusLoja() {
                log.debug("Verificando status da loja para delivery");
                var status = statusLojaSSEService.getStatusAtual();
                return ResponseEntity.ok(new StatusLojaResponse(
                                StatusLoja.valueOf(status.status().name()),
                                status.mensagem(),
                                status.numeroSessao()));
        }

        /**
         * Endpoint SSE (Server-Sent Events) para receber atualizações de status em
         * tempo real.
         * O cliente mantém uma conexão aberta e recebe notificações quando o status
         * muda.
         * 
         * Uso no frontend:
         * const eventSource = new EventSource('/api/public/delivery/status/stream');
         * eventSource.addEventListener('status', (e) => { ... });
         */
        @GetMapping(value = "/status/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
        public org.springframework.web.servlet.mvc.method.annotation.SseEmitter streamStatusLoja() {
                log.debug("Novo cliente SSE conectando para stream de status");
                return statusLojaSSEService.registrar();
        }

        /**
         * Cria um novo pedido de delivery/retirada.
         * 
         * O pedido é adicionado à FILA DE PENDENTES para ser aceito por um funcionário.
         * Isso permite que o pedido apareça em tempo real na tela de Gestão de Pedidos.
         * 
         * FLUXO:
         * 1. Cliente envia pedido → vai para fila de pendentes
         * 2. Funcionário vê o pedido na tela de gestão (em tempo real via polling)
         * 3. Funcionário aceita → pedido é criado de verdade no sistema
         * 
         * Este é o mesmo fluxo dos pedidos de mesa (QR code).
         */
        @PostMapping("/pedido")
        public ResponseEntity<PedidoDeliveryResponse> criarPedido(
                        @Valid @RequestBody CriarPedidoDeliveryRequestInternal requestDTO,
                        @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey) {

                log.info("Criando pedido delivery para fila de pendentes - Cliente: {}, Tipo: {}",
                                requestDTO.nomeCliente(), requestDTO.tipoPedido());

                // Converter DTO do request para o DTO do domínio
                CriarPedidoDeliveryRequest request = converterParaRequest(requestDTO);

                // Adicionar à fila de pendentes (mesmo fluxo dos pedidos de mesa)
                PedidoPendenteDTO pedidoPendente = filaPedidosMesaService.adicionarPedidoDelivery(request);

                // Mapear para response
                PedidoDeliveryResponse response = new PedidoDeliveryResponse(
                                pedidoPendente.getId(),
                                "PEND-" + pedidoPendente.getId().substring(0, 8).toUpperCase(), // Número temporário
                                pedidoPendente.getNomeCliente(),
                                pedidoPendente.getTelefoneCliente(),
                                pedidoPendente.getTipoPedido(),
                                pedidoPendente.getEnderecoEntrega(),
                                "AGUARDANDO_ACEITACAO", // Status inicial
                                pedidoPendente.getValorTotal(),
                                null, // Previsão de entrega será definida ao aceitar
                                pedidoPendente.getDataHoraSolicitacao().toString());

                log.info("Pedido delivery adicionado à fila de pendentes - ID: {}", pedidoPendente.getId());
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
        }

        /**
         * Converte o DTO do request HTTP para o DTO do domínio.
         */
        private CriarPedidoDeliveryRequest converterParaRequest(CriarPedidoDeliveryRequestInternal requestDTO) {
                // Converter itens
                List<ItemPedidoRequest> itens = new ArrayList<>();
                for (ItemPedidoDeliveryRequest itemDTO : requestDTO.itens()) {
                        List<ItemPedidoAdicionalRequest> adicionais = null;
                        if (itemDTO.adicionais() != null && !itemDTO.adicionais().isEmpty()) {
                                adicionais = new ArrayList<>();
                                for (AdicionalItemDeliveryRequest adicionalDTO : itemDTO.adicionais()) {
                                        ItemPedidoAdicionalRequest adicional = new ItemPedidoAdicionalRequest();
                                        adicional.setAdicionalId(adicionalDTO.adicionalId());
                                        adicional.setQuantidade(adicionalDTO.quantidade());
                                        adicionais.add(adicional);
                                }
                        }

                        ItemPedidoRequest item = new ItemPedidoRequest();
                        item.setProdutoId(itemDTO.produtoId());
                        item.setQuantidade(itemDTO.quantidade());
                        item.setObservacoes(itemDTO.observacoes());
                        item.setAdicionais(adicionais);
                        itens.add(item);
                }

                // Converter meios de pagamento
                // Nota: A conversão de meios de pagamento requer mapeamento do tipo String para
                // o enum MeioPagamento
                List<MeioPagamentoRequest> meiosPagamento = new ArrayList<>();
                if (requestDTO.meiosPagamento() != null && !requestDTO.meiosPagamento().isEmpty()) {
                        for (MeioPagamentoDeliveryRequest mpDTO : requestDTO.meiosPagamento()) {
                                try {
                                        MeioPagamento tipo = MeioPagamento.valueOf(mpDTO.meioPagamento().toUpperCase()
                                                        .replace(" ", "_"));
                                        meiosPagamento.add(new MeioPagamentoRequest(tipo, mpDTO.valor()));
                                } catch (IllegalArgumentException e) {
                                        // Se não conseguir converter, usa DINHEIRO como padrão
                                        meiosPagamento.add(new MeioPagamentoRequest(MeioPagamento.DINHEIRO,
                                                        mpDTO.valor()));
                                }
                        }
                }

                return CriarPedidoDeliveryRequest.builder()
                                .clienteId(requestDTO.clienteId())
                                .nomeCliente(requestDTO.nomeCliente())
                                .telefoneCliente(requestDTO.telefoneCliente())
                                .emailCliente(requestDTO.emailCliente())
                                .itens(itens)
                                .meiosPagamento(meiosPagamento.isEmpty() ? null : meiosPagamento)
                                .tipoPedido(requestDTO.tipoPedido())
                                .enderecoEntrega(requestDTO.enderecoEntrega())
                                .logradouro(requestDTO.logradouro())
                                .numero(requestDTO.numero())
                                .complemento(requestDTO.complemento())
                                .bairro(requestDTO.bairro())
                                .cidade(requestDTO.cidade())
                                .estado(requestDTO.estado())
                                .cep(requestDTO.cep())
                                .pontoReferencia(requestDTO.pontoReferencia())
                                .taxaEntrega(requestDTO.taxaEntrega())
                                .valorDesconto(requestDTO.valorDesconto())
                                .previsaoEntregaCliente(null)
                                .trocoPara(requestDTO.trocoPara())
                                .observacoes(requestDTO.observacoes())
                                .build();
        }

        /**
         * Busca o status de um pedido.
         * 
         * FLUXO:
         * 1. Primeiro verifica se o pedido está na fila de pendentes
         * (AGUARDANDO_ACEITACAO)
         * 2. Se não estiver, busca na tabela de pedidos delivery aceitos
         */
        @GetMapping("/pedido/{pedidoId}/status")
        public ResponseEntity<StatusPedidoResponse> buscarStatusPedido(@PathVariable String pedidoId) {
                log.info("Buscando status do pedido: {}", pedidoId);

                // 1. Primeiro verifica na fila de pendentes
                var pedidoPendente = filaPedidosMesaService.buscarPorId(pedidoId);
                if (pedidoPendente.isPresent()) {
                        PedidoPendenteDTO pendente = pedidoPendente.get();
                        StatusPedidoResponse response = new StatusPedidoResponse(
                                        pendente.getId(),
                                        "PEND-" + pendente.getId().substring(0, 8).toUpperCase(),
                                        "AGUARDANDO_ACEITACAO",
                                        null, // Sem motoboy ainda
                                        null,
                                        null); // Sem previsão ainda
                        return ResponseEntity.ok(response);
                }

                // 2. Se não está pendente, busca nos pedidos aceitos
                return pedidoDeliveryRepository.findById(pedidoId)
                                .map(pedido -> {
                                        StatusPedidoResponse response = new StatusPedidoResponse(
                                                        pedido.getId(),
                                                        pedido.getNumeroPedido(),
                                                        pedido.getStatus().name(),
                                                        pedido.getMotoboyNome(),
                                                        null, // TODO: Adicionar telefone do motoboy se necessário
                                                        pedido.getPrevisaoEntrega() != null
                                                                        ? pedido.getPrevisaoEntrega().toString()
                                                                        : null);
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
                                                pedido.getPrevisaoEntrega() != null
                                                                ? pedido.getPrevisaoEntrega().toString()
                                                                : null,
                                                pedido.getCreatedAt().toString()))
                                .toList();

                return ResponseEntity.ok(responses);
        }

        /**
         * Retorna os produtos mais pedidos para o contexto de delivery.
         * Baseado na quantidade de vezes que o produto aparece em pedidos.
         */
        @GetMapping("/produtos/mais-pedidos")
        public ResponseEntity<List<ProdutoPopularDTO>> buscarMaisPedidos(
                        @RequestParam(defaultValue = "8") int limite) {
                List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarMaisPedidos(limite);
                return ResponseEntity.ok(produtos);
        }

        /**
         * Retorna os produtos mais bem avaliados para o contexto de delivery.
         * Baseado na média de avaliações dos clientes.
         */
        @GetMapping("/produtos/bem-avaliados")
        public ResponseEntity<List<ProdutoPopularDTO>> buscarBemAvaliados(
                        @RequestParam(defaultValue = "8") int limite) {
                List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarBemAvaliados(limite);
                return ResponseEntity.ok(produtos);
        }

        /**
         * Retorna os produtos mais favoritados para o contexto de delivery.
         * Baseado na quantidade de clientes que favoritaram cada produto.
         */
        @GetMapping("/produtos/mais-favoritados")
        public ResponseEntity<List<ProdutoPopularDTO>> buscarMaisFavoritados(
                        @RequestParam(defaultValue = "20") int limite) {
                List<ProdutoPopularDTO> produtos = buscarProdutosPopularesUseCase.buscarMaisFavoritados(limite);
                return ResponseEntity.ok(produtos);
        }

        /**
         * Retorna os adicionais disponíveis para um produto específico.
         * Endpoint público para que clientes possam ver os adicionais ao selecionar um
         * produto.
         */
        @GetMapping("/produtos/{produtoId}/adicionais")
        public ResponseEntity<List<AdicionalDTO>> buscarAdicionaisDoProduto(@PathVariable String produtoId) {
                log.debug("Buscando adicionais públicos do produto: {}", produtoId);
                try {
                        List<AdicionalDTO> adicionais = gerenciarAdicionaisProdutoUseCase
                                        .buscarAdicionaisDoProduto(produtoId);
                        // Filtra apenas os disponíveis
                        List<AdicionalDTO> disponiveis = adicionais.stream()
                                        .filter(AdicionalDTO::isDisponivel)
                                        .toList();
                        return ResponseEntity.ok(disponiveis);
                } catch (Exception e) {
                        log.warn("Erro ao buscar adicionais do produto {}: {}", produtoId, e.getMessage());
                        // Retorna lista vazia em caso de erro (produto não existe, etc.)
                        return ResponseEntity.ok(List.of());
                }
        }

        // ===== DTOs =====

        public record CardapioPublicoResponse(
                        List<CategoriaDTO> categorias,
                        List<ProdutoDTO> produtos) {
        }

        public record CriarPedidoDeliveryRequestInternal(
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

        /**
         * Status possíveis da loja para o delivery.
         */
        public enum StatusLoja {
                /** Loja funcionando normalmente */
                ABERTA,
                /** Loja temporariamente indisponível (alta demanda, etc.) */
                PAUSADA,
                /** Não há sessão de trabalho ativa */
                FECHADA
        }

        /**
         * Resposta do endpoint de status da loja.
         */
        public record StatusLojaResponse(
                        StatusLoja status,
                        String mensagem,
                        Integer numeroSessao) {
        }
}
