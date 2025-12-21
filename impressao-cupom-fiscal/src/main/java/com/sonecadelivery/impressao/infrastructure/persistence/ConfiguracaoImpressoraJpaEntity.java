package com.sonecadelivery.impressao.infrastructure.persistence;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import com.sonecadelivery.impressao.domain.valueobjects.TamanhoFonteCupom;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "config_impressora")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfiguracaoImpressoraJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TipoImpressora tipoImpressora;

    @Column(length = 255)
    private String devicePath;

    @Column(nullable = false, length = 200)
    private String nomeEstabelecimento;

    @Column(length = 500)
    private String enderecoEstabelecimento;

    @Column(length = 20)
    private String telefoneEstabelecimento;

    @Column(length = 18)
    private String cnpjEstabelecimento;

    @Column(columnDefinition = "LONGTEXT")
    private String logoBase64;

    @Column(name = "largura_papel")
    private Integer larguraPapel;

    @Enumerated(EnumType.STRING)
    @Column(name = "tamanho_fonte", length = 20)
    private TamanhoFonteCupom tamanhoFonte;

    @Lob
    @Column(columnDefinition = "LONGBLOB")
    private byte[] logoEscPos;

    @Column(nullable = false)
    private boolean ativa;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
