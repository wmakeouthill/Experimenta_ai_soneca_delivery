package com.sonecadelivery.orquestrador.exception;

import com.sonecadelivery.kernel.domain.exceptions.BusinessRuleException;
import com.sonecadelivery.kernel.domain.exceptions.DomainException;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.TypeMismatchException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(ValidationException ex) {
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.BAD_REQUEST.value(),
            "Erro de Validação",
            ex.getMessage()
        );
        return ResponseEntity.badRequest().body(body);
    }
    
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessRuleException(BusinessRuleException ex) {
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.UNPROCESSABLE_ENTITY.value(),
            "Erro de Regra de Negócio",
            ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }
    
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<Map<String, Object>> handleDomainException(DomainException ex) {
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.BAD_REQUEST.value(),
            "Erro de Domínio",
            ex.getMessage()
        );
        return ResponseEntity.badRequest().body(body);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.BAD_REQUEST.value(),
            "Erro de Validação",
            "Dados inválidos fornecidos"
        );
        body.put("errors", errors);
        
        return ResponseEntity.badRequest().body(body);
    }
    
    @ExceptionHandler(TypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatchException(TypeMismatchException ex) {
        Class<?> requiredType = ex.getRequiredType();
        String tipoEsperado = "tipo desconhecido";
        if (requiredType != null) {
            String simpleName = requiredType.getSimpleName();
            tipoEsperado = simpleName != null ? simpleName : requiredType.getName();
        }
        
        Object value = ex.getValue();
        String valorRecebido = "null";
        if (value != null) {
            valorRecebido = value.toString();
        }
        
        String mensagem = String.format(
            "Valor inválido para o parâmetro '%s'. Esperado: %s, recebido: %s",
            ex.getPropertyName(),
            tipoEsperado,
            valorRecebido
        );
        
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.BAD_REQUEST.value(),
            "Erro de Conversão de Tipo",
            mensagem
        );
        
        logger.warn("Erro de conversão de tipo: {}", mensagem);
        
        return ResponseEntity.badRequest().body(body);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // Log completo do erro para debug
        logger.error("Erro inesperado: ", ex);
        
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Erro Interno do Servidor",
            ex.getMessage() != null ? ex.getMessage() : "Ocorreu um erro inesperado. Tente novamente mais tarde."
        );
        
        // Em desenvolvimento, incluir detalhes do erro
        body.put("exception", ex.getClass().getName());
        if (ex.getCause() != null) {
            body.put("cause", ex.getCause().getMessage());
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
    
    private Map<String, Object> criarRespostaErro(int status, String error, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status);
        body.put("error", error);
        body.put("message", message);
        return body;
    }
}

