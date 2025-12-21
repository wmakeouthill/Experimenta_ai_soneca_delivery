package com.snackbar.impressao.infrastructure.impressora;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

public class ImagemEscPosUtil {
    
    private static final int LARGURA_MAXIMA = 384;
    
    public static byte[] converterBase64ParaEscPos(String base64) {
        if (base64 == null || base64.trim().isEmpty()) {
            return new byte[0];
        }
        
        try {
            String base64Data = base64;
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            
            byte[] imageBytes = Base64.getDecoder().decode(base64Data);
            BufferedImage imagem = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
            
            if (imagem == null) {
                return new byte[0];
            }
            
            BufferedImage imagemProcessada = processarImagem(imagem);
            return converterParaEscPos(imagemProcessada);
        } catch (Exception e) {
            System.err.println("Erro ao converter imagem para ESC/POS: " + e.getMessage());
            return new byte[0];
        }
    }
    
    private static BufferedImage processarImagem(BufferedImage imagemOriginal) {
        int largura = imagemOriginal.getWidth();
        int altura = imagemOriginal.getHeight();
        
        if (largura > LARGURA_MAXIMA) {
            double escala = (double) LARGURA_MAXIMA / largura;
            largura = LARGURA_MAXIMA;
            altura = (int) (altura * escala);
        }
        
        BufferedImage imagemProcessada = new BufferedImage(largura, altura, BufferedImage.TYPE_BYTE_BINARY);
        Graphics2D g = imagemProcessada.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.drawImage(imagemOriginal, 0, 0, largura, altura, null);
        g.dispose();
        
        return imagemProcessada;
    }
    
    private static byte[] converterParaEscPos(BufferedImage imagem) throws IOException {
        int largura = imagem.getWidth();
        int altura = imagem.getHeight();
        
        int larguraBytes = (largura + 7) / 8;
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        
        for (int y = 0; y < altura; y++) {
            byte[] linha = new byte[larguraBytes];
            
            for (int x = 0; x < largura; x++) {
                int rgb = imagem.getRGB(x, y);
                int cinza = (int) (0.299 * ((rgb >> 16) & 0xFF) + 
                                   0.587 * ((rgb >> 8) & 0xFF) + 
                                   0.114 * (rgb & 0xFF));
                
                if (cinza < 128) {
                    int byteIndex = x / 8;
                    int bitIndex = 7 - (x % 8);
                    linha[byteIndex] |= (1 << bitIndex);
                }
            }
            
            output.write(linha);
        }
        
        byte[] dadosImagem = output.toByteArray();
        return criarComandoEscPosImagem(largura, altura, dadosImagem);
    }
    
    private static byte[] criarComandoEscPosImagem(int largura, int altura, byte[] dadosImagem) {
        int larguraBytes = (largura + 7) / 8;
        int nL = larguraBytes & 0xFF;
        int nH = (larguraBytes >> 8) & 0xFF;
        int alturaL = altura & 0xFF;
        int alturaH = (altura >> 8) & 0xFF;
        
        ByteArrayOutputStream comando = new ByteArrayOutputStream();
        
        // NOTA: Reset (ESC @) não deve ser adicionado aqui.
        // O Electron adiciona reset no início de todo o cupom.
        // Aqui enviamos apenas o comando de bitmap.
        
        // Comando GS (v 0) para imprimir bitmap rasterizado
        // Formato: GS v 0 nL nH vL vH [dados]
        comando.write(EscPosComandos.GS);
        comando.write('v');
        comando.write(0); // m = 0 (modo normal)
        comando.write(nL); // nL = largura em bytes (LSB)
        comando.write(nH); // nH = largura em bytes (MSB)
        comando.write(alturaL); // vL = altura em pixels (LSB)
        comando.write(alturaH); // vH = altura em pixels (MSB)
        
        // Dados da imagem (bitmap)
        for (byte b : dadosImagem) {
            comando.write(b);
        }
        
        // Adiciona quebra de linha após a imagem
        comando.write(EscPosComandos.LF);
        
        return comando.toByteArray();
    }
}

