package com.sonecadelivery.impressao.infrastructure.impressora;

import java.io.IOException;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class ConexaoImpressoraUtil {
    
    public static boolean eConexaoRede(String devicePath) {
        if (devicePath == null || devicePath.trim().isEmpty()) {
            return false;
        }
        return devicePath.contains(":") && !devicePath.startsWith("/") && !devicePath.contains("\\");
    }
    
    public static OutputStream criarConexaoRede(String devicePath) throws IOException {
        String[] partes = devicePath.split(":");
        if (partes.length != 2) {
            throw new IOException("Formato de conexão de rede inválido. Use IP:PORTA (ex: 127.0.0.1:9100)");
        }
        
        String host = partes[0].trim();
        int porta;
        try {
            porta = Integer.parseInt(partes[1].trim());
        } catch (NumberFormatException e) {
            throw new IOException("Porta inválida: " + partes[1]);
        }
        
        Socket socket = new Socket(host, porta);
        socket.setSoTimeout(5000);
        socket.setTcpNoDelay(true);
        return new SocketOutputStream(socket);
    }
    
    private static class SocketOutputStream extends OutputStream {
        private final Socket socket;
        private final OutputStream outputStream;
        
        public SocketOutputStream(Socket socket) throws IOException {
            this.socket = socket;
            this.outputStream = socket.getOutputStream();
        }
        
        @Override
        public void write(int b) throws IOException {
            outputStream.write(b);
        }
        
        @Override
        public void write(byte[] b) throws IOException {
            outputStream.write(b);
        }
        
        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            outputStream.write(b, off, len);
        }
        
        @Override
        public void flush() throws IOException {
            outputStream.flush();
        }
        
        @Override
        public void close() throws IOException {
            outputStream.close();
            socket.close();
        }
    }
    
    public static OutputStream criarConexaoLocal(String devicePath) throws IOException {
        try {
            Path caminho = Paths.get(devicePath);
            if (!Files.exists(caminho)) {
                throw new IOException("Dispositivo não encontrado: " + devicePath);
            }
            return Files.newOutputStream(caminho, java.nio.file.StandardOpenOption.WRITE);
        } catch (java.nio.file.InvalidPathException e) {
            throw new IOException("Caminho inválido: " + devicePath + ". Use formato IP:PORTA para rede (ex: 127.0.0.1:9100) ou caminho válido para dispositivo local", e);
        }
    }
    
    public static boolean verificarConexaoRede(String devicePath) {
        if (!eConexaoRede(devicePath)) {
            return false;
        }
        
        try {
            String[] partes = devicePath.split(":");
            String host = partes[0].trim();
            int porta = Integer.parseInt(partes[1].trim());
            
            try (Socket socket = new Socket()) {
                socket.connect(new java.net.InetSocketAddress(host, porta), 2000);
                return true;
            }
        } catch (Exception e) {
            return false;
        }
    }
    
    public static boolean verificarConexaoLocal(String devicePath) {
        if (devicePath == null || devicePath.trim().isEmpty()) {
            return false;
        }
        Path caminho = Paths.get(devicePath);
        return Files.exists(caminho);
    }
}

