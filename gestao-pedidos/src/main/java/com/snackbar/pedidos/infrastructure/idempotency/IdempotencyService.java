package com.snackbar.pedidos.infrastructure.idempotency;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.function.Supplier;

/**
 * Serviço de idempotência para garantir que operações duplicadas
 * retornem a mesma resposta sem executar a operação novamente.
 * 
 * Uso típico:
 * 
 * <pre>
 * return idempotencyService.executeIdempotent(
 *         idempotencyKey,
 *         "/api/pedidos",
 *         () -> criarPedidoUseCase.executar(request));
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    /**
     * Tempo de expiração padrão das chaves de idempotência (24 horas).
     */
    private static final long EXPIRATION_HOURS = 24;

    /**
     * Executa uma operação de forma idempotente.
     * 
     * Se a chave já existe e não expirou, retorna a resposta anterior.
     * Caso contrário, executa a operação e salva a resposta.
     * 
     * @param idempotencyKey Chave única da requisição
     * @param endpoint       Endpoint da API (para evitar colisão entre endpoints)
     * @param operation      Operação a ser executada
     * @param responseType   Tipo da resposta para deserialização
     * @return ResponseEntity com a resposta (nova ou cached)
     */
    @Transactional
    public <T> ResponseEntity<T> executeIdempotent(
            String idempotencyKey,
            String endpoint,
            Supplier<T> operation,
            Class<T> responseType) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            // Sem chave de idempotência, executa normalmente
            T result = operation.get();
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        }

        // Verifica se já existe uma resposta para esta chave
        Optional<IdempotencyKeyEntity> existingKey = idempotencyKeyRepository
                .findByKeyAndEndpoint(idempotencyKey, endpoint, LocalDateTime.now());

        if (existingKey.isPresent()) {
            IdempotencyKeyEntity cached = existingKey.get();
            log.info("[IDEMPOTENCY] Requisição duplicada detectada - Key: {}, Endpoint: {}",
                    idempotencyKey, endpoint);

            try {
                T cachedResponse = objectMapper.readValue(cached.getResponseBody(), responseType);
                return ResponseEntity
                        .status(cached.getResponseStatus())
                        .body(cachedResponse);
            } catch (JsonProcessingException e) {
                log.error("[IDEMPOTENCY] Erro ao deserializar resposta cached", e);
                // Em caso de erro, executa a operação novamente
            }
        }

        // Executa a operação
        T result = operation.get();
        HttpStatus status = HttpStatus.CREATED;

        // Salva a resposta para futuras requisições
        saveIdempotencyKey(idempotencyKey, endpoint, result, status.value());

        log.debug("[IDEMPOTENCY] Nova chave registrada - Key: {}, Endpoint: {}",
                idempotencyKey, endpoint);

        return ResponseEntity.status(status).body(result);
    }

    /**
     * Limpa chaves expiradas do banco de dados.
     */
    @Transactional
    public void cleanupExpiredKeys() {
        idempotencyKeyRepository.deleteExpiredKeys(LocalDateTime.now());
    }

    @Transactional
    public void saveIdempotencyKey(String key, String endpoint, Object response, int status) {
        try {
            String responseBody = objectMapper.writeValueAsString(response);

            IdempotencyKeyEntity entity = IdempotencyKeyEntity.builder()
                    .idempotencyKey(key)
                    .endpoint(endpoint)
                    .responseBody(responseBody)
                    .responseStatus(status)
                    .expiresAt(LocalDateTime.now().plusHours(EXPIRATION_HOURS))
                    .build();

            idempotencyKeyRepository.save(entity);
        } catch (JsonProcessingException e) {
            log.error("[IDEMPOTENCY] Erro ao serializar resposta para idempotência", e);
        }
    }

    /**
     * Verifica se uma chave de idempotência já existe.
     */
    public Optional<IdempotencyKeyEntity> findExistingKey(String key, String endpoint) {
        return idempotencyKeyRepository.findByKeyAndEndpoint(key, endpoint, LocalDateTime.now());
    }
}
