package com.snackbar.kernel.application.dto;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Data
@SuperBuilder
public abstract class BaseDTO {
    private String id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    protected BaseDTO() {
    }
    
    protected BaseDTO(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}

