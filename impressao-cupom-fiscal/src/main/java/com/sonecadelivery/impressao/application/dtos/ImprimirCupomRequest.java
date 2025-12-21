package com.sonecadelivery.impressao.application.dtos;

import com.sonecadelivery.impressao.domain.entities.TipoImpressora;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImprimirCupomRequest {
    @NotBlank(message = "ID do pedido é obrigatório")
    private String pedidoId;
    
    @NotNull(message = "Tipo de impressora é obrigatório")
    private TipoImpressora tipoImpressora;
    
    private String nomeImpressora;
    
    private String devicePath; // Device path da impressora (opcional, busca do banco se não fornecido)
    
    private String nomeEstabelecimento;
    
    private String enderecoEstabelecimento;
    
    private String telefoneEstabelecimento;
    
    private String cnpjEstabelecimento;
}

