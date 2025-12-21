package com.snackbar.pedidos.infrastructure.persistence;

import com.snackbar.pedidos.domain.entities.StatusSessao;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "sessoes_trabalho")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessaoTrabalhoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer numeroSessao;

    @Column(nullable = false)
    private LocalDate dataInicio;

    @Column(nullable = false)
    private LocalDateTime dataInicioCompleta;

    @Column
    private LocalDateTime dataFim;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusSessao status;

    @Column(nullable = false, length = 36)
    private String usuarioId;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorAbertura;

    @Column(precision = 10, scale = 2)
    private BigDecimal valorFechamento;

    @Version
    @Builder.Default
    private Long version = 0L;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
