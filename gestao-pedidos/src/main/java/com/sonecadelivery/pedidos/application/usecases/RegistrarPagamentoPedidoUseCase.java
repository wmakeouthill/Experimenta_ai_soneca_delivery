package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoRequest;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.application.services.AuditoriaPagamentoService;
import com.sonecadelivery.pedidos.application.services.AuditoriaPagamentoService.ContextoRequisicao;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamentoPedido;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.StatusPedido;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

/**
 * Use case para registrar pagamento de um pedido existente.
 * 
 * Utilizado principalmente para pedidos de mesa que não têm pagamento
 * definido no momento da criação.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrarPagamentoPedidoUseCase {

    /**
     * Status válidos para registrar pagamento.
     * PENDENTE: Pedido aguardando preparação
     * PREPARANDO: Pedido em preparação
     * PRONTO: Pedido pronto para retirada/entrega
     */
    private static final Set<StatusPedido> STATUS_VALIDOS_PARA_PAGAMENTO = EnumSet.of(
            StatusPedido.PENDENTE,
            StatusPedido.PREPARANDO,
            StatusPedido.PRONTO);

    private final PedidoRepositoryPort pedidoRepository;
    private final AuditoriaPagamentoService auditoriaPagamentoService;

    @Transactional
    public PedidoDTO executar(
            @NonNull String pedidoId,
            @NonNull List<MeioPagamentoRequest> meiosPagamento,
            @Nullable ContextoRequisicao contexto) {

        if (contexto == null) {
            contexto = ContextoRequisicao.vazio();
        }

        Pedido pedido = pedidoRepository.buscarPorId(pedidoId)
                .orElseThrow(() -> new ValidationException("Pedido não encontrado com ID: " + pedidoId));

        // Valida que o status do pedido permite registro de pagamento
        StatusPedido statusAtual = pedido.getStatus();
        if (!STATUS_VALIDOS_PARA_PAGAMENTO.contains(statusAtual)) {
            throw new ValidationException(
                    String.format("Não é possível registrar pagamento para pedido com status '%s'. " +
                            "Status válidos: %s",
                            statusAtual.getDescricao(),
                            STATUS_VALIDOS_PARA_PAGAMENTO.stream()
                                    .map(StatusPedido::getDescricao)
                                    .toList()));
        }

        // Valida que não há pagamento já registrado
        if (pedido.getMeiosPagamento() != null && !pedido.getMeiosPagamento().isEmpty()) {
            throw new ValidationException("Pedido já possui pagamento registrado");
        }

        // Adiciona os meios de pagamento
        BigDecimal totalPagamento = BigDecimal.ZERO;
        for (MeioPagamentoRequest meioPagamentoRequest : meiosPagamento) {
            Preco valor = Preco.of(meioPagamentoRequest.getValor());
            MeioPagamentoPedido meioPagamentoPedido = MeioPagamentoPedido.criar(
                    meioPagamentoRequest.getMeioPagamento(),
                    valor);
            pedido.adicionarMeioPagamento(meioPagamentoPedido);
            totalPagamento = totalPagamento.add(meioPagamentoRequest.getValor());
        }

        // Valida que o total pago é igual ao valor do pedido
        BigDecimal valorPedido = pedido.getValorTotal().getAmount();
        if (totalPagamento.compareTo(valorPedido) != 0) {
            throw new ValidationException(
                    String.format("Valor do pagamento (R$ %.2f) deve ser igual ao valor do pedido (R$ %.2f)",
                            totalPagamento.doubleValue(),
                            valorPedido.doubleValue()));
        }

        Pedido pedidoAtualizado = pedidoRepository.salvar(pedido);

        // Registra auditoria do pagamento (assíncrono)
        auditoriaPagamentoService.registrarPagamentoPosterior(pedidoAtualizado, contexto);

        log.info("[PAGAMENTO] Pagamento registrado para pedido {}: R$ {}",
                pedidoAtualizado.getNumeroPedido().getNumero(),
                totalPagamento);

        return PedidoDTO.de(pedidoAtualizado);
    }

    /**
     * Método de compatibilidade para chamadas sem contexto.
     */
    @Transactional
    public PedidoDTO executar(@NonNull String pedidoId, @NonNull List<MeioPagamentoRequest> meiosPagamento) {
        return executar(pedidoId, meiosPagamento, null);
    }
}
