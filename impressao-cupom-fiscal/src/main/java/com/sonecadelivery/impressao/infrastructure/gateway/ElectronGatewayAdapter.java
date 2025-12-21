package com.sonecadelivery.impressao.infrastructure.gateway;

import com.sonecadelivery.impressao.application.ports.ElectronGatewayException;
import com.sonecadelivery.impressao.application.ports.ElectronGatewayPort;
import com.sonecadelivery.impressao.domain.entities.CupomFiscal;
import com.sonecadelivery.impressao.infrastructure.impressora.FormatoCupomFiscal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.Objects;

/**
 * Adapter para comunicação com o servidor HTTP local do Electron
 * 
 * Este adapter detecta se o Electron está rodando localmente e envia
 * comandos de impressão para ele quando disponível.
 */
@Component
@Slf4j
public class ElectronGatewayAdapter implements ElectronGatewayPort {

    private static final String ELECTRON_HEALTH_ENDPOINT = "/health";
    private static final String ELECTRON_IMPRIMIR_ENDPOINT = "/imprimir/cupom-fiscal";

    private final RestTemplate restTemplate;
    private final String electronBaseUrl;

    public ElectronGatewayAdapter(
            @Value("${impressao.electron.gateway.url:http://localhost:3001}") String electronBaseUrl) {
        this.electronBaseUrl = electronBaseUrl;
        this.restTemplate = criarRestTemplate();
    }

    @Override
    public boolean estaDisponivel() {
        try {
            // Verifica se a URL é localhost (Electron só funciona localmente)
            // Backend online não pode acessar localhost:3001 do cliente
            if (!electronBaseUrl.contains("localhost") && !electronBaseUrl.contains("127.0.0.1")) {
                log.debug("Electron Gateway não disponível: URL não é local ({})", electronBaseUrl);
                return false;
            }

            String url = electronBaseUrl + ELECTRON_HEALTH_ENDPOINT;

            // Timeout curto para não travar se Electron não estiver rodando
            ResponseEntity<ElectronHealthResponse> response = restTemplate.getForEntity(
                    url, ElectronHealthResponse.class);

            ElectronHealthResponse body = response.getBody();
            boolean disponivel = response.getStatusCode().is2xxSuccessful()
                    && body != null
                    && "online".equalsIgnoreCase(body.getStatus());

            if (disponivel) {
                log.debug("Electron Gateway está disponível em {}", electronBaseUrl);
            } else {
                log.debug("Electron Gateway não respondeu corretamente: {}", body);
            }

            return disponivel;
        } catch (RestClientException e) {
            // Log apenas em debug para não poluir logs quando Electron não está rodando
            log.debug("Electron Gateway não está disponível (esperado se não estiver rodando): {}",
                    e.getMessage().length() > 100 ? e.getMessage().substring(0, 100) : e.getMessage());
            return false;
        } catch (Exception e) {
            log.debug("Erro ao verificar Electron Gateway: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public boolean enviarComandoImpressao(CupomFiscal cupomFiscal, String devicePath)
            throws ElectronGatewayException {

        if (!estaDisponivel()) {
            throw new ElectronGatewayException("Electron Gateway não está disponível");
        }

        try {
            // Converte cupom fiscal para bytes ESC/POS
            byte[] dadosEscPos = FormatoCupomFiscal.formatarCupom(cupomFiscal);

            // Codifica em base64 para envio via HTTP
            String dadosBase64 = Base64.getEncoder().encodeToString(dadosEscPos);

            // Prepara requisição
            ElectronImpressaoRequest request = ElectronImpressaoRequest.builder()
                    .pedidoId(cupomFiscal.getPedido().getId())
                    .tipoImpressora(cupomFiscal.getConfiguracaoImpressora().getTipoImpressora().name())
                    .devicePath(devicePath)
                    .dadosCupom(dadosBase64)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<ElectronImpressaoRequest> entity = new HttpEntity<>(request, headers);

            // Envia requisição para o Electron
            String url = electronBaseUrl + ELECTRON_IMPRIMIR_ENDPOINT;
            ResponseEntity<ElectronImpressaoResponse> response = restTemplate.exchange(
                    url,
                    Objects.requireNonNull(HttpMethod.POST),
                    entity,
                    ElectronImpressaoResponse.class);

            ElectronImpressaoResponse responseBody = response.getBody();
            if (response.getStatusCode().is2xxSuccessful()
                    && responseBody != null
                    && responseBody.isSucesso()) {
                log.info("Comando de impressão enviado com sucesso para o Electron. Pedido: {}",
                        cupomFiscal.getPedido().getId());
                return true;
            } else {
                String mensagem = responseBody != null
                        ? responseBody.getMensagem()
                        : "Resposta inválida do Electron Gateway";
                throw new ElectronGatewayException(mensagem);
            }

        } catch (RestClientException e) {
            log.error("Erro ao enviar comando de impressão para o Electron", e);
            throw new ElectronGatewayException("Erro ao comunicar com Electron Gateway: " + e.getMessage(), e);
        }
    }

    private RestTemplate criarRestTemplate() {
        // Configuração de timeout é feita via RestTemplate builder se necessário
        // Por simplicidade, usando RestTemplate padrão com timeouts do sistema
        return new RestTemplate();
    }

    // DTOs internos para comunicação com Electron
    @lombok.Data
    @lombok.Builder
    private static class ElectronHealthResponse {
        private String status;
        private Integer porta;
        private String plataforma;
    }

    @lombok.Data
    @lombok.Builder
    private static class ElectronImpressaoRequest {
        private String pedidoId;
        private String tipoImpressora;
        private String devicePath;
        private String dadosCupom;
    }

    @lombok.Data
    private static class ElectronImpressaoResponse {
        private boolean sucesso;
        private String mensagem;
        private String pedidoId;
    }
}
