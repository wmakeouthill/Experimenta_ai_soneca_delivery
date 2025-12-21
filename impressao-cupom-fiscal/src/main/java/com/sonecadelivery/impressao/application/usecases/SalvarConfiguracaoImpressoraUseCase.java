package com.sonecadelivery.impressao.application.usecases;

import com.sonecadelivery.impressao.application.dtos.ConfiguracaoImpressoraDTO;
import com.sonecadelivery.impressao.application.dtos.SalvarConfiguracaoImpressoraRequest;
import com.sonecadelivery.impressao.application.ports.ConfiguracaoImpressoraRepositoryPort;
import com.sonecadelivery.impressao.domain.entities.ConfiguracaoImpressoraEntity;
import com.sonecadelivery.impressao.domain.valueobjects.DadosConfiguracaoImpressora;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SalvarConfiguracaoImpressoraUseCase {

    private final ConfiguracaoImpressoraRepositoryPort repository;

    public ConfiguracaoImpressoraDTO executar(SalvarConfiguracaoImpressoraRequest request) {
        ConfiguracaoImpressoraEntity configAtiva = buscarConfigAtiva();

        if (configAtiva != null) {
            DadosConfiguracaoImpressora dados = criarDadosAPartirDoRequest(request);
            configAtiva.atualizar(dados);
            ConfiguracaoImpressoraEntity salva = repository.salvar(configAtiva);
            return ConfiguracaoImpressoraDTO.de(salva);
        } else {
            DadosConfiguracaoImpressora dados = criarDadosAPartirDoRequest(request);
            ConfiguracaoImpressoraEntity novaConfig = ConfiguracaoImpressoraEntity.criar(dados);
            ConfiguracaoImpressoraEntity salva = repository.salvar(novaConfig);
            return ConfiguracaoImpressoraDTO.de(salva);
        }
    }

    private DadosConfiguracaoImpressora criarDadosAPartirDoRequest(SalvarConfiguracaoImpressoraRequest request) {
        return new DadosConfiguracaoImpressora(
                request.getTipoImpressora(),
                request.getDevicePath(),
                request.getNomeEstabelecimento(),
                request.getEnderecoEstabelecimento(),
                request.getTelefoneEstabelecimento(),
                request.getCnpjEstabelecimento(),
                request.getLogoBase64(),
                request.getLarguraPapel(),
                request.getTamanhoFonte());
    }

    private ConfiguracaoImpressoraEntity buscarConfigAtiva() {
        return repository.buscarAtiva().orElse(null);
    }
}
