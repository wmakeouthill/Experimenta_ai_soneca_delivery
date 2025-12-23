package com.sonecadelivery.orquestrador;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.sonecadelivery")
@EnableJpaRepositories(basePackages = "com.sonecadelivery")
@EntityScan(basePackages = "com.sonecadelivery")
@EnableScheduling
public class SnackBarApplication {

    public static void main(String[] args) {
        SpringApplication.run(SnackBarApplication.class, args);
    }
}
