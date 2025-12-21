package com.sonecadelivery.autenticacao.infrastructure.security;

/**
 * @deprecated Use {@link com.sonecadelivery.kernel.security.JwtUserDetails} instead.
 *             Esta classe foi movida para o kernel-compartilhado para evitar
 *             dependências circulares.
 */
@Deprecated
public class JwtUserDetails extends com.sonecadelivery.kernel.security.JwtUserDetails {
    public JwtUserDetails(String email, String id) {
        super(email, id);
    }
}
