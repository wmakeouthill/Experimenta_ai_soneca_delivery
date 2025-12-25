package com.sonecadelivery.orquestrador.config;

import liquibase.integration.spring.SpringLiquibase;
import org.springframework.boot.autoconfigure.liquibase.LiquibaseProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

@Configuration
public class LiquibaseConfig {
    
    /**
     * Configuração do Liquibase para executar migrações de banco de dados.
     * 
     * IMPORTANTE: Este bean é marcado com @DependsOn("dataSource") para garantir
     * que o DataSource seja criado primeiro, mas o Spring Boot automaticamente
     * executa o Liquibase ANTES do Hibernate inicializar o EntityManagerFactory.
     * 
     * Em produção, o Hibernate está configurado com ddl-auto: none para evitar
     * validação antes do Liquibase executar.
     */
    @Bean
    @DependsOn("dataSource")
    public SpringLiquibase liquibase(DataSource dataSource) {
        System.out.println("=== Inicializando Liquibase ===");
        System.out.println("ChangeLog: classpath:db/changelog/db.changelog-master.xml");
        
        SpringLiquibase liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-master.xml");
        liquibase.setShouldRun(true);
        liquibase.setDropFirst(false); // NUNCA dropar o banco em produção
        
        // Logs para debug
        System.out.println("✅ Liquibase configurado e será executado na inicialização");
        System.out.println("   O Liquibase executará ANTES do Hibernate validar o schema");
        
        return liquibase;
    }
}

