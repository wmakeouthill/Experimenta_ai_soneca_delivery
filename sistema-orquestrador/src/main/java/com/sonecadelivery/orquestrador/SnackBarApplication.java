package com.sonecadelivery.orquestrador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.sonecadelivery")
@EnableJpaRepositories(basePackages = "com.sonecadelivery")
@EntityScan(basePackages = "com.sonecadelivery")
public class SnackBarApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SnackBarApplication.class, args);
    }
}

