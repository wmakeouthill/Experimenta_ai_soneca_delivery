package com.sonecadelivery.orquestrador.config;

import com.sonecadelivery.chatia.application.dto.CardapioContextDTO;
import com.sonecadelivery.chatia.application.dto.CardapioContextDTO.CategoriaContextDTO;
import com.sonecadelivery.chatia.application.dto.CardapioContextDTO.ProdutoContextDTO;
import com.sonecadelivery.chatia.application.port.out.CardapioContextPort;
import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO;
import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO.CategoriaPublicaDTO;
import com.sonecadelivery.pedidos.application.dto.CardapioPublicoDTO.ProdutoPublicoDTO;
import com.sonecadelivery.pedidos.application.usecases.BuscarCardapioPublicoUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Adapter que fornece contexto do cardápio para o Chat IA.
 * Conecta o módulo chat-ia com gestao-pedidos/gestao-cardapio.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CardapioContextAdapter implements CardapioContextPort {

    private final BuscarCardapioPublicoUseCase buscarCardapioUseCase;

    @Override
    public CardapioContextDTO buscarCardapioParaIA() {
        log.debug("Buscando cardápio completo para contexto do Chat IA");

        try {
            CardapioPublicoDTO cardapio = buscarCardapioUseCase.executar();

            // Converte categorias
            AtomicInteger ordem = new AtomicInteger(0);
            List<CategoriaContextDTO> categorias = cardapio.categorias().stream()
                    .filter(CategoriaPublicaDTO::ativa)
                    .map(cat -> toCategoriaContext(cat, ordem.getAndIncrement()))
                    .toList();

            // Converte produtos
            List<ProdutoContextDTO> produtos = cardapio.produtos().stream()
                    .filter(ProdutoPublicoDTO::disponivel)
                    .map(this::toProdutoContext)
                    .toList();

            // Gera resumo do cardápio
            String resumo = gerarResumoCardapio(categorias, produtos);

            log.info("Contexto do cardápio carregado: {} categorias, {} produtos",
                    categorias.size(), produtos.size());

            return new CardapioContextDTO(categorias, produtos, resumo);

        } catch (Exception e) {
            log.error("Erro ao buscar cardápio para contexto da IA", e);
            return new CardapioContextDTO(List.of(), List.of(), "Cardápio indisponível no momento.");
        }
    }

    private CategoriaContextDTO toCategoriaContext(CategoriaPublicaDTO dto, int ordem) {
        return new CategoriaContextDTO(
                dto.id(),
                dto.nome(),
                dto.descricao(),
                ordem);
    }

    private ProdutoContextDTO toProdutoContext(ProdutoPublicoDTO dto) {
        return new ProdutoContextDTO(
                dto.id(),
                dto.nome(),
                dto.descricao(),
                dto.categoria(),
                BigDecimal.valueOf(dto.preco()),
                dto.foto(),
                dto.disponivel(),
                List.of(), // ingredientes - expandir depois se necessário
                List.of(), // alergenos
                false, // vegetariano - expandir depois
                false // vegano - expandir depois
        );
    }

    private String gerarResumoCardapio(List<CategoriaContextDTO> categorias,
            List<ProdutoContextDTO> produtos) {
        int totalCategorias = categorias.size();
        int totalProdutos = produtos.size();

        double precoMinimo = produtos.stream()
                .mapToDouble(p -> p.preco().doubleValue())
                .min()
                .orElse(0);
        double precoMaximo = produtos.stream()
                .mapToDouble(p -> p.preco().doubleValue())
                .max()
                .orElse(0);

        return String.format(
                "Cardápio com %d categorias e %d produtos. Preços de R$ %.2f a R$ %.2f.",
                totalCategorias, totalProdutos, precoMinimo, precoMaximo);
    }
}
