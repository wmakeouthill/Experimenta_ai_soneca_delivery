package com.sonecadelivery.orquestrador.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.ModelAndView;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller para rotas do Angular (SPA).
 * 
 * 1. Mapeia rotas específicas do Angular para retornar index.html
 * 2. Quando uma rota não é encontrada (404) e não é uma rota de API,
 * retorna o index.html para que o Angular Router processe.
 */
@Controller
public class SpaFallbackConfig implements ErrorController {

    /**
     * Rotas públicas do Angular que precisam retornar index.html.
     * Estas são as rotas de auto-atendimento do cliente via QR Code.
     */
    @GetMapping({
            "/pedido-mesa/{token}",
            "/mesa/{token}",
            "/login",
            "/politica-privacidade",
            "/termos-uso",
            "/cardapio",
            "/pedidos",
            "/sessoes",
            "/historico-sessoes",
            "/gestao-caixa",
            "/relatorios",
            "/relatorio-financeiro",
            "/gestao-estoque",
            "/administracao",
            "/gestao-motoboys",
            "/delivery",
            "/lobby-pedidos",
            "/autoatendimento"
    })
    public String forwardToAngular() {
        return "forward:/index.html";
    }

    /**
     * Trata erros para requisições que aceitam JSON (chamadas de API).
     */
    @RequestMapping(value = "/error", produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleErrorJson(HttpServletRequest request) {
        String path = (String) request.getAttribute("jakarta.servlet.error.request_uri");
        Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");

        if (statusCode == null) {
            statusCode = HttpStatus.INTERNAL_SERVER_ERROR.value();
        }

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", statusCode);
        errorResponse.put("error", HttpStatus.valueOf(statusCode).getReasonPhrase());
        errorResponse.put("path", path);
        return ResponseEntity.status(statusCode).body(errorResponse);
    }

    /**
     * Trata erros para requisições HTML (navegação do browser).
     * Faz fallback para index.html para que o Angular Router processe.
     */
    @RequestMapping(value = "/error", produces = MediaType.TEXT_HTML_VALUE)
    public ModelAndView handleErrorHtml(HttpServletRequest request) {
        String path = (String) request.getAttribute("jakarta.servlet.error.request_uri");

        // Se for arquivo estático (contém ponto no nome), deixa erro padrão
        if (path != null && path.matches(".*\\.[a-zA-Z0-9]+$")) {
            Integer statusCode = (Integer) request.getAttribute("jakarta.servlet.error.status_code");
            if (statusCode == null) {
                statusCode = HttpStatus.NOT_FOUND.value();
            }
            ModelAndView mav = new ModelAndView();
            mav.setStatus(HttpStatus.valueOf(statusCode));
            mav.setViewName("error"); // Usa página de erro padrão
            return mav;
        }

        // Para rotas do Angular, retornar index.html
        return new ModelAndView("forward:/index.html");
    }
}
