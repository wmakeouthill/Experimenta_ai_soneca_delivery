package com.sonecadelivery.impressao.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "estabelecimento")
@Getter
@Setter
public class EstabelecimentoProperties {
    private String nome = "experimenta-ai-do-soneca";
    private String endereco;
    private String telefone;
    private String cnpj;
}

