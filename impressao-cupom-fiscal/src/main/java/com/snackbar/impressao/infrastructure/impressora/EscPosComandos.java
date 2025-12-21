package com.snackbar.impressao.infrastructure.impressora;

public class EscPosComandos {
    public static final byte ESC = 0x1B;
    public static final byte GS = 0x1D;
    public static final byte LF = 0x0A;
    public static final byte DLE = 0x10;
    public static final byte EOT = 0x04;
    
    public static byte[] inicializar() {
        return new byte[]{ESC, '@'};
    }
    
    /**
     * Corta o papel completamente (corte total)
     * IMPORTANTE: Sempre adicionar linhas em branco antes do corte
     * para garantir que todo o conteúdo foi impresso
     */
    public static byte[] cortarPapel() {
        return new byte[]{GS, 'V', 66, 0};
    }
    
    /**
     * Corta o papel parcialmente (perfuração sem corte completo)
     * Útil para cupons que precisam ser destacados manualmente
     */
    public static byte[] cortarPapelParcial() {
        return new byte[]{GS, 'V', 65, 0};
    }
    
    /**
     * Reseta a impressora - limpa buffer e configurações
     * IMPORTANTE: Usar no início para garantir estado limpo
     */
    public static byte[] resetar() {
        return new byte[]{ESC, '@'};
    }
    
    /**
     * Limpa o buffer da impressora
     * Força a impressora a processar todos os comandos pendentes
     */
    public static byte[] limparBuffer() {
        return new byte[]{ESC, 'i'};
    }
    
    /**
     * Força avanço de papel (feed)
     * Útil antes do corte para garantir que todo conteúdo foi impresso
     */
    public static byte[] avancoLinha(int linhas) {
        byte[] cmd = new byte[linhas];
        for (int i = 0; i < linhas; i++) {
            cmd[i] = LF;
        }
        return cmd;
    }
    
    public static byte[] alinharEsquerda() {
        return new byte[]{ESC, 'a', 0};
    }
    
    public static byte[] alinharCentro() {
        return new byte[]{ESC, 'a', 1};
    }
    
    public static byte[] alinharDireita() {
        return new byte[]{ESC, 'a', 2};
    }
    
    public static byte[] textoNormal() {
        return new byte[]{ESC, '!', 0};
    }
    
    public static byte[] textoNegrito() {
        return new byte[]{ESC, '!', 8};
    }
    
    public static byte[] textoGrande() {
        return new byte[]{ESC, '!', 16};
    }
    
    public static byte[] textoDuploAltura() {
        return new byte[]{ESC, '!', 32};
    }
    
    public static byte[] textoDuploLargura() {
        return new byte[]{ESC, '!', 16};
    }
    
    public static byte[] textoDuplo() {
        return new byte[]{ESC, '!', 48};
    }
    
    public static byte[] linhaSeparadora(int largura) {
        StringBuilder linha = new StringBuilder();
        for (int i = 0; i < largura; i++) {
            linha.append("-");
        }
        return (linha.toString() + "\n").getBytes();
    }
    
    public static byte[] linhaEmBranco(int quantidade) {
        StringBuilder linhas = new StringBuilder();
        for (int i = 0; i < quantidade; i++) {
            linhas.append("\n");
        }
        return linhas.toString().getBytes();
    }
    
    public static byte[] abrirGaveta() {
        return new byte[]{ESC, 'p', 0, 60, 120};
    }
}

