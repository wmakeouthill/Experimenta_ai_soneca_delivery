package com.snackbar.impressao.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConfigurationProperties(prefix = "impressao")
@Getter
@Setter
public class ImpressaoProperties {
    
    private EpsonConfig epson = new EpsonConfig();
    private Map<String, Daruma800Config> daruma = new HashMap<>();
    private GenericaConfig generica = new GenericaConfig();
    
    @Getter
    @Setter
    public static class EpsonConfig {
        private TmT20Config tmT20 = new TmT20Config();
        
        @Getter
        @Setter
        public static class TmT20Config {
            private String device = "127.0.0.1:9100";
            private boolean modoTeste = false;
        }
    }
    
    @Getter
    @Setter
    public static class Daruma800Config {
        private String device = "/dev/usb/lp1";
        private boolean modoTeste = true;
    }
    
    @Getter
    @Setter
    public static class GenericaConfig {
        private String device = "/dev/usb/lp2";
        private boolean modoTeste = true;
    }
}

