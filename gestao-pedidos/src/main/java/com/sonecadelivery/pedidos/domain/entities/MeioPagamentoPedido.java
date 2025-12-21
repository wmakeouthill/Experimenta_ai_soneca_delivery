package com.sonecadelivery.pedidos.domain.entities;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

@Getter
public class MeioPagamentoPedido {
    private MeioPagamento meioPagamento;
    private Preco valor;
    
    private MeioPagamentoPedido() {
    }
    
    public static MeioPagamentoPedido criar(MeioPagamento meioPagamento, Preco valor) {
        validarDados(meioPagamento, valor);
        
        MeioPagamentoPedido meioPagamentoPedido = new MeioPagamentoPedido();
        meioPagamentoPedido.meioPagamento = meioPagamento;
        meioPagamentoPedido.valor = valor;
        return meioPagamentoPedido;
    }
    
    private static void validarDados(MeioPagamento meioPagamento, Preco valor) {
        if (meioPagamento == null) {
            throw new ValidationException("Meio de pagamento não pode ser nulo");
        }
        if (valor == null) {
            throw new ValidationException("Valor não pode ser nulo");
        }
        if (!valor.isGreaterThan(Preco.zero())) {
            throw new ValidationException("Valor deve ser maior que zero");
        }
    }
}

