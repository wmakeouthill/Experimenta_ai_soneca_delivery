package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.dto.SessaoTrabalhoDTO;
import com.snackbar.pedidos.application.ports.PedidoRepositoryPort;
import com.snackbar.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.snackbar.pedidos.domain.entities.Pedido;
import com.snackbar.pedidos.domain.entities.SessaoTrabalho;
import com.snackbar.pedidos.domain.entities.StatusPedido;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FinalizarSessaoTrabalhoUseCase {
    
    private final SessaoTrabalhoRepositoryPort repository;
    private final PedidoRepositoryPort pedidoRepository;
    
    @SuppressWarnings("null") // repository.salvar() nunca retorna null, .get() nunca retorna null porque validamos antes
    public SessaoTrabalhoDTO executar(@NonNull String sessaoId, @NonNull BigDecimal valorFechamento) {
        SessaoTrabalho sessao = buscarSessao(sessaoId);
        validarPedidosPendentes(sessaoId);
        sessao.finalizar(valorFechamento);
        SessaoTrabalho sessaoSalva = repository.salvar(sessao);
        return SessaoTrabalhoDTO.de(sessaoSalva);
    }
    
    private void validarPedidosPendentes(@NonNull String sessaoId) {
        List<Pedido> pedidos = pedidoRepository.buscarPorSessaoId(sessaoId);
        
        List<Pedido> pedidosPendentes = pedidos.stream()
            .filter(p -> p.getStatus() == StatusPedido.PENDENTE || p.getStatus() == StatusPedido.PREPARANDO)
            .toList();
        
        if (!pedidosPendentes.isEmpty()) {
            long quantidadePendentes = pedidosPendentes.stream()
                .filter(p -> p.getStatus() == StatusPedido.PENDENTE)
                .count();
            long quantidadePreparando = pedidosPendentes.stream()
                .filter(p -> p.getStatus() == StatusPedido.PREPARANDO)
                .count();
            
            StringBuilder mensagem = new StringBuilder("Não é possível finalizar a sessão. Existem pedidos pendentes: ");
            if (quantidadePendentes > 0) {
                mensagem.append(quantidadePendentes).append(" aguardando");
            }
            if (quantidadePendentes > 0 && quantidadePreparando > 0) {
                mensagem.append(" e ");
            }
            if (quantidadePreparando > 0) {
                mensagem.append(quantidadePreparando).append(" em preparação");
            }
            mensagem.append(".");
            
            throw new ValidationException(mensagem.toString());
        }
    }
    
    private SessaoTrabalho buscarSessao(@NonNull String sessaoId) {
        Optional<SessaoTrabalho> sessao = repository.buscarPorId(sessaoId);
        if (sessao.isEmpty()) {
            throw new ValidationException("Sessão não encontrada: " + sessaoId);
        }
        return sessao.get();
    }
}

