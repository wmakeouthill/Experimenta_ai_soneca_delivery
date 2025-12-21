package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.domain.entities.TipoMovimentacaoCaixa;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacoes_caixa")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovimentacaoCaixaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, length = 36)
    private String sessaoId;
    
    @Column(length = 36)
    private String usuarioId;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TipoMovimentacaoCaixa tipo;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;
    
    @Column(length = 255)
    private String descricao;
    
    @Column(nullable = false)
    private LocalDateTime dataMovimentacao;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

