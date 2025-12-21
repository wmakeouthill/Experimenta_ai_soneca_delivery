package com.sonecadelivery.pedidos.infrastructure.persistence;

import com.sonecadelivery.pedidos.domain.entities.UnidadeMedida;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "itens_estoque")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItemEstoqueEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(nullable = false, length = 150, unique = true)
    private String nome;
    
    @Column(length = 500)
    private String descricao;
    
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidade;
    
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantidadeMinima;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UnidadeMedida unidadeMedida;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal precoUnitario;
    
    @Column(length = 200)
    private String fornecedor;
    
    @Column(length = 50)
    private String codigoBarras;
    
    @Column(nullable = false)
    private boolean ativo;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}

