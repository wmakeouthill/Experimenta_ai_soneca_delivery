package com.snackbar.chatia.application.service;

import com.snackbar.chatia.application.dto.AcaoChatDTO;
import com.snackbar.chatia.application.dto.CardapioContextDTO;
import com.snackbar.chatia.application.dto.CardapioContextDTO.ProdutoContextDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Serviço para detectar comandos de ação na mensagem do usuário.
 * Identifica quando o usuário quer adicionar um produto ao carrinho via texto.
 */
@Slf4j
@Service
public class DetectorComandoService {

    // Padrões para detectar comandos de adicionar ao carrinho
    private static final List<String> VERBOS_ADICIONAR = List.of(
            "adiciona", "adicione", "add", "coloca", "coloque", "bota", "boto", "bote",
            "quero", "vou querer", "me vê", "me ve", "me da", "me dá", "manda", "pede", "pedido",
            "inclui", "inclua", "põe", "poe", "pode adicionar", "pode colocar", "pode ser");

    // Padrões para detectar comandos de REMOVER do carrinho
    private static final List<String> VERBOS_REMOVER = List.of(
            "remove", "remova", "tira", "tire", "retira", "retire", "cancela", "cancele",
            "exclui", "exclua", "apaga", "apague", "deleta", "delete", "descarta",
            "nao quero mais", "não quero mais");

    // Padrões para detectar comando de LIMPAR carrinho
    private static final List<String> VERBOS_LIMPAR = List.of(
            "limpa", "limpe", "limpar", "esvazia", "esvazie", "esvaziar",
            "zera", "zere", "zerar", "cancela tudo", "cancele tudo", "remove tudo",
            "tira tudo", "apaga tudo", "exclui tudo", "deleta tudo",
            "descarta tudo", "comecar de novo", "começar de novo", "recomecar", "recomeçar");

    // Padrões para detectar comando de VER carrinho
    private static final List<String> PADROES_VER_CARRINHO = List.of(
            "ver carrinho", "ve carrinho", "vê carrinho", "ver meu carrinho",
            "o que tem no carrinho", "que tem no carrinho", "tem no carrinho",
            "meu carrinho", "meu pedido", "ver pedido", "ver meu pedido",
            "quanto ta", "quanto tá", "quanto está", "quanto esta", "quanto ficou",
            "total do pedido", "total do carrinho", "valor do pedido", "valor do carrinho",
            "resumo do pedido", "resumo do carrinho", "revisar pedido", "revisar carrinho",
            "o que eu pedi", "que eu pedi", "itens do carrinho", "itens do pedido",
            "mostra o carrinho", "mostra o pedido", "mostrar carrinho", "mostrar pedido");

    // Padrão PRIORITÁRIO: "numero X" ou "número X" (mais comum em menus)
    // Captura o número do produto quando mencionado explicitamente
    private static final Pattern PADRAO_NUMERO_PRODUTO = Pattern.compile(
            "(?:n[uú]mero|n°|nº)\\s*(\\d+)",
            Pattern.CASE_INSENSITIVE);

    // Padrão secundário: referências como "esse 4", "desse 4", "o 4"
    private static final Pattern PADRAO_REFERENCIA_DEMONSTRATIVO = Pattern.compile(
            "(?:d?ess[ea]|d?est[ea]|aquel[ea])\\s+(?:n[uú]mero|n°|nº)?\\s*(\\d+)",
            Pattern.CASE_INSENSITIVE);

    // Padrões para detectar quantidade EXPLÍCITA (com indicador de quantidade)
    // Ex: "2 unidades", "3x", "quero 2"
    private static final Pattern PADRAO_QUANTIDADE_EXPLICITA = Pattern.compile(
            "(\\d+)\\s*(?:unidade|unidades|x|un\\.?|vezes)\\b",
            Pattern.CASE_INSENSITIVE);

    // Quantidade no início: "2 x-tudo", "3 hamburguer"
    private static final Pattern PADRAO_QUANTIDADE_INICIO = Pattern.compile(
            "^\\s*(\\d+)\\s+(?!numero|número|n°|nº)",
            Pattern.CASE_INSENSITIVE);

    /**
     * Detecta qualquer comando de ação na mensagem.
     * Prioriza: VER_CARRINHO > LIMPAR > REMOVER > ADICIONAR
     */
    public AcaoChatDTO detectarComando(String mensagem, CardapioContextDTO cardapio) {
        if (mensagem == null) {
            return AcaoChatDTO.nenhuma();
        }

        String mensagemNormalizada = normalizar(mensagem);

        // 1. Verifica se é comando de VER carrinho (maior prioridade)
        AcaoChatDTO acaoVerCarrinho = detectarComandoVerCarrinho(mensagemNormalizada);
        if (acaoVerCarrinho.temAcao()) {
            return acaoVerCarrinho;
        }

        // 2. Verifica se é comando de LIMPAR carrinho
        AcaoChatDTO acaoLimpar = detectarComandoLimpar(mensagemNormalizada);
        if (acaoLimpar.temAcao()) {
            return acaoLimpar;
        }

        // 3. Verifica se é comando de REMOVER do carrinho
        AcaoChatDTO acaoRemover = detectarComandoRemover(mensagem, mensagemNormalizada, cardapio);
        if (acaoRemover.temAcao()) {
            return acaoRemover;
        }

        // 4. Verifica se é comando de ADICIONAR ao carrinho
        return detectarComandoAdicionar(mensagem, cardapio);
    }

    /**
     * Detecta comando de VER carrinho/pedido.
     * Ex: "o que tem no carrinho?", "quanto está?", "ver meu pedido"
     */
    private AcaoChatDTO detectarComandoVerCarrinho(String mensagemNormalizada) {
        boolean contemPadraoVerCarrinho = PADROES_VER_CARRINHO.stream()
                .anyMatch(padrao -> mensagemNormalizada.contains(normalizar(padrao)));

        if (contemPadraoVerCarrinho) {
            log.info("👀 Comando de VER carrinho detectado");
            return AcaoChatDTO.verCarrinho();
        }

        return AcaoChatDTO.nenhuma();
    }

    /**
     * Detecta comando de LIMPAR/ESVAZIAR carrinho.
     * Ex: "limpa o carrinho", "cancela tudo", "esvazia o carrinho"
     */
    private AcaoChatDTO detectarComandoLimpar(String mensagemNormalizada) {
        boolean contemVerbosLimpar = VERBOS_LIMPAR.stream()
                .anyMatch(verbo -> mensagemNormalizada.contains(normalizar(verbo)));

        // Também detecta padrões como "limpa o carrinho", "esvazia meu pedido"
        boolean contemContextoCarrinho = mensagemNormalizada.contains("carrinho") ||
                mensagemNormalizada.contains("pedido") ||
                mensagemNormalizada.contains("cesta");

        if (contemVerbosLimpar && contemContextoCarrinho) {
            log.info("🗑️ Comando de LIMPAR carrinho detectado");
            return AcaoChatDTO.limparCarrinho();
        }

        // Detecta "cancela tudo", "remove tudo", etc.
        if (contemVerbosLimpar && mensagemNormalizada.contains("tudo")) {
            log.info("🗑️ Comando de LIMPAR carrinho detectado (tudo)");
            return AcaoChatDTO.limparCarrinho();
        }

        return AcaoChatDTO.nenhuma();
    }

    /**
     * Detecta comando de REMOVER um produto específico do carrinho.
     * Ex: "tira o x-tudo", "remove o número 4", "cancela a coca"
     */
    private AcaoChatDTO detectarComandoRemover(String mensagemOriginal, String mensagemNormalizada,
            CardapioContextDTO cardapio) {
        if (cardapio == null) {
            return AcaoChatDTO.nenhuma();
        }

        boolean contemVerboRemover = VERBOS_REMOVER.stream()
                .anyMatch(verbo -> mensagemNormalizada.contains(normalizar(verbo)));

        if (!contemVerboRemover) {
            return AcaoChatDTO.nenhuma();
        }

        log.info("🔄 Comando de remover detectado na mensagem: '{}'", mensagemOriginal);

        // Tenta identificar qual produto remover
        Optional<CardapioContextDTO.ProdutoContextDTO> produtoEncontrado = identificarProduto(mensagemNormalizada,
                mensagemOriginal, cardapio);

        if (produtoEncontrado.isEmpty()) {
            log.warn("⚠️ Verbo de remover detectado, mas produto não identificado");
            return AcaoChatDTO.nenhuma();
        }

        CardapioContextDTO.ProdutoContextDTO produto = produtoEncontrado.get();
        log.info("🗑️ Comando identificado: remover '{}' do carrinho", produto.nome());

        return AcaoChatDTO.removerCarrinho(produto.id(), produto.nome());
    }

    /**
     * Detecta se a mensagem contém um comando de adicionar ao carrinho.
     * 
     * @param mensagem Mensagem do usuário
     * @param cardapio Cardápio para identificar o produto
     * @return AcaoChatDTO com os dados do comando, ou acao.nenhuma() se não for
     *         comando
     */
    public AcaoChatDTO detectarComandoAdicionar(String mensagem, CardapioContextDTO cardapio) {
        if (mensagem == null || cardapio == null) {
            return AcaoChatDTO.nenhuma();
        }

        String mensagemNormalizada = normalizar(mensagem);

        // Verifica se contém verbo de adicionar
        boolean contemVerboAdicionar = VERBOS_ADICIONAR.stream()
                .anyMatch(verbo -> mensagemNormalizada.contains(normalizar(verbo)));

        if (!contemVerboAdicionar) {
            return AcaoChatDTO.nenhuma();
        }

        log.info("🎯 Comando de adicionar detectado na mensagem: '{}'", mensagem);

        // Tenta identificar qual produto (passa a mensagem original também para extrair
        // número)
        Optional<ProdutoContextDTO> produtoEncontrado = identificarProduto(mensagemNormalizada, mensagem, cardapio);

        if (produtoEncontrado.isEmpty()) {
            log.warn("⚠️ Verbo de adicionar detectado, mas produto não identificado");
            return AcaoChatDTO.nenhuma();
        }

        ProdutoContextDTO produto = produtoEncontrado.get();

        // Extrai quantidade EXPLÍCITA (não confunde com número do produto)
        int quantidade = extrairQuantidadeExplicita(mensagem);

        // Extrai observação (ex: "sem cebola", "com bacon extra")
        // Inclui contexto de quantidade parcial (ex: "um deles sem cebola")
        String observacao = extrairObservacaoCompleta(mensagem);

        log.info("✅ Comando identificado: adicionar '{}' x{} | obs: '{}'",
                produto.nome(), quantidade, observacao);

        return AcaoChatDTO.adicionarCarrinho(
                produto.id(),
                produto.nome(),
                quantidade,
                observacao);
    }

    /**
     * Identifica o produto mencionado na mensagem.
     * Prioriza: 1) Número do produto (ex: "numero 4"), 2) Nome exato, 3) Nome
     * parcial
     */
    private Optional<ProdutoContextDTO> identificarProduto(String mensagemNormalizada, String mensagemOriginal,
            CardapioContextDTO cardapio) {
        List<ProdutoContextDTO> produtosDisponiveis = cardapio.produtos().stream()
                .filter(ProdutoContextDTO::disponivel)
                .toList();

        // 1. PRIMEIRO: Tenta match por "numero X" (padrão mais comum em menus)
        // Ex: "quero 3 do numero 4" -> deve pegar "Número 4"
        Matcher matcherNumero = PADRAO_NUMERO_PRODUTO.matcher(mensagemOriginal);
        if (matcherNumero.find()) {
            try {
                int numeroReferencia = Integer.parseInt(matcherNumero.group(1));
                log.info("🔢 Referência 'numero {}' encontrada na mensagem", numeroReferencia);

                // Busca produto cujo nome contenha "Número X"
                for (ProdutoContextDTO produto : produtosDisponiveis) {
                    String nomeProduto = normalizar(produto.nome());

                    if (nomeProduto.equals("numero " + numeroReferencia) ||
                            nomeProduto.equals("numero" + numeroReferencia) ||
                            nomeProduto.startsWith("numero " + numeroReferencia + " ") ||
                            nomeProduto.endsWith(" " + numeroReferencia) ||
                            nomeProduto.matches(".*\\bnumero\\s*" + numeroReferencia + "\\b.*")) {
                        log.info("📦 Produto identificado por 'numero {}': {}", numeroReferencia, produto.nome());
                        return Optional.of(produto);
                    }
                }
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        // 2. Tenta match por nome exato ou parcial (mas NÃO a palavra "numero" sozinha)
        for (ProdutoContextDTO produto : produtosDisponiveis) {
            String nomeProduto = normalizar(produto.nome());

            // Match exato
            if (mensagemNormalizada.contains(nomeProduto)) {
                log.info("📦 Produto identificado por nome exato: {}", produto.nome());
                return Optional.of(produto);
            }

            // Match parcial (ex: "x-tudo" para "X-Tudo do Soneca")
            String[] partes = nomeProduto.split("\\s+");
            for (String parte : partes) {
                // Ignora palavras muito curtas, genéricas, ou "numero" (já tratado acima)
                if (parte.length() > 3 && !isGenerico(parte) && !parte.equals("numero")
                        && mensagemNormalizada.contains(parte)) {
                    log.info("📦 Produto identificado por nome parcial '{}': {}", parte, produto.nome());
                    return Optional.of(produto);
                }
            }
        }

        // 3. Tenta match por demonstrativo (ex: "desse 4", "esse 4")
        Matcher matcherDemo = PADRAO_REFERENCIA_DEMONSTRATIVO.matcher(mensagemOriginal);
        if (matcherDemo.find()) {
            try {
                int numeroReferencia = Integer.parseInt(matcherDemo.group(1));
                log.info("🔢 Referência demonstrativa '{}' encontrada", numeroReferencia);

                // Primeiro busca por nome
                for (ProdutoContextDTO produto : produtosDisponiveis) {
                    String nomeProduto = normalizar(produto.nome());
                    if (nomeProduto.contains("numero " + numeroReferencia) ||
                            nomeProduto.endsWith(" " + numeroReferencia)) {
                        log.info("📦 Produto identificado por demonstrativo: {}", produto.nome());
                        return Optional.of(produto);
                    }
                }

                // Fallback: usa como índice
                if (numeroReferencia >= 1 && numeroReferencia <= Math.min(20, produtosDisponiveis.size())) {
                    ProdutoContextDTO produto = produtosDisponiveis.get(numeroReferencia - 1);
                    log.info("📦 Produto identificado pelo índice {} (fallback): {}", numeroReferencia, produto.nome());
                    return Optional.of(produto);
                }
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        return Optional.empty();
    }

    /**
     * Verifica se uma palavra é genérica demais para match
     */
    private boolean isGenerico(String palavra) {
        return List.of("com", "sem", "para", "mais", "menos", "grande", "pequeno", "medio")
                .contains(palavra);
    }

    /**
     * Extrai a quantidade EXPLÍCITA da mensagem (default: 1).
     * Só considera quantidade quando há indicador claro.
     * NÃO confunde com referência a número de produto.
     */
    private int extrairQuantidadeExplicita(String mensagem) {
        // 1. Padrão explícito com unidade: "2 unidades", "3x", "2 un"
        Matcher matcherExplicito = PADRAO_QUANTIDADE_EXPLICITA.matcher(mensagem);
        if (matcherExplicito.find()) {
            try {
                int qtd = Integer.parseInt(matcherExplicito.group(1));
                log.info("🔢 Quantidade explícita com unidade: {}", qtd);
                return Math.min(Math.max(qtd, 1), 10);
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        // 2. Quantidade após verbo de adicionar: "quero 2", "me vê 3", "adiciona 2"
        // Mas NÃO "quero o 4" ou "adiciona o número 4" (referência a produto)
        Pattern padraoAposVerbo = Pattern.compile(
                "(?:quero|adiciona|coloca|me\\s*v[eê]|me\\s*d[aá]|manda|pede)\\s+(\\d+)(?!\\s*(?:numero|número|n°|nº|o\\s|a\\s|do\\s|da\\s))",
                Pattern.CASE_INSENSITIVE);
        Matcher matcherAposVerbo = padraoAposVerbo.matcher(mensagem);
        if (matcherAposVerbo.find()) {
            try {
                int qtd = Integer.parseInt(matcherAposVerbo.group(1));
                log.info("🔢 Quantidade após verbo: {}", qtd);
                return Math.min(Math.max(qtd, 1), 10);
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        // 3. Quantidade antes de "do/da/de": "2 do número 4", "3 da coca"
        Pattern padraoAntesDe = Pattern.compile(
                "(\\d+)\\s+(?:do|da|de|del)\\s+",
                Pattern.CASE_INSENSITIVE);
        Matcher matcherAntesDe = padraoAntesDe.matcher(mensagem);
        if (matcherAntesDe.find()) {
            try {
                int qtd = Integer.parseInt(matcherAntesDe.group(1));
                log.info("🔢 Quantidade antes de 'do/da': {}", qtd);
                return Math.min(Math.max(qtd, 1), 10);
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        // 4. Quantidade no início seguida de produto (não número): "2 x-tudo", "3
        // hamburguer"
        Matcher matcherInicio = PADRAO_QUANTIDADE_INICIO.matcher(mensagem);
        if (matcherInicio.find()) {
            try {
                int qtd = Integer.parseInt(matcherInicio.group(1));
                log.info("🔢 Quantidade no início: {}", qtd);
                return Math.min(Math.max(qtd, 1), 10);
            } catch (NumberFormatException e) {
                // Ignora
            }
        }

        return 1; // Default
    }

    /**
     * Extrai observação completa, incluindo contexto de quantidade parcial.
     * Ex: "quero 2 do número 4, um deles sem cebola" -> "1x SEM CEBOLA"
     * 
     * Formato claro para a cozinha entender quais unidades têm observação
     * específica.
     */
    private String extrairObservacaoCompleta(String mensagem) {
        StringBuilder observacoes = new StringBuilder();

        // 1. Detecta padrões de quantidade parcial (ex: "um deles", "2 deles")
        // Padrão: "um/uma/1/2... del(e/a)s? é/sem/com..."
        Pattern padraoQuantidadeParcial = Pattern.compile(
                "(um|uma|\\d+)\\s+(?:del[ea]s?|desses?|dessas?)\\s+(?:é\\s+|seja\\s+|sendo\\s+)?(.+?)(?:,|\\.|$)",
                Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        Matcher matcherParcial = padraoQuantidadeParcial.matcher(mensagem);

        while (matcherParcial.find()) {
            String quantidadeParcialStr = matcherParcial.group(1).toLowerCase();
            String observacaoParcial = matcherParcial.group(2).trim();

            // Converte "um/uma" para 1
            int quantidadeParcial = 1;
            if (quantidadeParcialStr.equals("um") || quantidadeParcialStr.equals("uma")) {
                quantidadeParcial = 1;
            } else {
                try {
                    quantidadeParcial = Integer.parseInt(quantidadeParcialStr);
                } catch (NumberFormatException e) {
                    quantidadeParcial = 1;
                }
            }

            // Formata: "1x SEM CEBOLA" - formato claro para cozinha
            if (!observacaoParcial.isBlank()) {
                if (!observacoes.isEmpty()) {
                    observacoes.append(" | ");
                }
                observacoes.append(quantidadeParcial).append("x ")
                        .append(limparObservacao(observacaoParcial).toUpperCase());
            }
        }

        // 2. Se não encontrou padrão de quantidade parcial, usa extração normal
        if (observacoes.isEmpty()) {
            return extrairObservacao(mensagem);
        }

        // 3. Também captura observações gerais (que se aplicam a todos)
        String obsGeral = extrairObservacao(mensagem);
        // Remove da obs geral as partes que já foram capturadas como parciais
        if (obsGeral != null && !obsGeral.isBlank()) {
            // Verifica se a obs geral não está contida nas parciais
            String obsParciais = observacoes.toString().toLowerCase();
            String[] partesObs = obsGeral.split(",");
            for (String parte : partesObs) {
                String parteLimpa = parte.trim().toLowerCase();
                if (!obsParciais.contains(parteLimpa)) {
                    observacoes.append(" | TODOS: ").append(parte.trim().toUpperCase());
                }
            }
        }

        return observacoes.toString().trim();
    }

    /**
     * Extrai observações da mensagem (ex: "sem cebola", "com bacon extra").
     * Suporta acentos e caracteres especiais do português.
     */
    private String extrairObservacao(String mensagem) {
        StringBuilder observacoes = new StringBuilder();

        // Padrão que captura letras com acentos: [\\p{L}\\s] em vez de [\\w\\s]
        // \\p{L} = qualquer letra Unicode (inclui acentos)
        List<Pattern> padroes = List.of(
                // "sem cebola", "sem maionese"
                Pattern.compile("(?:sem)\\s+([\\p{L}\\s]+?)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // "com bacon", "com extra queijo", "com molho especial"
                Pattern.compile("(?:com)\\s+(?:extra\\s+)?([\\p{L}\\s]+?)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // "extra bacon", "extra queijo"
                Pattern.compile("(?:extra)\\s+([\\p{L}\\s]+?)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // "tirar cebola", "tira a salada"
                Pattern.compile("(?:tirar|tira|remove|retira)\\s+(?:o|a)?\\s*([\\p{L}\\s]+?)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // "mais molho", "menos sal"
                Pattern.compile("(?:mais|menos|pouco|muito)\\s+([\\p{L}\\s]+?)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // "bem passado", "mal passado", "ao ponto"
                Pattern.compile("(?:bem|mal|ao)\\s+(passad[oa]|ponto)(?:,|\\.|\\s+e\\s|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE),
                // Captura frases após "sendo que", "só que", "mas"
                Pattern.compile("(?:sendo\\s+que|só\\s+que|mas|porém)\\s+([\\p{L}\\s]+?)(?:,|\\.|$)",
                        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE));

        for (Pattern padrao : padroes) {
            Matcher matcher = padrao.matcher(mensagem);
            while (matcher.find()) {
                String obs = matcher.group(0).trim();
                // Remove palavras que não são observação real
                if (!obs.isBlank() && !isObservacaoInvalida(obs)) {
                    if (!observacoes.isEmpty()) {
                        observacoes.append(", ");
                    }
                    observacoes.append(limparObservacao(obs));
                }
            }
        }

        String resultado = observacoes.toString().trim();
        return resultado.isEmpty() ? null : resultado;
    }

    /**
     * Verifica se a "observação" encontrada é na verdade parte do comando e não uma
     * observação real.
     */
    private boolean isObservacaoInvalida(String obs) {
        String lower = obs.toLowerCase();
        // Palavras que não são observações válidas
        return lower.contains("numero") ||
                lower.contains("número") ||
                lower.contains("carrinho") ||
                lower.contains("pedido") ||
                lower.contains("favor") ||
                lower.contains("obrigad");
    }

    /**
     * Limpa e formata a observação para exibição.
     */
    private String limparObservacao(String obs) {
        // Remove espaços extras
        return obs.replaceAll("\\s+", " ").trim();
    }

    /**
     * Normaliza texto para comparação.
     */
    private String normalizar(String texto) {
        if (texto == null)
            return "";
        String normalizado = Normalizer.normalize(texto.toLowerCase().trim(), Normalizer.Form.NFD);
        return normalizado.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
    }
}
