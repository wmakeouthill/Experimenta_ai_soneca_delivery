package com.snackbar.pedidos.application.usecases;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import com.snackbar.pedidos.application.dto.CriarPedidoMesaRequest;
import com.snackbar.pedidos.application.dto.PedidoPendenteDTO;
import com.snackbar.pedidos.application.ports.CardapioServicePort;
import com.snackbar.pedidos.application.ports.MesaRepositoryPort;
import com.snackbar.pedidos.application.services.FilaPedidosMesaService;
import com.snackbar.pedidos.domain.entities.Mesa;
import com.snackbar.pedidos.domain.exceptions.MesaNaoEncontradaException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

/**
 * Use case para criar pedido via mesa (cliente escaneando QR code).
 * 
 * O pedido não é criado diretamente - ele vai para uma fila de pendentes
 * e aguarda um funcionário aceitar para ser criado de verdade.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CriarPedidoMesaUseCase {

    private final MesaRepositoryPort mesaRepository;
    private final CardapioServicePort cardapioService;
    private final FilaPedidosMesaService filaPedidosMesa;

    /**
     * Adiciona o pedido à fila de pendentes.
     * O pedido só será criado quando um funcionário aceitar.
     */
    public PedidoPendenteDTO executar(@NonNull String qrCodeToken, CriarPedidoMesaRequest request) {
        // Valida mesa
        validarMesa(qrCodeToken);

        // Valida produtos
        request.getItens().forEach(item -> validarProdutoDisponivel(item.getProdutoId()));

        // Adiciona à fila de pendentes
        PedidoPendenteDTO pedidoPendente = filaPedidosMesa.adicionarPedido(request);

        log.info("Pedido adicionado à fila de espera - ID: {}, Mesa: {}, Cliente: {}",
                pedidoPendente.getId(),
                pedidoPendente.getNumeroMesa(),
                pedidoPendente.getNomeCliente());

        return pedidoPendente;
    }

    private void validarMesa(String qrCodeToken) {
        Mesa mesa = mesaRepository.buscarPorQrCodeToken(qrCodeToken)
                .orElseThrow(() -> MesaNaoEncontradaException.porToken(qrCodeToken));

        if (!mesa.isAtiva()) {
            throw new ValidationException("Esta mesa não está ativa para receber pedidos");
        }
    }

    private void validarProdutoDisponivel(String produtoId) {
        if (!cardapioService.produtoEstaDisponivel(produtoId)) {
            throw new ValidationException("Produto não está disponível: " + produtoId);
        }
    }
}
