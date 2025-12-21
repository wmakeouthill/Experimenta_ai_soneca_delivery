package com.sonecadelivery.pedidos.infrastructure.mappers;

import com.sonecadelivery.pedidos.domain.entities.SessaoTrabalho;
import com.sonecadelivery.pedidos.infrastructure.persistence.SessaoTrabalhoEntity;
import org.springframework.stereotype.Component;

@Component
public class SessaoTrabalhoMapper {

        public SessaoTrabalhoEntity paraEntity(SessaoTrabalho sessao) {
                SessaoTrabalhoEntity.SessaoTrabalhoEntityBuilder builder = SessaoTrabalhoEntity.builder()
                                .id(sessao.getId())
                                .numeroSessao(sessao.getNumeroSessao())
                                .dataInicio(sessao.getDataInicio())
                                .dataInicioCompleta(sessao.getDataInicioCompleta())
                                .dataFim(sessao.getDataFim())
                                .status(sessao.getStatus())
                                .usuarioId(sessao.getUsuarioId())
                                .valorAbertura(sessao.getValorAbertura())
                                .valorFechamento(sessao.getValorFechamento())
                                .createdAt(sessao.getCreatedAt())
                                .updatedAt(sessao.getUpdatedAt());

                // Só seta version se não for null (para novas entidades, deixa o
                // @Builder.Default usar 0L)
                if (sessao.getVersion() != null) {
                        builder.version(sessao.getVersion());
                }

                return builder.build();
        }

        public SessaoTrabalho paraDomain(SessaoTrabalhoEntity entity) {
                // Usa factory de restauração para compatibilidade com sessões antigas
                SessaoTrabalho sessao = SessaoTrabalho.restaurarDoBancoFactory(
                                entity.getNumeroSessao(),
                                entity.getUsuarioId());

                sessao.restaurarDoBanco(
                                entity.getId(),
                                entity.getCreatedAt(),
                                entity.getUpdatedAt());

                // IMPORTANTE: Restaurar as datas de início do banco (imutáveis após criação)
                sessao.restaurarDatasInicioDoBanco(
                                entity.getDataInicio(),
                                entity.getDataInicioCompleta());

                sessao.restaurarStatusDoBanco(entity.getStatus(), entity.getDataFim());

                // Restaurar valores de caixa (pode ser null em sessões antigas)
                sessao.restaurarValoresCaixaDoBanco(
                                entity.getValorAbertura(),
                                entity.getValorFechamento());

                // Restaurar version para Optimistic Locking (essencial para atualizações)
                sessao.restaurarVersionDoBanco(entity.getVersion());

                return sessao;
        }
}
