package com.sonecadelivery.chatia.application.usecase;

import com.sonecadelivery.chatia.application.dto.CardapioContextDTO;
import com.sonecadelivery.chatia.application.dto.CardapioContextDTO.ProdutoContextDTO;
import com.sonecadelivery.chatia.application.dto.ChatRequestDTO;
import com.sonecadelivery.chatia.application.dto.ChatResponseDTO;
import com.sonecadelivery.chatia.application.dto.ChatResponseDTO.ProdutoDestacadoDTO;
import com.sonecadelivery.chatia.application.dto.HistoricoPedidosClienteContextDTO;
import com.sonecadelivery.chatia.application.dto.ResultadoBuscaDTO;
import com.sonecadelivery.chatia.application.dto.ResultadoBuscaDTO.TipoBusca;
import com.sonecadelivery.chatia.application.dto.AcaoChatDTO;
import com.sonecadelivery.chatia.application.port.in.EnviarMensagemChatUseCase;
import com.sonecadelivery.chatia.application.port.out.CardapioContextPort;
import com.sonecadelivery.chatia.application.port.out.IAClientPort;
import com.sonecadelivery.chatia.application.port.out.PedidosClienteContextPort;
import com.sonecadelivery.chatia.application.service.BuscaProdutoInteligenteService;
import com.sonecadelivery.chatia.application.service.DetectorComandoService;
import com.sonecadelivery.chatia.domain.entity.MensagemChat;
import com.sonecadelivery.chatia.domain.repository.HistoricoChatRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Caso de uso para enviar mensagens ao chat IA.
 * Orquestra a comunicação com a IA e gerenciamento do histórico.
 * Inclui contexto completo do cardápio, histórico do cliente e busca inteligente de produtos.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EnviarMensagemChatUseCaseImpl implements EnviarMensagemChatUseCase {
    
    private final IAClientPort iaClient;
    private final HistoricoChatRepository historicoRepository;
    private final CardapioContextPort cardapioContextPort;
    private final PedidosClienteContextPort pedidosClienteContextPort;
    private final BuscaProdutoInteligenteService buscaProdutoService;
    private final DetectorComandoService detectorComandoService;
    
    @Value("${chat.ia.nome-estabelecimento:Soneca Lanchonete}")
    private String nomeEstabelecimento;
    
    // Cache do cardápio para evitar múltiplas chamadas
    private CardapioContextDTO cardapioCache;
    
    @Override
    public ChatResponseDTO executar(ChatRequestDTO request) {
        String sessionId = request.sessionId();
        String mensagemUsuario = request.message();
        String clienteId = request.clienteId();
        
        log.info("Processando mensagem do chat - Session: {}, Cliente: {}", sessionId, clienteId);
        
        try {
            // Carrega cardápio (com cache simples)
            CardapioContextDTO cardapio = obterCardapio();
            
            // 🎯 PRIMEIRO: Verifica se é um comando de ação (adicionar, remover, limpar)
            AcaoChatDTO acaoDetectada = detectorComandoService.detectarComando(mensagemUsuario, cardapio);
            
            if (acaoDetectada.temAcao()) {
                // Adiciona mensagem do usuário ao histórico
                MensagemChat msgUsuario = MensagemChat.doUsuario(mensagemUsuario);
                historicoRepository.adicionarMensagem(sessionId, msgUsuario);
                
                // Gera resposta baseada no tipo de ação
                String resposta = gerarRespostaComando(acaoDetectada);
                
                // Adiciona resposta ao histórico
                MensagemChat msgAssistente = MensagemChat.doAssistente(resposta);
                historicoRepository.adicionarMensagem(sessionId, msgAssistente);
                
                log.info("🎯 Comando detectado: {} | produto: {} | qtd: {}", 
                         acaoDetectada.tipo(), acaoDetectada.produtoNome(), acaoDetectada.quantidade());
                
                return ChatResponseDTO.comAcao(resposta, acaoDetectada);
            }
            
            // Obtém histórico da sessão
            List<MensagemChat> historico = historicoRepository.obterHistorico(sessionId);
            
            // Constrói o system prompt com contexto completo
            String systemPromptCompleto = construirSystemPromptCompleto(clienteId, cardapio);
            
            // Busca produtos COM CONTEXTO (identifica tipo de busca)
            ResultadoBuscaDTO resultadoBusca = buscaProdutoService.buscarComContexto(mensagemUsuario, cardapio);
            log.info("🔍 Resultado da busca: tipo={}, termo='{}', produtos={}", 
                     resultadoBusca.tipo(), resultadoBusca.termoBuscado(), resultadoBusca.produtos().size());
            
            // Adiciona contexto dos produtos encontrados ao prompt COM TIPO DE BUSCA
            String promptComProdutos = adicionarContextoProdutosEncontrados(
                systemPromptCompleto, resultadoBusca);
            
            // Adiciona mensagem do usuário ao histórico
            MensagemChat msgUsuario = MensagemChat.doUsuario(mensagemUsuario);
            historicoRepository.adicionarMensagem(sessionId, msgUsuario);
            
            // Chama a IA
            String respostaIA = iaClient.chat(promptComProdutos, historico, mensagemUsuario);
            
            // Adiciona resposta da IA ao histórico
            MensagemChat msgAssistente = MensagemChat.doAssistente(respostaIA);
            historicoRepository.adicionarMensagem(sessionId, msgAssistente);
            
            // Converte produtos encontrados para DTOs de destaque
            List<ProdutoDestacadoDTO> produtosDestacados = resultadoBusca.produtos().stream()
                .map(this::toProdutoDestacado)
                .toList();
            
            log.info("✅ Resposta do chat gerada - Session: {}, Produtos encontrados: {}", 
                     sessionId, produtosDestacados.size());
            
            // Log detalhado dos produtos destacados
            if (!produtosDestacados.isEmpty()) {
                log.info("📦 Produtos destacados para o frontend:");
                produtosDestacados.forEach(p -> 
                    log.info("   - {} (ID: {}, R$ {}, disponivel: {})", 
                             p.nome(), p.id(), p.preco(), p.disponivel()));
            }
            
            return ChatResponseDTO.comProdutos(respostaIA, produtosDestacados);
            
        } catch (Exception e) {
            log.error("Erro ao processar mensagem do chat - Session: {}", sessionId, e);
            return ChatResponseDTO.erro("Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.");
        }
    }
    
    /**
     * Gera uma resposta amigável baseada no tipo de comando detectado.
     */
    private String gerarRespostaComando(AcaoChatDTO acao) {
        return switch (acao.tipo()) {
            case ADICIONAR_CARRINHO -> gerarRespostaComandoAdicionar(acao);
            case REMOVER_CARRINHO -> gerarRespostaComandoRemover(acao);
            case LIMPAR_CARRINHO -> gerarRespostaComandoLimpar();
            case VER_CARRINHO -> gerarRespostaComandoVerCarrinho();
            default -> "Entendido! 😊";
        };
    }
    
    /**
     * Gera uma resposta amigável confirmando a adição ao carrinho.
     */
    private String gerarRespostaComandoAdicionar(AcaoChatDTO acao) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ótimo! Adicionei ");
        
        if (acao.quantidade() != null && acao.quantidade() > 1) {
            sb.append(acao.quantidade()).append("x ");
        }
        
        sb.append("**").append(acao.produtoNome()).append("** ao seu carrinho! 🛒");
        
        if (acao.observacao() != null && !acao.observacao().isBlank()) {
            sb.append("\n\n📝 Observação: *").append(acao.observacao()).append("*");
        }
        
        sb.append("\n\nDeseja mais alguma coisa? 😊");
        
        return sb.toString();
    }
    
    /**
     * Gera uma resposta amigável confirmando a remoção do carrinho.
     */
    private String gerarRespostaComandoRemover(AcaoChatDTO acao) {
        return "Pronto! Removi **" + acao.produtoNome() + "** do seu carrinho! 🗑️\n\nPosso ajudar com mais alguma coisa? 😊";
    }
    
    /**
     * Gera uma resposta amigável confirmando a limpeza do carrinho.
     */
    private String gerarRespostaComandoLimpar() {
        return "Carrinho limpo! 🗑️ Todos os itens foram removidos.\n\nQuer começar um novo pedido? Posso te ajudar a escolher! 😊";
    }
    
    /**
     * Gera uma resposta para ver o carrinho.
     * A resposta real com os itens será gerada pelo frontend, pois o carrinho está lá.
     */
    private String gerarRespostaComandoVerCarrinho() {
        return "Aqui está seu carrinho! 🛒";
    }
    
    // ============================================
    // MÉTODOS DE BUSCA INTELIGENTE DE PRODUTOS
    // ============================================
    
    /**
     * Obtém o cardápio, usando cache para evitar múltiplas chamadas
     */
    private CardapioContextDTO obterCardapio() {
        if (cardapioCache == null) {
            try {
                cardapioCache = cardapioContextPort.buscarCardapioParaIA();
                log.info("✅ Cardápio carregado com sucesso: {} produtos em {} categorias", 
                         cardapioCache.produtos().size(), cardapioCache.categorias().size());
                
                // Log dos produtos para debug
                if (log.isDebugEnabled()) {
                    cardapioCache.produtos().forEach(p -> 
                        log.debug("  Produto: {} - R$ {}", p.nome(), p.preco()));
                }
            } catch (Exception e) {
                log.error("❌ ERRO ao carregar cardápio: {}", e.getMessage(), e);
                return null;
            }
        }
        return cardapioCache;
    }
    
    /**
     * Adiciona contexto dos produtos encontrados ao prompt para a IA,
     * adaptando a instrução de acordo com o TIPO DE BUSCA.
     */
    private String adicionarContextoProdutosEncontrados(String promptBase, ResultadoBuscaDTO resultado) {
        if (!resultado.temResultados()) {
            return promptBase;
        }
        
        StringBuilder sb = new StringBuilder(promptBase);
        sb.append("\n\n");
        sb.append("╔══════════════════════════════════════════════════════════════════════════════╗\n");
        sb.append("║  🚨 PRODUTOS ENCONTRADOS - RESPONDA ADEQUADAMENTE AO CONTEXTO 🚨            ║\n");
        sb.append("╚══════════════════════════════════════════════════════════════════════════════╝\n\n");
        
        // Instrução específica por tipo de busca
        switch (resultado.tipo()) {
            case INGREDIENTE:
                sb.append("🥬 TIPO DE BUSCA: INGREDIENTE\n");
                sb.append("O cliente perguntou sobre produtos com '").append(resultado.termoBuscado()).append("'\n");
                sb.append("ENCONTRAMOS produtos que contêm este ingrediente!\n\n");
                sb.append("✅ RESPONDA ASSIM:\n");
                sb.append("   • 'Sim! Temos produtos com ").append(resultado.termoBuscado()).append("! Veja abaixo 👇'\n");
                sb.append("   • 'Claro! Encontrei opções com ").append(resultado.termoBuscado()).append(" pra você!'\n");
                break;
                
            case CATEGORIA:
                sb.append("📁 TIPO DE BUSCA: CATEGORIA\n");
                sb.append("O cliente perguntou sobre a categoria '").append(resultado.termoBuscado()).append("'\n\n");
                sb.append("✅ RESPONDA ASSIM:\n");
                sb.append("   • 'Aqui estão nossos ").append(resultado.termoBuscado()).append("! Clique pra pedir 🍔'\n");
                sb.append("   • 'Temos ótimas opções de ").append(resultado.termoBuscado()).append("! Veja abaixo!'\n");
                break;
                
            case NOME_PRODUTO:
                sb.append("🍔 TIPO DE BUSCA: PRODUTO ESPECÍFICO\n");
                sb.append("O cliente perguntou sobre o produto '").append(resultado.termoBuscado()).append("'\n\n");
                sb.append("✅ RESPONDA ASSIM:\n");
                sb.append("   • 'Encontrei! Clique no card para adicionar ao carrinho 🛒'\n");
                sb.append("   • 'Esse é uma ótima escolha! Veja os detalhes abaixo!'\n");
                break;
                
            case CARDAPIO_GERAL:
                sb.append("📋 TIPO DE BUSCA: CARDÁPIO GERAL\n");
                sb.append("O cliente quer ver opções do cardápio\n\n");
                sb.append("✅ RESPONDA ASSIM:\n");
                sb.append("   • 'Aqui estão algumas opções do nosso cardápio! 😊'\n");
                sb.append("   • 'Veja algumas sugestões! Clique para adicionar 🛒'\n");
                break;
                
            default:
                sb.append("✅ Produtos encontrados! Responda positivamente.\n");
        }
        
        sb.append("\n📦 PRODUTOS QUE SERÃO EXIBIDOS (NÃO LISTE, APENAS CONFIRME):\n");
        for (ProdutoContextDTO produto : resultado.produtos()) {
            sb.append("   ✅ ").append(produto.nome());
            if (produto.descricao() != null && !produto.descricao().isBlank()) {
                sb.append(" → ").append(produto.descricao());
            }
            sb.append("\n");
        }
        
        sb.append("\n⛔ NUNCA RESPONDA:\n");
        sb.append("   • 'Não temos...' ou 'Desculpe...' (ENCONTRAMOS!)\n");
        sb.append("   • 'Só posso ajudar...' (ESTA É pergunta sobre cardápio!)\n");
        sb.append("   • Listando preços ou detalhes (o card já mostra!)\n\n");
        
        return sb.toString();
    }
    
    /**
     * Converte ProdutoContextDTO para ProdutoDestacadoDTO (interno do ChatResponseDTO)
     */
    private ProdutoDestacadoDTO toProdutoDestacado(ProdutoContextDTO produto) {
        return new ProdutoDestacadoDTO(
            produto.id(),
            produto.nome(),
            produto.descricao(),
            produto.categoria(),
            produto.preco(),
            produto.imagemUrl(),
            produto.disponivel()
        );
    }
    
    // ============================================
    // CONSTRUÇÃO DO SYSTEM PROMPT
    // ============================================
    
    /**
     * Constrói o system prompt completo com:
     * - Instruções de comportamento
     * - Cardápio completo do estabelecimento
     * - Histórico de pedidos do cliente (se identificado)
     */
    private String construirSystemPromptCompleto(String clienteId, CardapioContextDTO cardapio) {
        StringBuilder sb = new StringBuilder();
        
        // Instruções base do assistente
        sb.append(construirInstrucoesBase());
        sb.append("\n\n");
        
        // Contexto do cardápio
        if (cardapio != null) {
            String descricaoCardapio = cardapio.gerarDescricaoParaIA();
            sb.append(descricaoCardapio);
            sb.append("\n\n");
            log.debug("Cardápio incluído: {} categorias e {} produtos", 
                     cardapio.categorias().size(), cardapio.produtos().size());
        } else {
            sb.append("=== CARDÁPIO INDISPONÍVEL ===\n");
            sb.append("Não foi possível carregar o cardápio. Informe ao cliente que está indisponível no momento.\n\n");
        }
        
        // Contexto do cliente (se identificado)
        if (clienteId != null && !clienteId.isBlank()) {
            try {
                HistoricoPedidosClienteContextDTO historicoCliente = 
                    pedidosClienteContextPort.buscarHistoricoPedidosCliente(clienteId);
                sb.append(historicoCliente.gerarDescricaoParaIA());
                log.debug("Histórico do cliente {} carregado: {} pedidos", clienteId, historicoCliente.totalPedidos());
            } catch (Exception e) {
                log.warn("Erro ao carregar histórico do cliente: {}", e.getMessage());
            }
        }
        
        String promptFinal = sb.toString();
        log.debug("System prompt construído com {} caracteres", promptFinal.length());
        
        return promptFinal;
    }
    
    private String construirInstrucoesBase() {
        return """
            Você é o assistente virtual do %s.
            
            ╔══════════════════════════════════════════════════════════════════╗
            ║                    REGRAS ABSOLUTAS - LEIA COM ATENÇÃO           ║
            ╠══════════════════════════════════════════════════════════════════╣
            ║ 1. VOCÊ SÓ PODE FALAR SOBRE PRODUTOS QUE ESTÃO NO CARDÁPIO ABAIXO║
            ║ 2. SE O PRODUTO NÃO ESTÁ LISTADO = ELE NÃO EXISTE                ║
            ║ 3. NUNCA INVENTE NOMES DE PRODUTOS, PREÇOS OU DESCRIÇÕES         ║
            ║ 4. USE APENAS OS DADOS EXATOS FORNECIDOS NO CARDÁPIO             ║
            ╚══════════════════════════════════════════════════════════════════╝
            
            INSTRUÇÕES DE RESPOSTA:
            
            QUANDO O CLIENTE PERGUNTAR SOBRE O CARDÁPIO:
            - Liste APENAS os produtos que aparecem na seção "CARDÁPIO OFICIAL" abaixo
            - Use os nomes EXATOS dos produtos como estão escritos
            - Use os preços EXATOS (não arredonde, não invente)
            - Não mencione produtos que não estão na lista
            
            QUANDO O CLIENTE PEDIR UM PRODUTO QUE NÃO EXISTE:
            - Responda: "Desculpe, não temos [nome do produto] no nosso cardápio."
            - Sugira alternativas que EXISTAM no cardápio abaixo
            
            QUANDO O CLIENTE PERGUNTAR ALGO FORA DO ESCOPO:
            - Responda: "Só posso ajudar com informações sobre nosso cardápio e pedidos."
            
            FORMATO DAS RESPOSTAS:
            - Use emojis ocasionalmente 😊🍔🥤
            - Seja conciso e direto
            - SEMPRE inclua o preço quando mencionar um produto
            - Incentive adicionar itens ao carrinho
            
            PROIBIDO:
            - Inventar produtos que não estão listados
            - Criar promoções ou combos imaginários
            - Mencionar preços diferentes dos listados
            - Falar sobre ingredientes que não estão descritos
            - Responder perguntas não relacionadas ao restaurante
            
            """.formatted(nomeEstabelecimento);
    }
}
