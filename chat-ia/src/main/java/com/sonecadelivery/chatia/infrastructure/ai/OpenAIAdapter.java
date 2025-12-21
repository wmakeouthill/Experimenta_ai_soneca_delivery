package com.sonecadelivery.chatia.infrastructure.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonecadelivery.chatia.application.port.out.IAClientPort;
import com.sonecadelivery.chatia.domain.entity.MensagemChat;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Adapter para integração com a API da OpenAI.
 * Suporta fallback automático entre modelos.
 * 
 * Segue as regras de Clean Architecture:
 * - ObjectMapper e HttpClient injetados via DI (não criados manualmente)
 * - Configurações via @Value
 */
@Slf4j
@Component
public class OpenAIAdapter implements IAClientPort {
    
    private static final String API_URL = "https://api.openai.com/v1/chat/completions";
    private static final String MODELO_PADRAO = "gpt-5-mini";
    private static final int MAX_TOKENS_PADRAO = 4000;
    private static final int TIMEOUT_SEGUNDOS = 60;
    private static final String KEY_CONTENT = "content";
    private static final String KEY_ERROR = "error";
    private static final String KEY_MESSAGE = "message";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    @Value("${openai.model:" + MODELO_PADRAO + "}")
    private String modeloPrincipal;
    
    @Value("${openai.models.fallback:gpt-4o-mini,gpt-3.5-turbo}")
    private String modelosFallbackStr;
    
    @Value("${openai.max-tokens:" + MAX_TOKENS_PADRAO + "}")
    private int maxTokens;
    
    private String apiKey;
    private List<String> modelosFallback;

    /**
     * Construtor com injeção de dependências.
     * ObjectMapper e HttpClient são beans gerenciados pelo Spring.
     */
    public OpenAIAdapter(
            @Qualifier("chatIAHttpClient") HttpClient httpClient,
            @Qualifier("chatIAObjectMapper") ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
    }
    
    @PostConstruct
    void inicializar() {
        // Constrói lista de modelos: modelo principal + fallbacks
        this.modelosFallback = new ArrayList<>();
        this.modelosFallback.add(modeloPrincipal);
        
        if (modelosFallbackStr != null && !modelosFallbackStr.isBlank()) {
            Arrays.stream(modelosFallbackStr.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .forEach(this.modelosFallback::add);
        }
        
        // Obtém API key de propriedade ou variável de ambiente
        if (openaiApiKey != null && !openaiApiKey.isBlank()) {
            this.apiKey = openaiApiKey;
            log.info("OpenAI key carregada via Spring property 'openai.api.key'");
        } else {
            String envKey = System.getenv("OPENAI_API_KEY");
            if (envKey != null && !envKey.isBlank()) {
                this.apiKey = envKey;
                log.info("OpenAI key carregada via environment variable 'OPENAI_API_KEY'");
            } else {
                this.apiKey = null;
                log.warn("OpenAI key NÃO encontrada! Configure:");
                log.warn("  1. Variável de ambiente OPENAI_API_KEY");
                log.warn("  2. Propriedade openai.api.key no application.properties");
            }
        }
        
        log.info("OpenAI Adapter configurado - modelos: {}, max_tokens: {}", 
                this.modelosFallback, this.maxTokens);
    }

    @Override
    public String chat(String systemPrompt, List<MensagemChat> historico, String mensagemAtual) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Serviço de IA não configurado. Por favor, configure a chave da API.";
        }

        List<Map<String, Object>> mensagens = construirMensagens(systemPrompt, historico, mensagemAtual);
        
        // Tenta cada modelo em sequência até um funcionar
        Exception ultimoErro = null;
        for (int i = 0; i < modelosFallback.size(); i++) {
            String modeloAtual = modelosFallback.get(i);
            
            try {
                log.info("Tentando modelo {} ({}/{})", modeloAtual, i + 1, modelosFallback.size());
                
                Map<String, Object> payload = criarPayload(mensagens, modeloAtual);
                String body = objectMapper.writeValueAsString(payload);
                HttpRequest req = criarRequisicao(body);
                HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

                if (isErroRecuperavel(resp)) {
                    String erroMsg = extrairMensagemErro(resp.body());
                    log.warn("Modelo {} retornou erro (status {}): {}. Tentando próximo...", 
                            modeloAtual, resp.statusCode(), erroMsg);
                    ultimoErro = new IOException("Erro: " + erroMsg);
                    continue;
                }
                
                String resposta = processarResposta(resp);
                log.info("Resposta obtida com modelo {}", modeloAtual);
                return resposta;
                
            } catch (IOException | InterruptedException e) {
                if (e instanceof InterruptedException) {
                    Thread.currentThread().interrupt();
                }
                ultimoErro = e;
                log.warn("Erro com modelo {}: {}. Tentando próximo...", modeloAtual, e.getMessage());
            }
        }
        
        // Se chegou aqui, todos os modelos falharam
        return ultimoErro != null 
                ? "Erro ao comunicar com IA: " + ultimoErro.getMessage()
                : "Todos os modelos configurados falharam";
    }

    private List<Map<String, Object>> construirMensagens(String systemPrompt, List<MensagemChat> historico,
            String mensagemAtual) {
        List<Map<String, Object>> mensagens = new ArrayList<>();
        mensagens.add(Map.of("role", "system", KEY_CONTENT, systemPrompt));
        
        // Log do system prompt para debug (apenas primeiros 500 chars)
        log.debug("System prompt enviado ({} chars): {}...", 
                systemPrompt.length(), 
                systemPrompt.substring(0, Math.min(500, systemPrompt.length())));

        for (MensagemChat msg : historico) {
            mensagens.add(Map.of("role", msg.role(), KEY_CONTENT, msg.content()));
        }

        mensagens.add(Map.of("role", "user", KEY_CONTENT, mensagemAtual));
        log.debug("Total de mensagens construídas: {} (1 system + {} histórico + 1 user)", 
                mensagens.size(), historico.size());
        return mensagens;
    }

    private Map<String, Object> criarPayload(List<Map<String, Object>> mensagens, String modelo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", modelo);
        payload.put("messages", mensagens);
        payload.put("max_tokens", maxTokens);
        // Temperatura baixa (0.3) = respostas mais determinísticas e fiéis ao contexto
        // Evita que a IA "invente" informações fora do cardápio fornecido
        payload.put("temperature", 0.3);
        return payload;
    }

    private HttpRequest criarRequisicao(String body) {
        return HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(TIMEOUT_SEGUNDOS))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
    }

    private boolean isErroRecuperavel(HttpResponse<String> resp) {
        int status = resp.statusCode();
        return status == 429 || status == 503 || status == 500;
    }

    private String extrairMensagemErro(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.has(KEY_ERROR) && root.get(KEY_ERROR).has(KEY_MESSAGE)) {
                return root.get(KEY_ERROR).get(KEY_MESSAGE).asText();
            }
        } catch (Exception e) {
            log.debug("Não foi possível extrair mensagem de erro do body", e);
        }
        return "Erro desconhecido";
    }

    private String processarResposta(HttpResponse<String> resp) throws IOException {
        if (resp.statusCode() != 200) {
            String erro = extrairMensagemErro(resp.body());
            throw new IOException("API retornou status " + resp.statusCode() + ": " + erro);
        }
        
        JsonNode root = objectMapper.readTree(resp.body());
        JsonNode choices = root.get("choices");
        
        if (choices == null || choices.isEmpty()) {
            throw new IOException("Resposta sem choices");
        }
        
        JsonNode message = choices.get(0).get("message");
        if (message == null || !message.has(KEY_CONTENT)) {
            throw new IOException("Resposta sem conteúdo");
        }
        
        return message.get(KEY_CONTENT).asText();
    }
}
