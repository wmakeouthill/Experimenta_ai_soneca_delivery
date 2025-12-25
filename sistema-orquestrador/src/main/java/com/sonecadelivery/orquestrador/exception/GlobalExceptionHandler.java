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
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
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
    
    /**
     * Trata exceções de I/O relacionadas a conexões fechadas (broken pipe, connection reset, etc.).
     * Essas exceções são esperadas quando clientes desconectam durante SSE ou streaming.
     * Não devem ser logadas como erro, pois são comportamento normal.
     * 
     * Nota: SocketException é uma subclasse de IOException, então será capturada automaticamente.
     */
    @ExceptionHandler(IOException.class)
    public ResponseEntity<Void> handleIOException(IOException ex) {
        String errorMsg = ex.getMessage();
        
        // Verifica se é um erro esperado de conexão fechada
        if (errorMsg != null && (errorMsg.contains("Broken pipe") || 
                                 errorMsg.contains("Connection reset") ||
                                 errorMsg.contains("closed") ||
                                 errorMsg.contains("Socket closed") ||
                                 errorMsg.contains("Connection aborted"))) {
            // Comportamento esperado - não loga como erro
            // Apenas retorna 200 OK vazio (cliente já desconectou)
            return ResponseEntity.ok().build();
        }
        
        // Outros erros de I/O inesperados - loga como warning
        logger.warn("Erro de I/O: {}", errorMsg);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
    
    /**
     * Trata exceções quando recursos estáticos não são encontrados (ex: index.html).
     * Isso pode acontecer em dev se o frontend ainda não foi buildado.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        String resourcePath = ex.getResourcePath();
        
        // Se for index.html ou raiz, retornar mensagem amigável
        if (resourcePath == null || resourcePath.equals("/") || resourcePath.equals("/index.html")) {
            Map<String, Object> body = criarRespostaErro(
                HttpStatus.NOT_FOUND.value(),
                "Frontend não encontrado",
                "O frontend ainda não foi buildado. " +
                "Em desenvolvimento, execute 'npm run watch' no container frontend para gerar os arquivos. " +
                "Ou acesse o frontend diretamente em http://localhost:4200"
            );
            body.put("resourcePath", resourcePath);
            body.put("hint", "Execute 'npm run watch' no container frontend-dev para habilitar hot reload");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
        }
        
        // Para outros recursos, retornar erro padrão
        Map<String, Object> body = criarRespostaErro(
            HttpStatus.NOT_FOUND.value(),
            "Recurso não encontrado",
            "O recurso solicitado não foi encontrado: " + resourcePath
        );
        body.put("resourcePath", resourcePath);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        // IOException já é tratada pelo handler específico acima
        // O Spring chama handlers mais específicos primeiro
        
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

