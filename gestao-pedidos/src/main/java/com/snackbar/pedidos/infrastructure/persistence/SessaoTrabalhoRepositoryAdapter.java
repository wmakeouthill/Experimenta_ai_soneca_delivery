package com.snackbar.pedidos.infrastructure.persistence;

import com.snackbar.pedidos.application.ports.SessaoTrabalhoRepositoryPort;
import com.snackbar.pedidos.domain.entities.SessaoTrabalho;
import com.snackbar.pedidos.domain.entities.StatusSessao;
import com.snackbar.pedidos.infrastructure.mappers.SessaoTrabalhoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class SessaoTrabalhoRepositoryAdapter implements SessaoTrabalhoRepositoryPort {

    private final SessaoTrabalhoJpaRepository jpaRepository;
    private final SessaoTrabalhoMapper mapper;

    @Override
    @SuppressWarnings("null") // jpaRepository.save() nunca retorna null
    public SessaoTrabalho salvar(@NonNull SessaoTrabalho sessao) {
        SessaoTrabalhoEntity entity = mapper.paraEntity(sessao);
        SessaoTrabalhoEntity salva = jpaRepository.save(entity);
        return mapper.paraDomain(salva);
    }

    @Override
    public Optional<SessaoTrabalho> buscarPorId(@NonNull String id) {
        return jpaRepository.findById(id)
                .map(mapper::paraDomain);
    }

    @Override
    public Optional<SessaoTrabalho> buscarSessaoAtiva() {
        List<StatusSessao> statusesAtivos = List.of(StatusSessao.ABERTA, StatusSessao.PAUSADA);
        return jpaRepository.findFirstByStatusInOrderByDataInicioCompletaDesc(statusesAtivos)
                .map(mapper::paraDomain);
    }

    @Override
    public List<SessaoTrabalho> buscarPorDataInicio(LocalDate dataInicio) {
        return jpaRepository.findByDataInicioOrderByNumeroSessaoDesc(dataInicio).stream()
                .map(mapper::paraDomain)
                .toList();
    }

    @Override
    public Optional<SessaoTrabalho> buscarUltimaSessaoPorData(LocalDate dataInicio) {
        return jpaRepository.findFirstByDataInicioOrderByNumeroSessaoDesc(dataInicio)
                .map(mapper::paraDomain);
    }

    @Override
    public List<SessaoTrabalho> buscarTodas() {
        return jpaRepository.findAllByOrderByDataInicioCompletaDesc().stream()
                .map(mapper::paraDomain)
                .toList();
    }
    
    @Override
    public List<SessaoTrabalho> buscarPorStatus(StatusSessao status) {
        return jpaRepository.findByStatusOrderByDataInicioCompletaDesc(status).stream()
                .map(mapper::paraDomain)
                .toList();
    }
    
    @Override
    public Optional<SessaoTrabalho> buscarSessaoAnterior(LocalDateTime dataInicioCompleta) {
        return jpaRepository.findFirstByDataInicioCompletaBeforeAndStatusOrderByDataInicioCompletaDesc(
                dataInicioCompleta, StatusSessao.FINALIZADA)
                .map(mapper::paraDomain);
    }
}
