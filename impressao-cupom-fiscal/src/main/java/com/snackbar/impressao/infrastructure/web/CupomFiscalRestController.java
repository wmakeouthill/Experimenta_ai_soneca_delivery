package com.snackbar.impressao.infrastructure.web;

import com.snackbar.impressao.application.dtos.ConfiguracaoImpressoraDTO;
import com.snackbar.impressao.application.dtos.FormatarCupomResponse;
import com.snackbar.impressao.application.dtos.ImprimirCupomRequest;
import com.snackbar.impressao.application.dtos.ImprimirCupomResponse;
import com.snackbar.impressao.application.dtos.SalvarConfiguracaoImpressoraRequest;
import com.snackbar.impressao.application.usecases.BuscarConfiguracaoImpressoraUseCase;
import com.snackbar.impressao.application.usecases.FormatarCupomFiscalUseCase;
import com.snackbar.impressao.application.usecases.ImprimirCupomFiscalUseCase;
import com.snackbar.impressao.application.usecases.SalvarConfiguracaoImpressoraUseCase;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/impressao")
@RequiredArgsConstructor
public class CupomFiscalRestController {
    
    private final ImprimirCupomFiscalUseCase imprimirCupomFiscalUseCase;
    private final FormatarCupomFiscalUseCase formatarCupomFiscalUseCase;
    private final SalvarConfiguracaoImpressoraUseCase salvarConfiguracaoUseCase;
    private final BuscarConfiguracaoImpressoraUseCase buscarConfiguracaoUseCase;
    
    @PostMapping("/cupom-fiscal")
    public ResponseEntity<ImprimirCupomResponse> imprimirCupomFiscal(@Valid @RequestBody ImprimirCupomRequest request) {
        ImprimirCupomResponse response = imprimirCupomFiscalUseCase.executar(request);
        
        if (response.isSucesso()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Endpoint para formatar cupom fiscal sem tentar imprimir
     * Retorna os dados formatados em ESC/POS (base64) para impressão posterior
     * Útil quando o frontend está no Electron e precisa imprimir localmente
     */
    @PostMapping("/cupom-fiscal/formatar")
    public ResponseEntity<FormatarCupomResponse> formatarCupomFiscal(@Valid @RequestBody ImprimirCupomRequest request) {
        FormatarCupomResponse response = formatarCupomFiscalUseCase.executar(request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/configuracao")
    public ResponseEntity<ConfiguracaoImpressoraDTO> buscarConfiguracao() {
        ConfiguracaoImpressoraDTO config = buscarConfiguracaoUseCase.executar();
        if (config == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(config);
    }
    
    @PostMapping("/configuracao")
    public ResponseEntity<ConfiguracaoImpressoraDTO> salvarConfiguracao(@Valid @RequestBody SalvarConfiguracaoImpressoraRequest request) {
        ConfiguracaoImpressoraDTO config = salvarConfiguracaoUseCase.executar(request);
        return ResponseEntity.ok(config);
    }
}

