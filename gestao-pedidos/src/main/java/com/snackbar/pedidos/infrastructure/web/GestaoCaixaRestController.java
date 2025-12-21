package com.snackbar.pedidos.infrastructure.web;

import com.snackbar.pedidos.application.dto.DescricaoMovimentacaoDTO;
import com.snackbar.pedidos.application.dto.EstatisticasCaixaDTO;
import com.snackbar.pedidos.application.dto.MovimentacaoCaixaDTO;
import com.snackbar.pedidos.application.dto.RegistrarMovimentacaoRequest;
import com.snackbar.pedidos.application.dto.ResumoCaixaDTO;
import com.snackbar.pedidos.application.usecases.BuscarDescricoesMovimentacaoUseCase;
import com.snackbar.pedidos.application.usecases.BuscarEstatisticasCaixaUseCase;
import com.snackbar.pedidos.application.usecases.BuscarResumoCaixaUseCase;
import com.snackbar.pedidos.application.usecases.ListarMovimentacoesCaixaUseCase;
import com.snackbar.pedidos.application.usecases.RegistrarMovimentacaoCaixaUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gestão de caixa.
 */
@RestController
@RequestMapping("/api/caixa")
@RequiredArgsConstructor
public class GestaoCaixaRestController {

    private final ListarMovimentacoesCaixaUseCase listarMovimentacoesUseCase;
    private final BuscarResumoCaixaUseCase buscarResumoUseCase;
    private final RegistrarMovimentacaoCaixaUseCase registrarMovimentacaoUseCase;
    private final BuscarDescricoesMovimentacaoUseCase buscarDescricoesUseCase;
    private final BuscarEstatisticasCaixaUseCase buscarEstatisticasUseCase;

    /**
     * Lista todas as movimentações de caixa de uma sessão.
     */
    @GetMapping("/sessao/{sessaoId}/movimentacoes")
    public ResponseEntity<List<MovimentacaoCaixaDTO>> listarMovimentacoes(
            @NonNull @PathVariable String sessaoId) {
        List<MovimentacaoCaixaDTO> movimentacoes = listarMovimentacoesUseCase.executar(sessaoId);
        return ResponseEntity.ok(movimentacoes);
    }

    /**
     * Busca o resumo do caixa de uma sessão.
     */
    @GetMapping("/sessao/{sessaoId}/resumo")
    public ResponseEntity<ResumoCaixaDTO> buscarResumo(
            @NonNull @PathVariable String sessaoId) {
        ResumoCaixaDTO resumo = buscarResumoUseCase.executar(sessaoId);
        return ResponseEntity.ok(resumo);
    }

    /**
     * Registra uma sangria (retirada de dinheiro) no caixa.
     */
    @SuppressWarnings("null") // @Valid garante que valor não é null
    @PostMapping("/sessao/{sessaoId}/sangria")
    public ResponseEntity<MovimentacaoCaixaDTO> registrarSangria(
            @NonNull @PathVariable String sessaoId,
            @Valid @RequestBody RegistrarMovimentacaoRequest request) {
        MovimentacaoCaixaDTO movimentacao = registrarMovimentacaoUseCase.registrarSangria(
                sessaoId,
                request.getValor(),
                request.getDescricao());
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Registra um suprimento (entrada de dinheiro) no caixa.
     */
    @SuppressWarnings("null") // @Valid garante que valor não é null
    @PostMapping("/sessao/{sessaoId}/suprimento")
    public ResponseEntity<MovimentacaoCaixaDTO> registrarSuprimento(
            @NonNull @PathVariable String sessaoId,
            @Valid @RequestBody RegistrarMovimentacaoRequest request) {
        MovimentacaoCaixaDTO movimentacao = registrarMovimentacaoUseCase.registrarSuprimento(
                sessaoId,
                request.getValor(),
                request.getDescricao());
        return ResponseEntity.status(HttpStatus.CREATED).body(movimentacao);
    }

    /**
     * Busca todas as descrições de movimentações com contagem de uso.
     * Usado para autocomplete no frontend, ordenado por frequência de uso.
     */
    @GetMapping("/descricoes-movimentacao")
    public ResponseEntity<List<DescricaoMovimentacaoDTO>> buscarDescricoesMovimentacao() {
        List<DescricaoMovimentacaoDTO> descricoes = buscarDescricoesUseCase.executar();
        return ResponseEntity.ok(descricoes);
    }

    /**
     * Busca estatísticas de movimentações (sangrias e suprimentos).
     * Retorna as 20 descrições mais usadas para cada tipo com quantidade e valor
     * total.
     */
    @GetMapping("/estatisticas")
    public ResponseEntity<EstatisticasCaixaDTO> buscarEstatisticas() {
        EstatisticasCaixaDTO estatisticas = buscarEstatisticasUseCase.executar();
        return ResponseEntity.ok(estatisticas);
    }
}
