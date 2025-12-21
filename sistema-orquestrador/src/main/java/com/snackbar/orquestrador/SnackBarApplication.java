package com.snackbar.orquestrador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.snackbar")
@EnableJpaRepositories(basePackages = "com.snackbar")
@EntityScan(basePackages = "com.snackbar")
public class SnackBarApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(SnackBarApplication.class, args);
    }
}

