package com.snackbar.pedidos.domain.entities;

import com.snackbar.kernel.domain.entities.BaseEntity;
import com.snackbar.kernel.domain.exceptions.ValidationException;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
public class SessaoTrabalho extends BaseEntity {
    private Integer numeroSessao;
    private LocalDate dataInicio;
    private LocalDateTime dataInicioCompleta;
    private LocalDateTime dataFim;
    private StatusSessao status;
    private String usuarioId;
    private BigDecimal valorAbertura;
    private BigDecimal valorFechamento;
    private Long version; // Para Optimistic Locking - preservado entre conversões domain/entity

    private SessaoTrabalho() {
        super();
        this.status = StatusSessao.ABERTA;
        this.dataInicioCompleta = LocalDateTime.now();
        this.dataInicio = LocalDate.now();
    }

    public static SessaoTrabalho criar(Integer numeroSessao, String usuarioId, BigDecimal valorAbertura) {
        validarDados(numeroSessao, usuarioId);
        validarValorAbertura(valorAbertura);

        SessaoTrabalho sessao = new SessaoTrabalho();
        sessao.numeroSessao = numeroSessao;
        sessao.usuarioId = usuarioId;
        sessao.valorAbertura = valorAbertura;
        sessao.touch();
        return sessao;
    }

    /**
     * Método usado APENAS para restaurar sessões do banco de dados.
     * Não valida obrigatoriedade do valorAbertura para compatibilidade
     * com sessões antigas que não tinham esse campo.
     */
    public static SessaoTrabalho restaurarDoBancoFactory(Integer numeroSessao, String usuarioId) {
        validarDados(numeroSessao, usuarioId);

        SessaoTrabalho sessao = new SessaoTrabalho();
        sessao.numeroSessao = numeroSessao;
        sessao.usuarioId = usuarioId;
        return sessao;
    }

    public void pausar() {
        if (!status.podeSerPausada()) {
            throw new ValidationException("Não é possível pausar uma sessão com status " + status.getDescricao());
        }
        this.status = StatusSessao.PAUSADA;
        touch();
    }

    public void retomar() {
        if (!status.podeSerRetomada()) {
            throw new ValidationException("Não é possível retomar uma sessão com status " + status.getDescricao());
        }
        this.status = StatusSessao.ABERTA;
        touch();
    }

    public void finalizar(BigDecimal valorFechamento) {
        if (!status.podeSerFinalizada()) {
            throw new ValidationException("Não é possível finalizar uma sessão com status " + status.getDescricao());
        }
        validarValorFechamento(valorFechamento);

        this.status = StatusSessao.FINALIZADA;
        this.dataFim = LocalDateTime.now();
        this.valorFechamento = valorFechamento;
        touch();
    }

    public boolean estaAtiva() {
        return status.estaAtiva();
    }

    public String obterNome() {
        return numeroSessao + " - " + dataInicio.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    public void restaurarDoBanco(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    public void restaurarStatusDoBanco(StatusSessao status, LocalDateTime dataFim) {
        this.status = status;
        this.dataFim = dataFim;
    }

    /**
     * Restaura os valores de caixa do banco de dados.
     */
    public void restaurarValoresCaixaDoBanco(BigDecimal valorAbertura, BigDecimal valorFechamento) {
        this.valorAbertura = valorAbertura;
        this.valorFechamento = valorFechamento;
    }

    /**
     * Restaura a versão do Optimistic Locking do banco de dados (usado pelos
     * mappers).
     * Essencial para preservar a versão entre conversões domain/entity.
     */
    public void restaurarVersionDoBanco(Long version) {
        this.version = version;
    }

    /**
     * Restaura as datas de início do banco de dados (usado pelos mappers).
     * IMPORTANTE: Essas datas devem ser imutáveis após a criação da sessão.
     * 
     * @param dataInicio         Data de início da sessão (apenas data, sem hora)
     * @param dataInicioCompleta Data e hora completa de início da sessão
     */
    public void restaurarDatasInicioDoBanco(LocalDate dataInicio, LocalDateTime dataInicioCompleta) {
        if (dataInicio == null) {
            throw new ValidationException("Data de início não pode ser nula");
        }
        if (dataInicioCompleta == null) {
            throw new ValidationException("Data de início completa não pode ser nula");
        }
        this.dataInicio = dataInicio;
        this.dataInicioCompleta = dataInicioCompleta;
    }

    private static void validarDados(Integer numeroSessao, String usuarioId) {
        if (numeroSessao == null || numeroSessao <= 0) {
            throw new ValidationException("Número da sessão deve ser maior que zero");
        }
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            throw new ValidationException("ID do usuário não pode ser nulo ou vazio");
        }
    }

    private static void validarValorAbertura(BigDecimal valor) {
        if (valor == null) {
            throw new ValidationException("Valor de abertura do caixa é obrigatório");
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Valor de abertura do caixa não pode ser negativo");
        }
    }

    private static void validarValorFechamento(BigDecimal valor) {
        if (valor == null) {
            throw new ValidationException("Valor de fechamento do caixa é obrigatório");
        }
        if (valor.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Valor de fechamento do caixa não pode ser negativo");
        }
    }
}
