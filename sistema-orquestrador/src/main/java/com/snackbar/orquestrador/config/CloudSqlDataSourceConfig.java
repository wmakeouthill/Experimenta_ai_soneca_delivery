package com.snackbar.orquestrador.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;

/**
 * Configuração do DataSource para Cloud SQL usando Socket Factory.
 * 
 * Esta configuração garante que o Cloud SQL Socket Factory seja usado
 * corretamente para conectar ao Cloud SQL via Cloud Run.
 * 
 * IMPORTANTE: Esta configuração sobrescreve a configuração automática
 * do Spring Boot para garantir que o Cloud SQL Socket Factory seja usado.
 */
@Configuration
@Profile("prod")
public class CloudSqlDataSourceConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        // Log da URL recebida (sem senha para segurança)
        String maskedUrl = maskPassword(jdbcUrl);
        System.out.println("=== Cloud SQL DataSource Configuration ===");
        System.out.println("URL JDBC recebida: " + maskedUrl);
        
        // Verificar se o Cloud SQL Socket Factory está disponível
        try {
            Class.forName("com.google.cloud.sql.mysql.SocketFactory");
            System.out.println("✅ Cloud SQL Socket Factory encontrado no classpath");
        } catch (ClassNotFoundException e) {
            throw new RuntimeException(
                "Cloud SQL Socket Factory não encontrado no classpath. " +
                "Verifique se a dependência mysql-socket-factory-connector-j-8 " +
                "está incluída no pom.xml e no JAR final.", e);
        }
        
        HikariConfig config = new HikariConfig();
        
        // Configurar URL JDBC - garantir que está no formato correto
        String finalUrl = jdbcUrl.trim(); // Remover espaços extras
        
        // Se a URL não começar com jdbc:mysql://, erro
        if (!finalUrl.startsWith("jdbc:mysql://")) {
            throw new IllegalArgumentException(
                "DB_URL deve começar com 'jdbc:mysql://'. Valor recebido: " + maskedUrl);
        }
        
        // Garantir que socketFactory está na URL
        if (!finalUrl.contains("socketFactory=")) {
            String separator = finalUrl.contains("?") ? "&" : "?";
            finalUrl = finalUrl + separator + "socketFactory=com.google.cloud.sql.mysql.SocketFactory";
            System.out.println("⚠️ socketFactory adicionado automaticamente à URL");
        }
        
        // Garantir que cloudSqlInstance está na URL ou extrair e adicionar como propriedade
        // Formato esperado: cloudSqlInstance=project:region:instance
        String cloudSqlInstance = extractCloudSqlInstance(finalUrl);
        if (cloudSqlInstance == null || cloudSqlInstance.isEmpty()) {
            System.err.println("❌ cloudSqlInstance NÃO encontrado na URL!");
            System.err.println("URL atual: " + maskPassword(finalUrl));
            throw new IllegalArgumentException(
                "cloudSqlInstance não encontrado na URL JDBC. " +
                "A URL deve conter 'cloudSqlInstance=project:region:instance'. " +
                "Exemplo: jdbc:mysql:///snackbar_db?cloudSqlInstance=experimenta-ai-soneca-balcao:southamerica-east1:experimenta-ai-balcao&socketFactory=com.google.cloud.sql.mysql.SocketFactory&useSSL=false&serverTimezone=America/Sao_Paulo" +
                "\n\nURL recebida (mascarada): " + maskedUrl);
        }
        
        System.out.println("✅ cloudSqlInstance encontrado: " + cloudSqlInstance);
        
        config.setJdbcUrl(finalUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Configurações do HikariCP
        config.setMaximumPoolSize(10);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        // Adicionar cloudSqlInstance como propriedade também (para garantir)
        config.addDataSourceProperty("cloudSqlInstance", cloudSqlInstance);
        config.addDataSourceProperty("socketFactory", "com.google.cloud.sql.mysql.SocketFactory");
        
        return new HikariDataSource(config);
    }
    
    /**
     * Extrai o valor de cloudSqlInstance da URL JDBC.
     */
    private String extractCloudSqlInstance(String jdbcUrl) {
        // Procurar por cloudSqlInstance=valor na URL (case insensitive)
        String lowerUrl = jdbcUrl.toLowerCase();
        int startIndex = lowerUrl.indexOf("cloudsqlinstance=");
        if (startIndex == -1) {
            return null;
        }
        
        // Usar o índice da URL original para preservar case
        int originalIndex = jdbcUrl.indexOf("cloudSqlInstance=");
        if (originalIndex == -1) {
            originalIndex = jdbcUrl.indexOf("CloudSqlInstance=");
        }
        if (originalIndex == -1) {
            originalIndex = jdbcUrl.toLowerCase().indexOf("cloudsqlinstance=");
        }
        
        if (originalIndex == -1) {
            return null;
        }
        
        // Encontrar o início do valor
        int valueStart = originalIndex;
        while (valueStart < jdbcUrl.length() && jdbcUrl.charAt(valueStart) != '=') {
            valueStart++;
        }
        valueStart++; // Pular o '='
        
        // Encontrar o fim do valor (próximo '&' ou fim da string)
        int valueEnd = jdbcUrl.indexOf("&", valueStart);
        if (valueEnd == -1) {
            valueEnd = jdbcUrl.length();
        }
        
        return jdbcUrl.substring(valueStart, valueEnd).trim();
    }
    
    /**
     * Mascara a senha na URL JDBC para logs de segurança.
     */
    private String maskPassword(String url) {
        if (url == null) {
            return null;
        }
        // Substituir password=xxx por password=***
        return url.replaceAll("(?i)password=[^&;]*", "password=***");
    }
}

