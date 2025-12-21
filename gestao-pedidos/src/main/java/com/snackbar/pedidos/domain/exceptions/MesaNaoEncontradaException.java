package com.snackbar.pedidos.domain.exceptions;

import com.snackbar.kernel.domain.exceptions.DomainException;

/**
 * Exceção lançada quando uma mesa não é encontrada.
 */
public class MesaNaoEncontradaException extends DomainException {

    public MesaNaoEncontradaException(String mesaId) {
        super("Mesa não encontrada: " + mesaId);
    }

    public static MesaNaoEncontradaException porId(String id) {
        return new MesaNaoEncontradaException(id);
    }

    public static MesaNaoEncontradaException porToken(String token) {
        return new MesaNaoEncontradaException("Token QR: " + token);
    }

    public static MesaNaoEncontradaException porNumero(int numero) {
        return new MesaNaoEncontradaException("Número: " + numero);
    }
}
