package com.snackbar.chatia.application.service;

import com.snackbar.chatia.application.dto.CardapioContextDTO;
import com.snackbar.chatia.application.dto.CardapioContextDTO.ProdutoContextDTO;
import com.snackbar.chatia.application.dto.ResultadoBuscaDTO;
import com.snackbar.chatia.application.dto.ResultadoBuscaDTO.TipoBusca;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Serviço de busca inteligente de produtos com:
 * - Levenshtein Distance para tolerância a erros de digitação
 * - Stemming básico para português
 * - Busca por categoria
 * - Busca por ingredientes/descrição
 */
@Slf4j
@Service
public class BuscaProdutoInteligenteService {

    private static final int MAX_LEVENSHTEIN_DISTANCE = 3;
    private static final double MIN_SIMILARITY_SCORE = 0.4;  // Reduzido de 0.6 para melhor detecção
    private static final int MAX_RESULTADOS = 5;

    // Mapa de stemming básico para português (plural -> singular, variações comuns)
    private static final Map<String, String> STEMMING_MAP = Map.ofEntries(
        // Plurais comuns
        Map.entry("hamburgueres", "hamburguer"),
        Map.entry("hambúrgueres", "hamburguer"),
        Map.entry("hamburgers", "hamburguer"),
        Map.entry("burguers", "hamburguer"),
        Map.entry("lanches", "lanche"),
        Map.entry("batatas", "batata"),
        Map.entry("refrigerantes", "refrigerante"),
        Map.entry("sucos", "suco"),
        Map.entry("bebidas", "bebida"),
        Map.entry("sobremesas", "sobremesa"),
        Map.entry("doces", "doce"),
        Map.entry("salgados", "salgado"),
        Map.entry("combos", "combo"),
        Map.entry("pizzas", "pizza"),
        Map.entry("porções", "porção"),
        Map.entry("porcoes", "porção"),
        Map.entry("cervejas", "cerveja"),
        Map.entry("drinks", "drink"),
        Map.entry("açaís", "açaí"),
        Map.entry("acais", "açaí"),
        Map.entry("milk-shakes", "milkshake"),
        Map.entry("milkshakes", "milkshake"),
        Map.entry("sanduíches", "sanduíche"),
        Map.entry("sanduiches", "sanduiche"),
        Map.entry("sandwiches", "sanduiche"),
        Map.entry("hotdogs", "hotdog"),
        Map.entry("hot-dogs", "hotdog"),
        Map.entry("cachorro-quentes", "cachorro-quente"),
        Map.entry("cachorros-quentes", "cachorro-quente"),
        
        // Variações de escrita
        Map.entry("hamburguer", "hamburguer"),
        Map.entry("hambúrguer", "hamburguer"),
        Map.entry("burger", "hamburguer"),
        Map.entry("burguer", "hamburguer"),
        Map.entry("x-burguer", "x-burger"),
        Map.entry("xburguer", "x-burger"),
        Map.entry("cheese", "queijo"),
        Map.entry("bacon", "bacon"),
        Map.entry("fritas", "frita"),
        Map.entry("onion", "onion"),
        Map.entry("rings", "ring"),
        Map.entry("cheddar", "cheddar"),
        Map.entry("salada", "salada"),
        Map.entry("molho", "molho"),
        Map.entry("especial", "especial"),
        Map.entry("duplo", "duplo"),
        Map.entry("triplo", "triplo")
    );

    // Sinônimos para busca por categoria
    private static final Map<String, List<String>> SINONIMOS = Map.of(
        "hamburguer", List.of("burger", "lanche", "sanduiche", "x-"),
        "batata", List.of("frita", "fritas", "chips"),
        "refrigerante", List.of("refri", "coca", "guarana", "fanta", "sprite"),
        "suco", List.of("natural", "laranja", "limão"),
        "cerveja", List.of("chopp", "beer", "gelada"),
        "açaí", List.of("acai", "açai")
    );

    // Sinônimos de ingredientes (inglês <-> português)
    private static final Map<String, List<String>> SINONIMOS_INGREDIENTES = Map.ofEntries(
        Map.entry("onion", List.of("cebola", "cebolas")),
        Map.entry("cebola", List.of("onion", "onions")),
        Map.entry("cheese", List.of("queijo", "queijos")),
        Map.entry("queijo", List.of("cheese")),
        Map.entry("bacon", List.of("bacon")),
        Map.entry("egg", List.of("ovo", "ovos")),
        Map.entry("ovo", List.of("egg", "eggs")),
        Map.entry("lettuce", List.of("alface")),
        Map.entry("alface", List.of("lettuce")),
        Map.entry("tomato", List.of("tomate", "tomates")),
        Map.entry("tomate", List.of("tomato")),
        Map.entry("pickle", List.of("picles", "pepino")),
        Map.entry("picles", List.of("pickle", "pickles")),
        Map.entry("ring", List.of("rings", "anel", "aneis")),
        Map.entry("chicken", List.of("frango", "galinha")),
        Map.entry("frango", List.of("chicken")),
        Map.entry("meat", List.of("carne", "carnes")),
        Map.entry("carne", List.of("meat", "beef")),
        Map.entry("fries", List.of("fritas", "batata", "batatas")),
        Map.entry("fritas", List.of("fries", "chips"))
    );

    /**
     * Busca produtos relevantes baseado na mensagem do usuário.
     * Retorna ResultadoBuscaDTO com o TIPO de busca identificado para contexto adequado.
     * 
     * @param mensagem mensagem do usuário
     * @param cardapio cardápio completo
     * @return resultado da busca com tipo identificado
     */
    public ResultadoBuscaDTO buscarComContexto(String mensagem, CardapioContextDTO cardapio) {
        if (mensagem == null || mensagem.isBlank() || cardapio == null || cardapio.produtos().isEmpty()) {
            return ResultadoBuscaDTO.semResultado(mensagem);
        }
        
        String mensagemNormalizada = normalizar(mensagem);
        
        // 1. Detecta se é pergunta genérica sobre cardápio
        if (isPerguntaGenericaCardapio(mensagemNormalizada)) {
            log.info("📋 Tipo: CARDAPIO_GERAL");
            List<ProdutoContextDTO> destaques = obterProdutosDestaque(cardapio);
            return ResultadoBuscaDTO.cardapioGeral(destaques);
        }
        
        // 2. Detecta ingredientes específicos na mensagem
        String ingredienteDetectado = detectarIngrediente(mensagemNormalizada);
        if (ingredienteDetectado != null) {
            log.info("🥬 Tipo: INGREDIENTE - '{}'", ingredienteDetectado);
            List<ProdutoContextDTO> produtos = buscarPorIngrediente(ingredienteDetectado, cardapio);
            if (!produtos.isEmpty()) {
                return ResultadoBuscaDTO.porIngrediente(ingredienteDetectado, produtos);
            }
        }
        
        // 3. Detecta busca por nome específico de produto
        String nomeDetectado = detectarNomeProduto(mensagemNormalizada, cardapio);
        if (nomeDetectado != null) {
            log.info("🍔 Tipo: NOME_PRODUTO - '{}'", nomeDetectado);
            List<ProdutoContextDTO> produtos = buscarPorNomeExato(nomeDetectado, cardapio);
            if (!produtos.isEmpty()) {
                return ResultadoBuscaDTO.porNome(nomeDetectado, produtos);
            }
        }
        
        // 4. Detecta busca por categoria
        Optional<String> categoria = identificarCategoriaMencionada(mensagem, cardapio);
        if (categoria.isPresent()) {
            log.info("📁 Tipo: CATEGORIA - '{}'", categoria.get());
            List<ProdutoContextDTO> produtos = buscarPorCategoria(categoria.get(), cardapio);
            if (!produtos.isEmpty()) {
                return ResultadoBuscaDTO.porCategoria(categoria.get(), produtos);
            }
        }
        
        // 5. Fallback: busca geral por relevância
        List<ProdutoContextDTO> produtosRelevantes = buscarProdutosRelevantes(mensagem, cardapio);
        if (!produtosRelevantes.isEmpty()) {
            // Tenta identificar o que foi buscado
            String termo = extrairTermoPrincipal(mensagemNormalizada);
            log.info("🔍 Tipo: BUSCA_GERAL - termo principal: '{}'", termo);
            return ResultadoBuscaDTO.porIngrediente(termo, produtosRelevantes);
        }
        
        return ResultadoBuscaDTO.semResultado(mensagem);
    }
    
    /**
     * Detecta se há ingredientes específicos mencionados na mensagem.
     */
    private String detectarIngrediente(String mensagem) {
        // Lista de ingredientes conhecidos
        List<String> ingredientes = List.of(
            "onion ring", "onion", "cebola", "bacon", "queijo", "cheese", "cheddar",
            "ovo", "egg", "salada", "alface", "tomate", "picles", "maionese",
            "ketchup", "mostarda", "molho", "frango", "chicken", "carne", "meat",
            "calabresa", "catupiry", "mussarela", "provolone", "gorgonzola"
        );
        
        for (String ingrediente : ingredientes) {
            if (mensagem.contains(ingrediente)) {
                return ingrediente;
            }
        }
        return null;
    }
    
    /**
     * Detecta se há nome de produto específico na mensagem.
     */
    private String detectarNomeProduto(String mensagem, CardapioContextDTO cardapio) {
        for (ProdutoContextDTO produto : cardapio.produtos()) {
            String nomeProduto = normalizar(produto.nome());
            // Verifica match exato ou parcial significativo
            if (mensagem.contains(nomeProduto) || 
                calcularSimilaridade(mensagem, nomeProduto) > 0.7) {
                return produto.nome();
            }
            // Verifica partes do nome (ex: "x-tudo" em "X-Tudo do Soneca")
            String[] partes = nomeProduto.split("\\s+");
            for (String parte : partes) {
                if (parte.length() > 3 && mensagem.contains(parte)) {
                    return produto.nome();
                }
            }
        }
        return null;
    }
    
    /**
     * Busca produtos que contenham um ingrediente específico na descrição.
     */
    private List<ProdutoContextDTO> buscarPorIngrediente(String ingrediente, CardapioContextDTO cardapio) {
        String ingredienteNorm = normalizar(ingrediente);
        List<String> sinonimos = new ArrayList<>();
        sinonimos.add(ingredienteNorm);
        
        // Adiciona sinônimos do ingrediente
        List<String> sins = SINONIMOS_INGREDIENTES.get(ingredienteNorm);
        if (sins != null) sinonimos.addAll(sins);
        
        return cardapio.produtos().stream()
            .filter(ProdutoContextDTO::disponivel)
            .filter(p -> {
                String desc = normalizar(p.descricao() != null ? p.descricao() : "");
                String nome = normalizar(p.nome());
                for (String sin : sinonimos) {
                    if (desc.contains(sin) || nome.contains(sin)) {
                        return true;
                    }
                }
                return false;
            })
            .limit(MAX_RESULTADOS)
            .collect(Collectors.toList());
    }
    
    /**
     * Busca produto por nome exato ou muito similar.
     */
    private List<ProdutoContextDTO> buscarPorNomeExato(String nome, CardapioContextDTO cardapio) {
        String nomeNorm = normalizar(nome);
        
        return cardapio.produtos().stream()
            .filter(ProdutoContextDTO::disponivel)
            .filter(p -> {
                String nomeProduto = normalizar(p.nome());
                return nomeProduto.contains(nomeNorm) || 
                       nomeNorm.contains(nomeProduto) ||
                       calcularSimilaridade(nomeProduto, nomeNorm) > 0.7;
            })
            .limit(MAX_RESULTADOS)
            .collect(Collectors.toList());
    }
    
    /**
     * Detecta se a mensagem é uma pergunta genérica sobre o cardápio.
     */
    private boolean isPerguntaGenericaCardapio(String mensagem) {
        List<String> frasesCardapio = List.of(
            "cardapio", "menu", "o que tem", "o que voce tem", "o que vocês tem",
            "quais opcoes", "o que posso pedir", "me mostra", "mostra o",
            "quero ver", "ver opcoes", "sugestao", "recomenda"
        );
        return frasesCardapio.stream().anyMatch(mensagem::contains);
    }
    
    /**
     * Retorna produtos de destaque variados (1 por categoria quando possível).
     */
    private List<ProdutoContextDTO> obterProdutosDestaque(CardapioContextDTO cardapio) {
        List<ProdutoContextDTO> destaques = new ArrayList<>();
        Set<String> categoriasUsadas = new HashSet<>();
        
        for (ProdutoContextDTO produto : cardapio.produtos()) {
            if (!produto.disponivel()) continue;
            if (!categoriasUsadas.contains(produto.categoria())) {
                destaques.add(produto);
                categoriasUsadas.add(produto.categoria());
                if (destaques.size() >= MAX_RESULTADOS) break;
            }
        }
        return destaques;
    }
    
    /**
     * Extrai o termo principal de busca da mensagem.
     */
    private String extrairTermoPrincipal(String mensagem) {
        List<String> palavras = extrairPalavras(mensagem);
        // Retorna a palavra mais longa (geralmente a mais significativa)
        return palavras.stream()
            .max(Comparator.comparingInt(String::length))
            .orElse(mensagem);
    }

    /**
     * Busca produtos relevantes baseado na mensagem do usuário.
     * 
     * @param mensagem mensagem do usuário
     * @param cardapio cardápio completo
     * @return lista de produtos relevantes ordenados por relevância
     */
    public List<ProdutoContextDTO> buscarProdutosRelevantes(String mensagem, CardapioContextDTO cardapio) {
        if (mensagem == null || mensagem.isBlank() || cardapio == null || cardapio.produtos().isEmpty()) {
            log.debug("❌ Busca abortada: mensagem ou cardápio vazio");
            return List.of();
        }

        String mensagemNormalizada = normalizar(mensagem);
        List<String> palavrasOriginais = extrairPalavras(mensagemNormalizada);
        
        // Expande palavras com sinônimos de ingredientes
        List<String> palavras = expandirComSinonimos(palavrasOriginais);
        
        log.info("🔍 Buscando produtos para mensagem: '{}' -> palavras: {} (expandidas: {})", mensagem, palavrasOriginais, palavras);
        log.info("📦 Total de produtos disponíveis no cardápio: {}", cardapio.produtos().stream().filter(ProdutoContextDTO::disponivel).count());

        // Calcula score de relevância para cada produto
        Map<ProdutoContextDTO, Double> scores = new HashMap<>();
        
        for (ProdutoContextDTO produto : cardapio.produtos()) {
            if (!produto.disponivel()) continue;
            
            double score = calcularScoreRelevancia(produto, palavras, mensagemNormalizada);
            log.debug("   Produto '{}' - Score: {} (threshold: {})", produto.nome(), score, MIN_SIMILARITY_SCORE);
            if (score > MIN_SIMILARITY_SCORE) {
                scores.put(produto, score);
                log.info("   ✅ Produto '{}' aceito com score {}", produto.nome(), score);
            }
        }

        // Ordena por score e retorna os mais relevantes
        List<ProdutoContextDTO> resultados = scores.entrySet().stream()
            .sorted(Map.Entry.<ProdutoContextDTO, Double>comparingByValue().reversed())
            .limit(MAX_RESULTADOS)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        log.info("✅ Encontrados {} produtos relevantes: {}", resultados.size(), 
                 resultados.stream().map(ProdutoContextDTO::nome).toList());
        return resultados;
    }

    /**
     * Busca produtos por categoria.
     */
    public List<ProdutoContextDTO> buscarPorCategoria(String categoria, CardapioContextDTO cardapio) {
        if (categoria == null || cardapio == null) return List.of();
        
        String categoriaNormalizada = normalizar(categoria);
        String categoriaStemmed = aplicarStemming(categoriaNormalizada);
        
        return cardapio.produtos().stream()
            .filter(ProdutoContextDTO::disponivel)
            .filter(p -> {
                String catProduto = normalizar(p.categoria());
                return catProduto.contains(categoriaNormalizada) 
                    || catProduto.contains(categoriaStemmed)
                    || calcularSimilaridade(catProduto, categoriaNormalizada) > 0.7;
            })
            .limit(MAX_RESULTADOS)
            .collect(Collectors.toList());
    }

    /**
     * Busca produto específico por nome com fuzzy matching.
     */
    public Optional<ProdutoContextDTO> buscarProdutoPorNome(String nome, CardapioContextDTO cardapio) {
        if (nome == null || cardapio == null) return Optional.empty();
        
        String nomeNormalizado = normalizar(nome);
        String nomeStemmed = aplicarStemming(nomeNormalizado);
        
        return cardapio.produtos().stream()
            .filter(ProdutoContextDTO::disponivel)
            .max(Comparator.comparingDouble(p -> {
                String nomeProduto = normalizar(p.nome());
                double scoreExato = nomeProduto.contains(nomeNormalizado) ? 1.0 : 0.0;
                double scoreStemmed = nomeProduto.contains(nomeStemmed) ? 0.9 : 0.0;
                double scoreSimilaridade = calcularSimilaridade(nomeProduto, nomeNormalizado);
                return Math.max(Math.max(scoreExato, scoreStemmed), scoreSimilaridade);
            }))
            .filter(p -> {
                String nomeProduto = normalizar(p.nome());
                return nomeProduto.contains(nomeNormalizado) 
                    || nomeProduto.contains(nomeStemmed)
                    || calcularSimilaridade(nomeProduto, nomeNormalizado) > 0.7;
            });
    }

    /**
     * Identifica se a mensagem está pedindo uma categoria específica.
     */
    public Optional<String> identificarCategoriaMencionada(String mensagem, CardapioContextDTO cardapio) {
        String mensagemNormalizada = normalizar(mensagem);
        
        // Palavras que indicam busca por categoria
        List<String> indicadoresCategoria = List.of(
            "todos", "todas", "quais", "lista", "mostrar", "ver", "tem", "opcoes", "opções"
        );
        
        boolean querCategoria = indicadoresCategoria.stream()
            .anyMatch(mensagemNormalizada::contains);
        
        if (!querCategoria) return Optional.empty();
        
        // Busca categoria mencionada
        for (var categoria : cardapio.categorias()) {
            String catNormalizada = normalizar(categoria.nome());
            String catStemmed = aplicarStemming(catNormalizada);
            
            if (mensagemNormalizada.contains(catNormalizada) || mensagemNormalizada.contains(catStemmed)) {
                return Optional.of(categoria.nome());
            }
            
            // Verifica sinônimos da categoria
            for (var entry : SINONIMOS.entrySet()) {
                if (catNormalizada.contains(entry.getKey())) {
                    for (String sinonimo : entry.getValue()) {
                        if (mensagemNormalizada.contains(sinonimo)) {
                            return Optional.of(categoria.nome());
                        }
                    }
                }
            }
        }
        
        return Optional.empty();
    }

    // ==================== MÉTODOS AUXILIARES ====================

    /**
     * Expande lista de palavras com seus sinônimos de ingredientes.
     * Ex: ["onion", "ring"] -> ["onion", "cebola", "ring", "rings"]
     */
    private List<String> expandirComSinonimos(List<String> palavras) {
        Set<String> expandidas = new LinkedHashSet<>(palavras);
        
        for (String palavra : palavras) {
            // Adiciona sinônimos diretos
            List<String> sinonimos = SINONIMOS_INGREDIENTES.get(palavra);
            if (sinonimos != null) {
                expandidas.addAll(sinonimos);
                log.debug("   🔄 Sinônimos de '{}': {}", palavra, sinonimos);
            }
            
            // Também tenta com stemming aplicado
            String stemmed = aplicarStemming(palavra);
            sinonimos = SINONIMOS_INGREDIENTES.get(stemmed);
            if (sinonimos != null) {
                expandidas.addAll(sinonimos);
            }
        }
        
        return new ArrayList<>(expandidas);
    }

    /**
     * Calcula score de relevância de um produto para as palavras da busca.
     */
    private double calcularScoreRelevancia(ProdutoContextDTO produto, List<String> palavras, String mensagemCompleta) {
        String nomeProduto = normalizar(produto.nome());
        String descricaoProduto = normalizar(produto.descricao() != null ? produto.descricao() : "");
        String categoriaProduto = normalizar(produto.categoria());
        String textoCompleto = nomeProduto + " " + descricaoProduto + " " + categoriaProduto;
        
        double score = 0.0;
        
        // === BUSCA POR FRASE COMPLETA NA DESCRIÇÃO (PRIORIDADE MÁXIMA) ===
        // Isso permite encontrar "onion ring", "cheddar bacon", etc.
        String mensagemLimpa = normalizar(mensagemCompleta);
        if (descricaoProduto.contains(mensagemLimpa) || nomeProduto.contains(mensagemLimpa)) {
            log.debug("      🎯 Match de frase completa '{}' em '{}'!", mensagemLimpa, produto.nome());
            score += 5.0; // Peso muito alto para match de frase completa
        }
        
        // Busca termos compostos comuns (2 palavras consecutivas da mensagem)
        String[] palavrasMensagem = mensagemLimpa.split("\\s+");
        for (int i = 0; i < palavrasMensagem.length - 1; i++) {
            String termoComposto = palavrasMensagem[i] + " " + palavrasMensagem[i + 1];
            if (descricaoProduto.contains(termoComposto)) {
                log.debug("      🎯 Match de termo composto '{}' em '{}'!", termoComposto, produto.nome());
                score += 4.0;
            }
        }
        
        for (String palavra : palavras) {
            String palavraStemmed = aplicarStemming(palavra);
            
            // Match exato no nome (peso maior)
            if (nomeProduto.contains(palavra) || nomeProduto.contains(palavraStemmed)) {
                score += 2.0;
            }
            
            // Match na descrição/ingredientes (peso aumentado!)
            if (descricaoProduto.contains(palavra) || descricaoProduto.contains(palavraStemmed)) {
                log.debug("      ✓ Palavra '{}' encontrada na descrição de '{}'!", palavra, produto.nome());
                score += 1.5;  // Aumentado de 1.0 para 1.5
            }
            
            // Match na categoria
            if (categoriaProduto.contains(palavra) || categoriaProduto.contains(palavraStemmed)) {
                score += 1.5;
            }
            
            // Fuzzy match com Levenshtein (tolerância a erros de digitação)
            // Ex: "hambruge" vai encontrar "hamburguer" com ~70% similaridade
            double melhorSimilaridade = 0.0;
            String melhorMatch = null;
            for (String palavraProduto : extrairPalavras(textoCompleto)) {
                double sim = calcularSimilaridade(palavraProduto, palavra);
                if (sim > melhorSimilaridade) {
                    melhorSimilaridade = sim;
                    melhorMatch = palavraProduto;
                }
                // Também verifica com stemming
                double simStemmed = calcularSimilaridade(palavraProduto, palavraStemmed);
                if (simStemmed > melhorSimilaridade) {
                    melhorSimilaridade = simStemmed;
                    melhorMatch = palavraProduto;
                }
            }
            // Threshold de 0.6 = até 40% de erro é tolerado
            // "hambruge" vs "hamburguer" = 7/9 = ~0.78 similaridade ✓
            if (melhorSimilaridade > 0.6) {
                log.debug("      🔤 Fuzzy match: '{}' ~= '{}' ({}%)", palavra, melhorMatch, (int)(melhorSimilaridade*100));
                score += melhorSimilaridade * 1.5;  // Peso bom para fuzzy match
            }
        }
        
        // Normaliza o score baseado no número de palavras
        return palavras.isEmpty() ? 0 : score / palavras.size();
    }

    /**
     * Normaliza texto: remove acentos, lowercase, remove caracteres especiais.
     */
    private String normalizar(String texto) {
        if (texto == null) return "";
        
        String normalizado = Normalizer.normalize(texto.toLowerCase().trim(), Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalizado).replaceAll("");
    }

    /**
     * Aplica stemming básico para português.
     */
    private String aplicarStemming(String palavra) {
        String stemmed = STEMMING_MAP.get(palavra);
        if (stemmed != null) return stemmed;
        
        // Regras básicas de stemming
        if (palavra.endsWith("es") && palavra.length() > 3) {
            return palavra.substring(0, palavra.length() - 2);
        }
        if (palavra.endsWith("s") && palavra.length() > 3) {
            return palavra.substring(0, palavra.length() - 1);
        }
        if (palavra.endsWith("ões") || palavra.endsWith("oes")) {
            return palavra.substring(0, palavra.length() - 3) + "ao";
        }
        
        return palavra;
    }

    /**
     * Extrai palavras significativas de um texto.
     */
    private List<String> extrairPalavras(String texto) {
        // Remove stop words comuns
        Set<String> stopWords = Set.of(
            "o", "a", "os", "as", "um", "uma", "uns", "umas", "de", "da", "do", "das", "dos",
            "em", "no", "na", "nos", "nas", "por", "para", "com", "sem", "e", "ou", "que",
            "tem", "ter", "quero", "quer", "queria", "gostaria", "me", "meu", "minha",
            "voce", "você", "favor", "por favor", "obrigado", "obrigada", "oi", "ola"
        );
        
        return Arrays.stream(texto.split("\\s+"))
            .map(this::normalizar)
            .filter(p -> p.length() > 2)
            .filter(p -> !stopWords.contains(p))
            .map(this::aplicarStemming)
            .distinct()
            .collect(Collectors.toList());
    }

    /**
     * Calcula similaridade entre duas strings usando Levenshtein normalizado.
     */
    private double calcularSimilaridade(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        if (s1.equals(s2)) return 1.0;
        if (s1.isEmpty() || s2.isEmpty()) return 0.0;
        
        int distancia = calcularLevenshtein(s1, s2);
        int maxLen = Math.max(s1.length(), s2.length());
        
        return 1.0 - ((double) distancia / maxLen);
    }

    /**
     * Calcula a distância de Levenshtein entre duas strings.
     */
    private int calcularLevenshtein(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }
}
