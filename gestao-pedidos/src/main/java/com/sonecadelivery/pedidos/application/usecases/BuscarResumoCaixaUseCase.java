package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.ItemCaixaDTO;
import com.sonecadelivery.pedidos.application.dto.ResumoCaixaDTO;
import com.sonecadelivery.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.PedidoRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamento;
import com.sonecadelivery.pedidos.domain.entities.MeioPagamentoPedido;
import com.sonecadelivery.pedidos.domain.entities.MovimentacaoCaixa;
import com.sonecadelivery.pedidos.domain.entities.Pedido;
import com.sonecadelivery.pedidos.domain.entities.SessaoTrabalho;
import com.sonecadelivery.pedidos.domain.entities.StatusSessao;
import com.sonecadelivery.pedidos.domain.entities.TipoMovimentacaoCaixa;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Use case para buscar o resumo do caixa de uma sessão.
 * Busca vendas em dinheiro diretamente dos pedidos e sangrias/suprimentos da
 * tabela de caixa.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BuscarResumoCaixaUseCase {

    private final MovimentacaoCaixaRepositoryPort movimentacaoRepository;
    private final SessaoTrabalhoRepositoryPort sessaoRepository;
    private final PedidoRepositoryPort pedidoRepository;

    public ResumoCaixaDTO executar(@NonNull String sessaoId) {
        log.debug("[CAIXA] Buscando resumo para sessao: {}", sessaoId);
        SessaoTrabalho sessao = buscarSessao(sessaoId);

        // Buscar movimentações (sangrias e suprimentos)
        List<MovimentacaoCaixa> movimentacoes = movimentacaoRepository.buscarPorSessaoId(sessaoId);

        // Buscar pedidos da sessão que têm pagamento em dinheiro
        List<Pedido> pedidosSessao = pedidoRepository.buscarPorSessaoId(sessaoId);
        log.debug("[CAIXA] Pedidos encontrados para sessao {}: {}", sessaoId, pedidosSessao.size());

        for (Pedido p : pedidosSessao) {
            log.debug("[CAIXA] Pedido {}: status={}, meiosPagamento={}",
                    p.getNumeroPedido() != null ? p.getNumeroPedido().getNumero() : "?",
                    p.getStatus(),
                    p.getMeiosPagamento() != null ? p.getMeiosPagamento().size() : 0);
        }

        List<ItemCaixaDTO> vendasDinheiro = extrairVendasEmDinheiro(pedidosSessao);
        log.debug("[CAIXA] Vendas em dinheiro extraidas: {}", vendasDinheiro.size());

        // Criar itens de sangria e suprimento
        List<ItemCaixaDTO> sangriasSuplementos = criarItensSangriasSuprimentos(movimentacoes);

        // Unificar todos os itens e ordenar por data/hora (mais recente primeiro)
        List<ItemCaixaDTO> todosItens = new ArrayList<>();
        todosItens.addAll(vendasDinheiro);
        todosItens.addAll(sangriasSuplementos);
        todosItens.sort(Comparator.comparing(ItemCaixaDTO::getDataHora).reversed());

        // Calcular totais
        BigDecimal valorAbertura = sessao.getValorAbertura() != null ? sessao.getValorAbertura() : BigDecimal.ZERO;
        BigDecimal totalVendasDinheiro = vendasDinheiro.stream()
                .map(ItemCaixaDTO::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSangrias = calcularTotalPorTipo(movimentacoes, TipoMovimentacaoCaixa.SANGRIA);
        BigDecimal totalSuprimentos = calcularTotalPorTipo(movimentacoes, TipoMovimentacaoCaixa.SUPRIMENTO);

        BigDecimal saldoEsperado = valorAbertura
                .add(totalVendasDinheiro)
                .add(totalSuprimentos)
                .subtract(totalSangrias.abs());

        BigDecimal valorFechamento = sessao.getValorFechamento();
        BigDecimal diferenca = valorFechamento != null
                ? valorFechamento.subtract(saldoEsperado)
                : null;

        // Calcular diferença global (soma de todas as sessões fechadas)
        BigDecimal diferencaGlobal = calcularDiferencaGlobal();

        // Calcular diferença da sessão anterior
        BigDecimal diferencaSessaoAnterior = null;
        String nomeSessaoAnterior = null;

        Optional<SessaoTrabalho> sessaoAnteriorOpt = sessaoRepository.buscarSessaoAnterior(
                sessao.getDataInicioCompleta());

        if (sessaoAnteriorOpt.isPresent()) {
            SessaoTrabalho sessaoAnterior = sessaoAnteriorOpt.get();
            diferencaSessaoAnterior = calcularDiferencaSessao(sessaoAnterior);
            nomeSessaoAnterior = sessaoAnterior.obterNome();
        }

        return ResumoCaixaDTO.builder()
                .sessaoId(sessaoId)
                .nomeSessao(sessao.obterNome())
                .valorAbertura(valorAbertura)
                .totalVendasDinheiro(totalVendasDinheiro)
                .quantidadeVendasDinheiro(vendasDinheiro.size())
                .totalSangrias(totalSangrias.abs())
                .totalSuprimentos(totalSuprimentos)
                .saldoEsperado(saldoEsperado)
                .valorFechamento(valorFechamento)
                .diferenca(diferenca)
                .diferencaGlobal(diferencaGlobal)
                .diferencaSessaoAnterior(diferencaSessaoAnterior)
                .nomeSessaoAnterior(nomeSessaoAnterior)
                .itensCaixa(todosItens)
                .totalItens(todosItens.size())
                .build();
    }

    /**
     * Extrai as vendas em dinheiro dos pedidos da sessão.
     * Considera apenas pedidos NÃO CANCELADOS que têm pagamento em dinheiro.
     */
    private List<ItemCaixaDTO> extrairVendasEmDinheiro(List<Pedido> pedidos) {
        List<ItemCaixaDTO> vendasDinheiro = new ArrayList<>();

        for (Pedido pedido : pedidos) {
            // Ignora pedidos cancelados
            if (pedido.getStatus() == com.sonecadelivery.pedidos.domain.entities.StatusPedido.CANCELADO) {
                log.debug("[CAIXA] Pedido {} ignorado - status CANCELADO",
                        pedido.getNumeroPedido() != null ? pedido.getNumeroPedido().getNumero() : pedido.getId());
                continue;
            }

            if (pedido.getMeiosPagamento() == null || pedido.getMeiosPagamento().isEmpty()) {
                log.debug("[CAIXA] Pedido {} sem meios de pagamento",
                        pedido.getNumeroPedido() != null ? pedido.getNumeroPedido().getNumero() : pedido.getId());
                continue;
            }

            for (MeioPagamentoPedido mp : pedido.getMeiosPagamento()) {
                log.debug("[CAIXA] Pedido {}: meioPagamento={}, valor={}",
                        pedido.getNumeroPedido() != null ? pedido.getNumeroPedido().getNumero() : pedido.getId(),
                        mp.getMeioPagamento(),
                        mp.getValor() != null ? mp.getValor().getAmount() : "null");

                if (mp.getMeioPagamento() == MeioPagamento.DINHEIRO) {
                    BigDecimal valorDinheiro = mp.getValor() != null
                            ? mp.getValor().getAmount()
                            : BigDecimal.ZERO;

                    if (valorDinheiro.compareTo(BigDecimal.ZERO) > 0) {
                        Integer numeroPedido = Integer.parseInt(pedido.getNumeroPedido().getNumero());

                        vendasDinheiro.add(ItemCaixaDTO.criarVendaDinheiro(
                                pedido.getId(),
                                numeroPedido,
                                pedido.getClienteNome(),
                                pedido.getDataPedido(),
                                valorDinheiro,
                                pedido.getUsuarioId()));
                        log.debug("[CAIXA] Adicionada venda em dinheiro: pedido={}, valor={}", numeroPedido,
                                valorDinheiro);
                    }
                }
            }
        }

        return vendasDinheiro;
    }

    /**
     * Cria itens de caixa a partir das movimentações (sangrias e suprimentos).
     */
    private List<ItemCaixaDTO> criarItensSangriasSuprimentos(List<MovimentacaoCaixa> movimentacoes) {
        List<ItemCaixaDTO> itens = new ArrayList<>();

        for (MovimentacaoCaixa mov : movimentacoes) {
            if (mov.getTipo() == TipoMovimentacaoCaixa.SANGRIA) {
                itens.add(ItemCaixaDTO.criarSangria(
                        mov.getId(),
                        mov.getDataMovimentacao(),
                        mov.getDescricao(),
                        mov.getValor(),
                        mov.getUsuarioId()));
            } else if (mov.getTipo() == TipoMovimentacaoCaixa.SUPRIMENTO) {
                itens.add(ItemCaixaDTO.criarSuprimento(
                        mov.getId(),
                        mov.getDataMovimentacao(),
                        mov.getDescricao(),
                        mov.getValor(),
                        mov.getUsuarioId()));
            }
        }

        return itens;
    }

    private SessaoTrabalho buscarSessao(@NonNull String sessaoId) {
        Optional<SessaoTrabalho> sessao = sessaoRepository.buscarPorId(sessaoId);
        if (sessao.isEmpty()) {
            throw new ValidationException("Sessão não encontrada: " + sessaoId);
        }
        return sessao.get();
    }

    private BigDecimal calcularTotalPorTipo(List<MovimentacaoCaixa> movimentacoes, TipoMovimentacaoCaixa tipo) {
        return movimentacoes.stream()
                .filter(m -> m.getTipo() == tipo)
                .map(MovimentacaoCaixa::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Calcula a diferença global somando as diferenças de todas as sessões
     * fechadas.
     */
    private BigDecimal calcularDiferencaGlobal() {
        List<SessaoTrabalho> sessoesFechadas = sessaoRepository.buscarPorStatus(StatusSessao.FINALIZADA);

        BigDecimal total = BigDecimal.ZERO;
        for (SessaoTrabalho sessao : sessoesFechadas) {
            BigDecimal diferenca = calcularDiferencaSessao(sessao);
            if (diferenca != null) {
                total = total.add(diferenca);
            }
        }
        return total;
    }

    /**
     * Calcula a diferença de uma sessão específica.
     */
    private BigDecimal calcularDiferencaSessao(SessaoTrabalho sessao) {
        if (sessao.getValorFechamento() == null) {
            return null;
        }

        BigDecimal valorAbertura = sessao.getValorAbertura() != null
                ? sessao.getValorAbertura()
                : BigDecimal.ZERO;

        // Buscar movimentações da sessão
        List<MovimentacaoCaixa> movimentacoes = movimentacaoRepository.buscarPorSessaoId(sessao.getId());
        BigDecimal totalSangrias = calcularTotalPorTipo(movimentacoes, TipoMovimentacaoCaixa.SANGRIA);
        BigDecimal totalSuprimentos = calcularTotalPorTipo(movimentacoes, TipoMovimentacaoCaixa.SUPRIMENTO);

        // Buscar vendas em dinheiro da sessão
        List<Pedido> pedidos = pedidoRepository.buscarPorSessaoId(sessao.getId());
        BigDecimal totalVendasDinheiro = calcularTotalVendasDinheiro(pedidos);

        BigDecimal saldoEsperado = valorAbertura
                .add(totalVendasDinheiro)
                .add(totalSuprimentos)
                .subtract(totalSangrias.abs());

        return sessao.getValorFechamento().subtract(saldoEsperado);
    }

    /**
     * Calcula o total de vendas em dinheiro de uma lista de pedidos.
     */
    private BigDecimal calcularTotalVendasDinheiro(List<Pedido> pedidos) {
        BigDecimal total = BigDecimal.ZERO;

        for (Pedido pedido : pedidos) {
            if (pedido.getMeiosPagamento() == null)
                continue;

            for (MeioPagamentoPedido mp : pedido.getMeiosPagamento()) {
                if (mp.getMeioPagamento() == MeioPagamento.DINHEIRO && mp.getValor() != null) {
                    total = total.add(mp.getValor().getAmount());
                }
            }
        }

        return total;
    }
}
