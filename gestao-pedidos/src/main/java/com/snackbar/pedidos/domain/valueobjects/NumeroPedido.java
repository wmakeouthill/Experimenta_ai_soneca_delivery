package com.snackbar.pedidos.domain.valueobjects;

import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Value;

@Value
public class NumeroPedido {
    String numero;

    private NumeroPedido(String numero) {
        if (numero == null || numero.trim().isEmpty()) {
            throw new ValidationException("Número do pedido não pode ser nulo ou vazio");
        }
        this.numero = numero.trim();
    }

    public static NumeroPedido of(String numero) {
        return new NumeroPedido(numero);
    }

    /**
     * Cria um NumeroPedido a partir de um número inteiro.
     * 
     * @param numero Número inteiro do pedido
     * @return NumeroPedido formatado com 4 dígitos (ex: 0001, 0042, 1234)
     */
    public static NumeroPedido de(int numero) {
        if (numero <= 0) {
            throw new ValidationException("Número do pedido deve ser maior que zero");
        }
        return new NumeroPedido(String.format("%04d", numero));
    }

    public static NumeroPedido gerarProximo(int ultimoNumero) {
        int proximoNumero = ultimoNumero + 1;
        return new NumeroPedido(String.format("%04d", proximoNumero));
    }

    public static NumeroPedido gerarPrimeiro() {
        return gerarProximo(0);
    }
}
