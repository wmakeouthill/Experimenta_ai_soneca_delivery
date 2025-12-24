package com.sonecadelivery.pedidos.application.usecase;

import com.sonecadelivery.pedidos.infrastructure.persistence.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * UseCase para criação de pedidos delivery com idempotência e transação
 * atômica.
 * 
 * IDEMPOTÊNCIA: Usa idempotency_key para garantir que o mesmo pedido não seja
 * criado duas vezes,
 * mesmo que o cliente envie a mesma requisição múltiplas vezes (ex: retry após
 * timeout).
 * 
 * ATOMICIDADE: Usa @Transactional para garantir que todas as operações (pedido,
 * itens, adicionais,
 * meios de pagamento) sejam commitadas juntas ou todas sejam revertidas em caso
 * de erro.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CriarPedidoDeliveryUseCase {

    private final PedidoDeliveryJpaRepository pedidoRepository;

    /**
     * Cria um novo pedido de delivery com idempotência.
     * 
     * @param comando Dados do pedido a ser criado
     * @return Resultado com o pedido criado ou existente (em caso de duplicata)
     */
    @Transactional
    public ResultadoCriacaoPedido executar(ComandoCriarPedido comando) {
        log.info("Criando pedido delivery. IdempotencyKey: {}", comando.idempotencyKey());

        // 1. Verificar idempotência - se já existe pedido com essa key, retorna o
        // existente
        if (comando.idempotencyKey() != null && !comando.idempotencyKey().isBlank()) {
            Optional<PedidoDeliveryEntity> pedidoExistente = pedidoRepository
                    .findByIdempotencyKey(comando.idempotencyKey());
            if (pedidoExistente.isPresent()) {
                log.info("Pedido já existe para idempotencyKey: {}. Retornando existente.", comando.idempotencyKey());
                return new ResultadoCriacaoPedido(pedidoExistente.get(), true);
            }
        }

        // 2. Gerar número sequencial do pedido
        String numeroPedido = gerarNumeroPedido();

        // 3. Criar entidade do pedido
        PedidoDeliveryEntity pedido = PedidoDeliveryEntity.builder()
                .id(UUID.randomUUID().toString())
                .numeroPedido(numeroPedido)
                .idempotencyKey(comando.idempotencyKey())
                // Cliente
                .clienteId(comando.clienteId())
                .nomeCliente(comando.nomeCliente())
                .telefoneCliente(comando.telefoneCliente())
                .emailCliente(comando.emailCliente())
                // Endereço
                .enderecoEntrega(comando.enderecoCompleto())
                .logradouro(comando.logradouro())
                .numero(comando.numero())
                .complemento(comando.complemento())
                .bairro(comando.bairro())
                .cidade(comando.cidade())
                .estado(comando.estado())
                .cep(comando.cep())
                .pontoReferencia(comando.pontoReferencia())
                // Tipo e Status
                .tipoPedido(comando.tipoPedido())
                .status(PedidoDeliveryEntity.StatusPedidoDelivery.AGUARDANDO_ACEITACAO)
                // Valores (serão calculados)
                .valorItens(BigDecimal.ZERO)
                .valorAdicionais(BigDecimal.ZERO)
                .taxaEntrega(comando.taxaEntrega() != null ? comando.taxaEntrega() : BigDecimal.ZERO)
                .valorMotoboy(new BigDecimal("5.00")) // Valor padrão R$ 5,00 por entrega
                .valorDesconto(comando.valorDesconto() != null ? comando.valorDesconto() : BigDecimal.ZERO)
                .valorTotal(BigDecimal.ZERO)
                // Pagamento
                .meioPagamento(comando.meioPagamento())
                .trocoPara(comando.trocoPara())
                // Observações
                .observacoes(comando.observacoes())
                // Previsão
                .previsaoEntrega(calcularPrevisaoEntrega())
                .build();

        // 4. Adicionar itens
        BigDecimal totalItens = BigDecimal.ZERO;
        BigDecimal totalAdicionais = BigDecimal.ZERO;
        int ordem = 0;

        for (ItemPedidoInput itemInput : comando.itens()) {
            ItemPedidoDeliveryEntity item = ItemPedidoDeliveryEntity.builder()
                    .id(UUID.randomUUID().toString())
                    .produtoId(itemInput.produtoId())
                    .nomeProduto(itemInput.nomeProduto())
                    .descricaoProduto(itemInput.descricaoProduto())
                    .quantidade(itemInput.quantidade())
                    .precoUnitario(itemInput.precoUnitario())
                    .valorAdicionais(BigDecimal.ZERO)
                    .observacoes(itemInput.observacoes())
                    .ordem(ordem++)
                    .build();

            // Adicionar adicionais do item
            BigDecimal valorAdicionaisItem = BigDecimal.ZERO;
            if (itemInput.adicionais() != null) {
                for (AdicionalItemInput adicionalInput : itemInput.adicionais()) {
                    AdicionalItemPedidoDeliveryEntity adicional = AdicionalItemPedidoDeliveryEntity.builder()
                            .id(UUID.randomUUID().toString())
                            .adicionalId(adicionalInput.adicionalId())
                            .nomeAdicional(adicionalInput.nomeAdicional())
                            .quantidade(adicionalInput.quantidade())
                            .precoUnitario(adicionalInput.precoUnitario())
                            .build();
                    adicional.calcularSubtotal();
                    item.adicionarAdicional(adicional);
                    valorAdicionaisItem = valorAdicionaisItem.add(adicional.getSubtotal());
                }
            }

            item.setValorAdicionais(valorAdicionaisItem);
            item.calcularSubtotal();
            pedido.adicionarItem(item);

            totalItens = totalItens.add(item.getPrecoUnitario().multiply(BigDecimal.valueOf(item.getQuantidade())));
            totalAdicionais = totalAdicionais
                    .add(valorAdicionaisItem.multiply(BigDecimal.valueOf(item.getQuantidade())));
        }

        // 5. Adicionar meios de pagamento
        if (comando.meiosPagamento() != null) {
            for (MeioPagamentoInput meioPagamentoInput : comando.meiosPagamento()) {
                MeioPagamentoPedidoDeliveryEntity meioPagamento = MeioPagamentoPedidoDeliveryEntity.builder()
                        .id(UUID.randomUUID().toString())
                        .tipoPagamento(meioPagamentoInput.tipoPagamento())
                        .valor(meioPagamentoInput.valor())
                        .trocoPara(meioPagamentoInput.trocoPara())
                        .observacoes(meioPagamentoInput.observacoes())
                        .build();
                pedido.adicionarMeioPagamento(meioPagamento);
            }
        }

        // 6. Calcular valores finais
        pedido.setValorItens(totalItens);
        pedido.setValorAdicionais(totalAdicionais);

        BigDecimal valorTotal = totalItens
                .add(totalAdicionais)
                .add(pedido.getTaxaEntrega())
                .subtract(pedido.getValorDesconto());
        pedido.setValorTotal(valorTotal);
        pedido.setValorPago(valorTotal);

        // 7. Salvar tudo atomicamente
        PedidoDeliveryEntity pedidoSalvo = pedidoRepository.save(pedido);
        log.info("Pedido delivery criado com sucesso. ID: {}, Número: {}", pedidoSalvo.getId(),
                pedidoSalvo.getNumeroPedido());

        return new ResultadoCriacaoPedido(pedidoSalvo, false);
    }

    /**
     * Gera número sequencial do pedido no formato: DEL-YYYYMMDD-XXXX
     */
    private String gerarNumeroPedido() {
        String dataHoje = com.sonecadelivery.kernel.infrastructure.utils.DateTimeUtils.today().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long countHoje = pedidoRepository.countPedidosHoje();
        return String.format("DEL-%s-%04d", dataHoje, countHoje + 1);
    }

    /**
     * Calcula previsão de entrega (45 minutos por padrão).
     */
    private LocalDateTime calcularPrevisaoEntrega() {
        return com.sonecadelivery.kernel.infrastructure.utils.DateTimeUtils.now().plusMinutes(45);
    }

    // ===== Records para Input =====

    public record ComandoCriarPedido(
            String idempotencyKey,
            String clienteId,
            String nomeCliente,
            String telefoneCliente,
            String emailCliente,
            String enderecoCompleto,
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String estado,
            String cep,
            String pontoReferencia,
            PedidoDeliveryEntity.TipoPedidoDelivery tipoPedido,
            BigDecimal taxaEntrega,
            BigDecimal valorDesconto,
            String meioPagamento,
            BigDecimal trocoPara,
            String observacoes,
            List<ItemPedidoInput> itens,
            List<MeioPagamentoInput> meiosPagamento) {
    }

    public record ItemPedidoInput(
            String produtoId,
            String nomeProduto,
            String descricaoProduto,
            Integer quantidade,
            BigDecimal precoUnitario,
            String observacoes,
            List<AdicionalItemInput> adicionais) {
    }

    public record AdicionalItemInput(
            String adicionalId,
            String nomeAdicional,
            Integer quantidade,
            BigDecimal precoUnitario) {
    }

    public record MeioPagamentoInput(
            String tipoPagamento,
            BigDecimal valor,
            BigDecimal trocoPara,
            String observacoes) {
    }

    // ===== Record para Output =====

    public record ResultadoCriacaoPedido(
            PedidoDeliveryEntity pedido,
            boolean jáExistia) {
    }
}
