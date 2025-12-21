package com.sonecadelivery.clientes.infrastructure.web;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

/**
 * Controller para fazer proxy de imagens de perfil do Google.
 * Evita problemas de CORS e rate limiting do Google (429 Too Many Requests).
 */
@RestController
@RequestMapping("/api/publico/cliente/imagem")
@RequiredArgsConstructor
public class ClienteImagemProxyController {

    private final RestTemplate restTemplate;

    /**
     * Faz proxy de uma imagem externa (ex: foto do Google).
     * 
     * @param url URL da imagem codificada em Base64
     * @return Imagem como array de bytes
     */
    @GetMapping("/proxy")
    public ResponseEntity<byte[]> proxyImagem(@RequestParam String url) {
        try {
            // Decodificar URL do Base64
            String urlDecodificada = new String(Base64.getDecoder().decode(url));

            // Validar que é uma URL do Google (segurança)
            if (!urlDecodificada.startsWith("https://lh3.googleusercontent.com/") &&
                    !urlDecodificada.startsWith("https://www.google.com/") &&
                    !urlDecodificada.startsWith("https://googleusercontent.com/")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }

            // Buscar imagem
            byte[] imagemBytes = restTemplate.getForObject(urlDecodificada, byte[].class);

            if (imagemBytes == null || imagemBytes.length == 0) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Determinar content type baseado na extensão ou usar image/jpeg como padrão
            String contentType = determinarContentType(urlDecodificada);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            // Cache por 1 hora para reduzir requisições
            headers.setCacheControl("public, max-age=3600");

            return new ResponseEntity<>(imagemBytes, headers, HttpStatus.OK);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private String determinarContentType(String url) {
        String urlLower = url.toLowerCase();
        if (urlLower.contains(".png")) {
            return "image/png";
        } else if (urlLower.contains(".gif")) {
            return "image/gif";
        } else if (urlLower.contains(".webp")) {
            return "image/webp";
        } else {
            return "image/jpeg"; // Padrão para imagens do Google
        }
    }
}
