package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.AdicionalPedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.ItemPedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.dto.MeioPagamentoRequest;
import com.sonecadelivery.pedidos.application.dto.PedidoDTO;
import com.sonecadelivery.pedidos.application.dto.PedidoPendenteDTO;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.sonecadelivery.pedidos.application.services.AuditoriaPagamentoService;
import com.sonecadelivery.pedidos.application.services.AuditoriaPagamentoService.ContextoRequisicao;
import com.sonecadelivery.pedidos.application.services.FilaPedidosMesaService;
import com.sonecadelivery.pedidos.application.services.GeradorNumeroPedidoService;
import com.sonecadelivery.pedidos.domain.entities.ItemPedido;
import com.sonecadelivery.pedidos.domain.entities.ItemPedidoAdicional;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamentoPedido;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.valueobjects.NumeroPedido;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use case para funcionário aceitar um pedido pendente de mesa.
 * 
 * Quando o funcionário aceita, o pedido é:
 * 1. Removido atomicamente da fila de pendentes (thread-safe)
 * 2. Criado como pedido real no sistema (com retry em caso de conflito)
 * 3. Vinculado ao usuário que aceitou
 * 4. Colocado no status PENDENTE para preparação
 * 
 * PROTEÇÕES DE CONCORRÊNCIA:
 * - Remoção atômica da fila evita que dois funcionários aceitem o mesmo pedido
 * - Retry automático em caso de conflito de número de pedido
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AceitarPedidoMesaUseCase {

    private final FilaPedidosMesaService filaPedidosMesa;
    private final PedidoRepositoryPort pedidoRepository;
    private final SessaoTrabalhoRepositoryPort sessaoTrabalhoRepository;
    private final GeradorNumeroPedidoService geradorNumeroPedido;
    private final AuditoriaPagamentoService auditoriaPagamentoService;

    private static final int MAX_TENTATIVAS_CONCORRENCIA = 3;

    @Transactional
    public PedidoDTO executar(String pedidoPendenteId, String usuarioId, @Nullable ContextoRequisicao contexto) {
        if (contexto == null) {
            contexto = ContextoRequisicao.vazio();
        }

        // Valida parâmetros
        if (pedidoPendenteId == null || pedidoPendenteId.isBlank()) {
            throw new ValidationException("ID do pedido pendente é obrigatório");
        }
        if (usuarioId == null || usuarioId.isBlank()) {
            throw new ValidationException("ID do usuário é obrigatório");
        }

        // Busca e remove atomicamente o pedido da fila (thread-safe)
        // Isso garante que apenas um funcionário consiga aceitar o mesmo pedido
        PedidoPendenteDTO pedidoPendente = filaPedidosMesa.buscarERemoverAtomicamente(pedidoPendenteId)
                .orElseThrow(() -> new ValidationException(
                        "Pedido pendente não encontrado ou já foi aceito/expirado: " + pedidoPendenteId));

        // Tenta criar o pedido com retry em caso de conflito de número
        return criarPedidoComRetry(pedidoPendente, usuarioId, pedidoPendenteId, contexto);
    }

    /**
     * Método de compatibilidade para chamadas sem contexto.
     */
    @Transactional
    public PedidoDTO executar(String pedidoPendenteId, String usuarioId) {
        return executar(pedidoPendenteId, usuarioId, null);
    }

    private PedidoDTO criarPedidoComRetry(
            PedidoPendenteDTO pedidoPendente,
            String usuarioId,
            String pedidoPendenteId,
            ContextoRequisicao contexto) {
        int tentativas = 0;
        DataIntegrityViolationException ultimaExcecao = null;

        while (tentativas < MAX_TENTATIVAS_CONCORRENCIA) {
            tentativas++;

            try {
                return criarPedidoReal(pedidoPendente, usuarioId, pedidoPendenteId, contexto);
            } catch (DataIntegrityViolationException e) {
                log.warn("Conflito de integridade ao aceitar (tentativa {}), tentando novamente...", tentativas);
                ultimaExcecao = e;
            }
        }

        log.error("Falha ao aceitar pedido após {} tentativas por conflito de integridade",
                MAX_TENTATIVAS_CONCORRENCIA);
        throw new IllegalStateException(
                "Não foi possível aceitar o pedido após " + MAX_TENTATIVAS_CONCORRENCIA +
                        " tentativas devido a alta concorrência",
                ultimaExcecao);
    }

    private PedidoDTO criarPedidoReal(
            PedidoPendenteDTO pedidoPendente,
            String usuarioId,
            String pedidoPendenteId,
            ContextoRequisicao contexto) {
        // Gera número do pedido usando o serviço dedicado
        NumeroPedido numeroPedido = geradorNumeroPedido.gerarProximoNumero();

        // Cria o pedido real vinculado ao funcionário que aceitou
        Pedido pedido = Pedido.criar(
                numeroPedido,
                pedidoPendente.getClienteId(),
                pedidoPendente.getNomeCliente(),
                usuarioId);

        // Define a mesa
        pedido.definirMesa(pedidoPendente.getMesaId(), pedidoPendente.getNumeroMesa(), pedidoPendente.getNomeCliente());

        // Adiciona os itens
        for (ItemPedidoPendenteDTO itemPendente : pedidoPendente.getItens()) {
            Preco precoUnitario = Preco.of(itemPendente.getPrecoUnitario());

            ItemPedido item = ItemPedido.criar(
                    itemPendente.getProdutoId(),
                    itemPendente.getNomeProduto(),
                    itemPendente.getQuantidade(),
                    precoUnitario,
                    itemPendente.getObservacoes());

            // Adiciona os adicionais ao item
            if (itemPendente.getAdicionais() != null && !itemPendente.getAdicionais().isEmpty()) {
                for (AdicionalPedidoPendenteDTO adicionalPendente : itemPendente.getAdicionais()) {
                    ItemPedidoAdicional adicional = ItemPedidoAdicional.criar(
                            adicionalPendente.getAdicionalId(),
                            adicionalPendente.getNome(),
                            adicionalPendente.getQuantidade(),
                            Preco.of(adicionalPendente.getPrecoUnitario()));
                    item.adicionarAdicional(adicional);
                }
            }

            pedido.adicionarItem(item);
        }

        // Adiciona observações
        if (pedidoPendente.getObservacoes() != null && !pedidoPendente.getObservacoes().isBlank()) {
            pedido.atualizarObservacoes(pedidoPendente.getObservacoes());
        }

        // Adiciona meios de pagamento do pedido pendente
        if (pedidoPendente.getMeiosPagamento() != null) {
            for (MeioPagamentoRequest mpRequest : pedidoPendente.getMeiosPagamento()) {
                MeioPagamentoPedido meioPagamento = MeioPagamentoPedido.criar(
                        mpRequest.getMeioPagamento(),
                        Preco.of(mpRequest.getValor()));
                pedido.adicionarMeioPagamento(meioPagamento);
            }
            log.debug("Adicionados {} meios de pagamento ao pedido",
                    pedidoPendente.getMeiosPagamento().size());
        }

        // Vincula sessão de trabalho ativa
        sessaoTrabalhoRepository.buscarSessaoAtiva()
                .ifPresent(sessao -> pedido.definirSessaoId(sessao.getId()));

        // Salva o pedido
        Pedido pedidoSalvo = pedidoRepository.salvar(pedido);

        // Registra auditoria do pagamento (assíncrono)
        if (!pedidoSalvo.getMeiosPagamento().isEmpty()) {
            auditoriaPagamentoService.registrarPagamentoMesa(pedidoSalvo, contexto);
        }

        // Nota: A remoção da fila já foi feita atomicamente em
        // buscarERemoverAtomicamente()
        // Registra mapeamento pendente -> pedido real para que o cliente acompanhe o
        // status
        filaPedidosMesa.registrarConversaoParaPedidoReal(pedidoPendenteId, pedidoSalvo.getId());

        log.info("Pedido aceito - Número: {}, Mesa: {}, Usuário: {}, Cliente: {}",
                pedidoSalvo.getNumeroPedido().getNumero(),
                pedidoPendente.getNumeroMesa(),
                usuarioId,
                pedidoPendente.getNomeCliente());

        return PedidoDTO.de(pedidoSalvo);
    }
}
