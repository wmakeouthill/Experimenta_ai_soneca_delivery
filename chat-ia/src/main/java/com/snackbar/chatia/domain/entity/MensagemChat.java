package com.snackbar.chatia.domain.entity;

/**
 * Record imutável que representa uma mensagem do chat.
 * 
 * @param role papel da mensagem ("user", "assistant", "system")
 * @param content conteúdo da mensagem
 */
public record MensagemChat(String role, String content) {
    
    public MensagemChat {
        if (role == null || role.isBlank()) {
            throw new IllegalArgumentException("Role não pode ser nulo ou vazio");
        }
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Content não pode ser nulo ou vazio");
        }
    }
    
    public static MensagemChat doUsuario(String content) {
        return new MensagemChat("user", content);
    }
    
    public static MensagemChat doAssistente(String content) {
        return new MensagemChat("assistant", content);
    }
    
    public static MensagemChat doSistema(String content) {
        return new MensagemChat("system", content);
    }
    
    public boolean isUser() {
        return "user".equals(role);
    }
    
    public boolean isAssistant() {
        return "assistant".equals(role);
    }
    
    public boolean isSystem() {
        return "system".equals(role);
    }
}
