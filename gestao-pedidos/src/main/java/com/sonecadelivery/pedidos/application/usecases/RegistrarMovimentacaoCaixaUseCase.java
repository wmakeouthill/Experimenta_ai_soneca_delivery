package com.sonecadelivery.pedidos.application.usecases;

import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.application.dto.MovimentacaoCaixaDTO;
import com.sonecadelivery.pedidos.application.ports.MovimentacaoCaixaRepositoryPort;
import com.sonecadelivery.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.sonecadelivery.pedidos.domain.entities.MovimentacaoCaixa;
import com.sonecadelivery.pedidos.domain.entities.SessaoTrabalho;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Use case para registrar movimentações de caixa (sangria e suprimento).
 * Vendas em dinheiro são registradas na tabela de pedidos, não no caixa.
 */
@Service
@RequiredArgsConstructor
public class RegistrarMovimentacaoCaixaUseCase {
    
    private final MovimentacaoCaixaRepositoryPort movimentacaoRepository;
    private final SessaoTrabalhoRepositoryPort sessaoRepository;
    
    /**
     * Registra uma sangria (retirada de dinheiro) no caixa.
     */
    public MovimentacaoCaixaDTO registrarSangria(
            @NonNull String sessaoId,
            @NonNull BigDecimal valor,
            String descricao
    ) {
        SessaoTrabalho sessao = validarSessaoAberta(sessaoId);
        
        // Usa o usuário da sessão como responsável pela movimentação
        String usuarioId = sessao.getUsuarioId();
        MovimentacaoCaixa movimentacao = MovimentacaoCaixa.criarSangria(sessaoId, usuarioId, valor, descricao);
        MovimentacaoCaixa salva = movimentacaoRepository.salvar(movimentacao);
        return MovimentacaoCaixaDTO.de(salva);
    }
    
    /**
     * Registra um suprimento (entrada de dinheiro) no caixa.
     */
    public MovimentacaoCaixaDTO registrarSuprimento(
            @NonNull String sessaoId,
            @NonNull BigDecimal valor,
            String descricao
    ) {
        SessaoTrabalho sessao = validarSessaoAberta(sessaoId);
        
        // Usa o usuário da sessão como responsável pela movimentação
        String usuarioId = sessao.getUsuarioId();
        MovimentacaoCaixa movimentacao = MovimentacaoCaixa.criarSuprimento(sessaoId, usuarioId, valor, descricao);
        MovimentacaoCaixa salva = movimentacaoRepository.salvar(movimentacao);
        return MovimentacaoCaixaDTO.de(salva);
    }
    
    private SessaoTrabalho validarSessaoAberta(@NonNull String sessaoId) {
        Optional<SessaoTrabalho> sessaoOpt = sessaoRepository.buscarPorId(sessaoId);
        
        if (sessaoOpt.isEmpty()) {
            throw new ValidationException("Sessão não encontrada: " + sessaoId);
        }
        
        SessaoTrabalho sessao = sessaoOpt.get();
        if (!sessao.estaAtiva()) {
            throw new ValidationException("Não é possível registrar movimentação em uma sessão que não está ativa");
        }
        
        return sessao;
    }
}

