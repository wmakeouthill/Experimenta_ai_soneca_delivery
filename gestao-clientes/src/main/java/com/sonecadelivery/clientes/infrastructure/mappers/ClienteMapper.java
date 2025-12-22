package com.sonecadelivery.clientes.infrastructure.mappers;

import com.sonecadelivery.clientes.domain.entities.Cliente;
import com.sonecadelivery.clientes.infrastructure.persistence.ClienteEntity;
import org.springframework.stereotype.Component;

@Component
public class ClienteMapper {

        public ClienteEntity paraEntity(Cliente cliente) {
                return ClienteEntity.builder()
                                .id(cliente.getId())
                                .nome(cliente.getNome())
                                .telefone(cliente.getTelefone())
                                .email(cliente.getEmail())
                                .cpf(cliente.getCpf())
                                .observacoes(cliente.getObservacoes())
                                // Campos de autenticação
                                .senhaHash(cliente.getSenhaHash())
                                .googleId(cliente.getGoogleId())
                                .fotoUrl(cliente.getFotoUrl())
                                .emailVerificado(cliente.isEmailVerificado())
                                .ultimoLogin(cliente.getUltimoLogin())
                                // Campos de endereço
                                .logradouro(cliente.getLogradouro())
                                .numero(cliente.getNumero())
                                .complemento(cliente.getComplemento())
                                .bairro(cliente.getBairro())
                                .cidade(cliente.getCidade())
                                .estado(cliente.getEstado())
                                .cep(cliente.getCep())
                                .pontoReferencia(cliente.getPontoReferencia())
                                // Timestamps
                                .createdAt(cliente.getCreatedAt())
                                .updatedAt(cliente.getUpdatedAt())
                                .build();
        }

        public Cliente paraDomain(ClienteEntity entity) {
                // Se tem Google ID mas não tem telefone, criar via Google
                if (entity.getGoogleId() != null && entity.getTelefone() == null) {
                        Cliente cliente = Cliente.criarViaGoogle(
                                        entity.getNome(),
                                        entity.getEmail(),
                                        entity.getGoogleId(),
                                        entity.getFotoUrl());

                        cliente.restaurarDoBanco(
                                        entity.getId(),
                                        entity.getCreatedAt(),
                                        entity.getUpdatedAt());

                        cliente.restaurarAutenticacaoDoBanco(
                                        entity.getSenhaHash(),
                                        entity.getGoogleId(),
                                        entity.getFotoUrl(),
                                        entity.getEmailVerificado() != null && entity.getEmailVerificado(),
                                        entity.getUltimoLogin());

                        cliente.restaurarEnderecoDoBanco(
                                        entity.getLogradouro(),
                                        entity.getNumero(),
                                        entity.getComplemento(),
                                        entity.getBairro(),
                                        entity.getCidade(),
                                        entity.getEstado(),
                                        entity.getCep(),
                                        entity.getPontoReferencia());

                        return cliente;
                }

                // Criação normal com telefone
                Cliente cliente = Cliente.criar(
                                entity.getNome(),
                                entity.getTelefone(),
                                entity.getEmail(),
                                entity.getCpf(),
                                entity.getObservacoes());

                cliente.restaurarDoBanco(
                                entity.getId(),
                                entity.getCreatedAt(),
                                entity.getUpdatedAt());

                cliente.restaurarAutenticacaoDoBanco(
                                entity.getSenhaHash(),
                                entity.getGoogleId(),
                                entity.getFotoUrl(),
                                entity.getEmailVerificado() != null && entity.getEmailVerificado(),
                                entity.getUltimoLogin());

                cliente.restaurarEnderecoDoBanco(
                                entity.getLogradouro(),
                                entity.getNumero(),
                                entity.getComplemento(),
                                entity.getBairro(),
                                entity.getCidade(),
                                entity.getEstado(),
                                entity.getCep(),
                                entity.getPontoReferencia());

                return cliente;
        }
}