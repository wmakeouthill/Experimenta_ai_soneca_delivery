package com.snackbar.impressao.infrastructure.impressora;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Component
public class LogoEscPosLoader {
    
    private static final String LOGO_PATH = "/static/experimenta_ai_banner_circular.bmp";
    private static final String LOGO_PATH_ALTERNATIVO = "/assets/experimenta_ai_banner_circular.bmp";
    private static final int LARGURA_MAXIMA = 384;
    
    private byte[] logoEscPosCache;
    
    public byte[] carregarLogoEscPos() {
        if (logoEscPosCache != null) {
            return logoEscPosCache;
        }
        
        try {
            Resource resource = new ClassPathResource(LOGO_PATH);
            if (!resource.exists()) {
                resource = new ClassPathResource(LOGO_PATH_ALTERNATIVO);
                if (!resource.exists()) {
                    return new byte[0];
                }
            }
            
            BufferedImage imagem = ImageIO.read(resource.getInputStream());
            if (imagem == null) {
                return new byte[0];
            }
            
            BufferedImage imagemProcessada = processarImagem(imagem);
            logoEscPosCache = converterParaEscPos(imagemProcessada);
            return logoEscPosCache;
        } catch (Exception e) {
            System.err.println("Aviso: Não foi possível carregar logo do assets: " + e.getMessage());
            return new byte[0];
        }
    }
    
    private BufferedImage processarImagem(BufferedImage imagemOriginal) {
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
    
    private byte[] converterParaEscPos(BufferedImage imagem) throws IOException {
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
    
    private byte[] criarComandoEscPosImagem(int largura, int altura, byte[] dadosImagem) {
        int larguraBytes = (largura + 7) / 8;
        int nL = larguraBytes & 0xFF;
        int nH = (larguraBytes >> 8) & 0xFF;
        int alturaL = altura & 0xFF;
        int alturaH = (altura >> 8) & 0xFF;
        
        ByteArrayOutputStream comando = new ByteArrayOutputStream();
        comando.write(EscPosComandos.GS);
        comando.write('v');
        comando.write(0);
        comando.write(nL);
        comando.write(nH);
        comando.write(alturaL);
        comando.write(alturaH);
        
        for (byte b : dadosImagem) {
            comando.write(b);
        }
        
        return comando.toByteArray();
    }
}

