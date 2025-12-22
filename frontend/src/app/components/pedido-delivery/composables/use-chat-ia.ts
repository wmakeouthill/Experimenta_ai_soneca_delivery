import { signal, computed, inject } from '@angular/core';
import { ChatIAService, ChatIAResponse, ProdutoDestacado, AcaoChat, ConversaSalva as ConversaSalvaAPI, SalvarConversaDTO, TipoAcao } from '../../../services/chat-ia.service';

export interface MensagemChat {
    id: string;
    from: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    /** Produtos destacados na resposta (apenas mensagens do assistente) */
    produtosDestacados?: ProdutoDestacado[];
    /** Ação a ser executada (apenas mensagens do assistente) */
    acao?: AcaoChat;
}

/** Representa uma conversa salva no histórico */
export interface ConversaSalva {
    id: string;
    sessionId: string;
    titulo: string;
    dataInicio: Date;
    dataUltimaMensagem: Date;
    mensagens: MensagemChat[];
    previewUltimaMensagem: string;
}

export { ProdutoDestacado, AcaoChat, TipoAcao } from '../../../services/chat-ia.service';

const SESSION_KEY = 'delivery-chat-ia-session-id';
const MENSAGENS_KEY = 'delivery-chat-ia-mensagens';
const HISTORICO_KEY = 'delivery-chat-ia-historico';
const MAX_CONVERSAS_HISTORICO = 10;

/**
 * Gera ou recupera o sessionId do sessionStorage.
 */
function obterOuGerarSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
}

/**
 * Salva mensagens no sessionStorage.
 */
function salvarMensagens(mensagens: MensagemChat[]): void {
    const simplificadas = mensagens.map(m => ({
        id: m.id,
        from: m.from,
        text: m.text,
        timestamp: m.timestamp.toISOString(),
        produtosDestacados: m.produtosDestacados || []
    }));
    sessionStorage.setItem(MENSAGENS_KEY, JSON.stringify(simplificadas));
}

/**
 * Carrega mensagens do sessionStorage.
 */
function carregarMensagens(): MensagemChat[] {
    const saved = sessionStorage.getItem(MENSAGENS_KEY);
    if (!saved) return [];

    try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: { id: string; from: 'user' | 'assistant'; text: string; timestamp: string; produtosDestacados?: ProdutoDestacado[] }) => ({
            id: m.id,
            from: m.from,
            text: m.text,
            timestamp: new Date(m.timestamp),
            produtosDestacados: m.produtosDestacados || []
        }));
    } catch {
        return [];
    }
}

/**
 * Carrega o histórico de conversas do localStorage (persiste entre sessões).
 * Usado como fallback quando não há clienteId (usuário não logado).
 */
function carregarHistoricoLocal(clienteId: string | null | undefined): ConversaSalva[] {
    const key = clienteId ? `${HISTORICO_KEY}-${clienteId}` : HISTORICO_KEY;
    const saved = localStorage.getItem(key);
    if (!saved) return [];

    try {
        const parsed = JSON.parse(saved);
        return parsed.map((c: ConversaSalva & { dataInicio: string; dataUltimaMensagem: string; mensagens: Array<MensagemChat & { timestamp: string }> }) => ({
            ...c,
            dataInicio: new Date(c.dataInicio),
            dataUltimaMensagem: new Date(c.dataUltimaMensagem),
            mensagens: c.mensagens.map(m => ({
                ...m,
                timestamp: new Date(m.timestamp)
            }))
        }));
    } catch {
        return [];
    }
}

/**
 * Salva o histórico de conversas no localStorage.
 * Usado como fallback quando não há clienteId (usuário não logado).
 */
function salvarHistoricoLocal(clienteId: string | null | undefined, conversas: ConversaSalva[]): void {
    const key = clienteId ? `${HISTORICO_KEY}-${clienteId}` : HISTORICO_KEY;
    // Mantém apenas as últimas MAX_CONVERSAS_HISTORICO conversas
    const limitadas = conversas.slice(0, MAX_CONVERSAS_HISTORICO);
    localStorage.setItem(key, JSON.stringify(limitadas));
}

/**
 * Converte ConversaSalvaAPI (do backend) para ConversaSalva (local).
 */
function converterApiParaLocal(apiConversa: ConversaSalvaAPI): ConversaSalva {
    return {
        id: apiConversa.id,
        sessionId: apiConversa.sessionId,
        titulo: apiConversa.titulo,
        dataInicio: new Date(apiConversa.dataInicio),
        dataUltimaMensagem: new Date(apiConversa.dataUltimaMensagem),
        previewUltimaMensagem: apiConversa.previewUltimaMensagem,
        mensagens: apiConversa.mensagens.map(m => ({
            id: m.id,
            from: m.from,
            text: m.text,
            timestamp: new Date(m.timestamp)
        }))
    };
}

/**
 * Converte ConversaSalva (local) para SalvarConversaDTO (para API).
 */
function converterLocalParaDto(conversa: ConversaSalva): SalvarConversaDTO {
    return {
        sessionId: conversa.sessionId,
        titulo: conversa.titulo,
        previewUltimaMensagem: conversa.previewUltimaMensagem,
        dataInicio: conversa.dataInicio.toISOString(),
        dataUltimaMensagem: conversa.dataUltimaMensagem.toISOString(),
        mensagens: conversa.mensagens.map(m => ({
            id: m.id,
            from: m.from,
            text: m.text,
            timestamp: m.timestamp.toISOString()
        }))
    };
}

/**
 * Gera um título para a conversa baseado na primeira mensagem do usuário.
 */
function gerarTituloConversa(mensagens: MensagemChat[]): string {
    const primeiraMsgUsuario = mensagens.find(m => m.from === 'user');
    if (primeiraMsgUsuario) {
        const texto = primeiraMsgUsuario.text;
        return texto.length > 30 ? texto.substring(0, 30) + '...' : texto;
    }
    return 'Nova conversa';
}

/**
 * Composable para gerenciar o estado do Chat IA.
 * Fornece estado reativo e métodos para interação com o chat.
 * @param clienteIdGetter função que retorna o ID do cliente logado (opcional)
 * @param onAcaoExecutar callback para quando uma ação deve ser executada (ex: adicionar ao carrinho)
 */
export function useChatIA(
    clienteIdGetter?: () => string | null | undefined,
    onAcaoExecutar?: (acao: AcaoChat) => void
) {
    const chatService = inject(ChatIAService);

    // Estado
    const isOpen = signal(false);
    const isLoading = signal(false);
    const inputText = signal('');
    const mensagens = signal<MensagemChat[]>([]);
    const erro = signal<string | null>(null);
    const ultimaAcao = signal<AcaoChat | null>(null);
    const historicoConversas = signal<ConversaSalva[]>([]);
    const mostrarHistorico = signal(false);

    let sessionId = obterOuGerarSessionId();

    // ID da conversa carregada do histórico (para evitar duplicatas)
    let conversaHistoricoAtualId: string | null = null;

    // Computed
    const canSend = computed(() => inputText().trim().length > 0 && !isLoading());
    const carrinhoVazio = computed(() => mensagens().length <= 1); // Só mensagem inicial
    const temHistorico = computed(() => historicoConversas().length > 0);

    // Mensagem inicial de boas-vindas
    const mensagemInicial: MensagemChat = {
        id: 'initial',
        from: 'assistant',
        text: 'Olá! 👋 Sou o Soneca Delivery, seu assistente virtual. Como posso ajudar você hoje? Pode me perguntar sobre o cardápio, fazer sugestões de pedidos ou tirar qualquer dúvida!',
        timestamp: new Date()
    };

    /**
     * Inicializa o chat carregando mensagens salvas ou mensagem inicial.
     */
    function inicializar(): void {
        const salvas = carregarMensagens();
        console.log('[ChatIA Delivery] Inicializando. Salvas:', salvas.length);
        if (salvas.length > 0) {
            mensagens.set(salvas);
        } else {
            console.log('[ChatIA Delivery] Usando mensagem inicial');
            mensagens.set([mensagemInicial]);
        }
        // Carrega histórico de conversas (da API se logado, senão localStorage)
        carregarHistoricoConversas();
    }

    /**
     * Carrega o histórico de conversas da API (se logado) ou localStorage.
     */
    function carregarHistoricoConversas(): void {
        const clienteId = clienteIdGetter?.();

        if (clienteId) {
            // Usuário logado: carrega da API
            chatService.listarConversasSalvas(clienteId).subscribe({
                next: (conversas) => {
                    historicoConversas.set(conversas.map(converterApiParaLocal));
                },
                error: () => {
                    // Fallback para localStorage em caso de erro
                    historicoConversas.set(carregarHistoricoLocal(clienteId));
                }
            });
        } else {
            // Usuário não logado: usa localStorage
            historicoConversas.set(carregarHistoricoLocal(null));
        }
    }

    /**
     * Abre ou fecha o chat.
     */
    function toggleChat(): void {
        isOpen.update(v => !v);
        if (isOpen() && mensagens().length === 0) {
            mensagens.set([mensagemInicial]);
        }
    }

    /**
     * Abre o chat.
     */
    function abrirChat(): void {
        isOpen.set(true);
        if (mensagens().length === 0) {
            mensagens.set([mensagemInicial]);
        }
    }

    /**
     * Fecha o chat.
     */
    function fecharChat(): void {
        isOpen.set(false);
    }

    /**
     * Atualiza o texto de input.
     */
    function setInputText(value: string): void {
        inputText.set(value);
    }

    /**
     * Envia uma mensagem para o chat.
     */
    function enviarMensagem(): void {
        const text = inputText().trim();
        if (!text || isLoading()) return;

        // Adiciona mensagem do usuário
        const msgUsuario: MensagemChat = {
            id: crypto.randomUUID(),
            from: 'user',
            text,
            timestamp: new Date()
        };

        mensagens.update(msgs => [...msgs, msgUsuario]);
        inputText.set('');
        isLoading.set(true);
        erro.set(null);

        // Salva estado
        salvarMensagens(mensagens());

        // Obtém clienteId se disponível
        const clienteId = clienteIdGetter?.() ?? undefined;

        // Envia para o backend
        chatService.enviarMensagem(text, sessionId, clienteId).subscribe({
            next: (response: ChatIAResponse) => {
                // Debug: Verificar produtos destacados recebidos
                console.log('🤖 Chat IA Response:', {
                    reply: response.reply?.substring(0, 100) + '...',
                    produtosDestacados: response.produtosDestacados,
                    totalProdutos: response.produtosDestacados?.length || 0,
                    acao: response.acao
                });

                const msgAssistente: MensagemChat = {
                    id: crypto.randomUUID(),
                    from: 'assistant',
                    text: response.reply,
                    timestamp: new Date(),
                    produtosDestacados: response.produtosDestacados || [],
                    acao: response.acao
                };
                mensagens.update(msgs => [...msgs, msgAssistente]);
                salvarMensagens(mensagens());
                isLoading.set(false);

                // Se houver ação, executa o callback
                if (response.acao && response.acao.tipo !== 'NENHUMA') {
                    console.log('🛒 Executando ação:', response.acao);
                    ultimaAcao.set(response.acao);
                    onAcaoExecutar?.(response.acao);
                }
            },
            error: () => {
                erro.set('Erro ao enviar mensagem. Tente novamente.');
                isLoading.set(false);
            }
        });
    }

    /**
     * Salva a conversa atual no histórico antes de iniciar uma nova.
     * Se a conversa foi carregada do histórico, usa o ID existente para evitar duplicatas.
     */
    function salvarConversaAtualNoHistorico(): void {
        const msgs = mensagens();
        // Só salva se tiver mais que a mensagem inicial (houve interação)
        if (msgs.length <= 1) return;

        // Se é uma conversa carregada do histórico e não houve novas mensagens, não precisa salvar novamente
        if (conversaHistoricoAtualId) {
            const conversaExistente = historicoConversas().find(c => c.id === conversaHistoricoAtualId);
            if (conversaExistente && conversaExistente.mensagens.length === msgs.length) {
                // Não houve novas mensagens, não precisa salvar
                return;
            }
        }

        const clienteId = clienteIdGetter?.();

        // Usa o ID existente se for uma conversa do histórico, senão gera um novo
        const conversaId = conversaHistoricoAtualId || crypto.randomUUID();

        const conversaAtual: ConversaSalva = {
            id: conversaId,
            sessionId,
            titulo: gerarTituloConversa(msgs),
            dataInicio: msgs[0].timestamp,
            dataUltimaMensagem: msgs.at(-1)!.timestamp,
            mensagens: msgs,
            previewUltimaMensagem: msgs.at(-1)!.text.substring(0, 50) + (msgs.at(-1)!.text.length > 50 ? '...' : '')
        };

        if (clienteId) {
            // Usuário logado: salva na API
            const dto = converterLocalParaDto(conversaAtual);
            chatService.salvarConversa(clienteId, dto).subscribe({
                next: (conversaSalva) => {
                    if (conversaSalva) {
                        // Atualiza lista local com a resposta da API
                        const novaConversa = converterApiParaLocal(conversaSalva);
                        const historico = [novaConversa, ...historicoConversas().filter(c => c.id !== conversaSalva.id)].slice(0, MAX_CONVERSAS_HISTORICO);
                        historicoConversas.set(historico);
                    }
                },
                error: () => {
                    // Fallback: salva localmente em caso de erro
                    const historico = [conversaAtual, ...historicoConversas().filter(c => c.id !== conversaId)].slice(0, MAX_CONVERSAS_HISTORICO);
                    historicoConversas.set(historico);
                    salvarHistoricoLocal(clienteId, historico);
                }
            });
        } else {
            // Usuário não logado: salva no localStorage (remove duplicata se existir)
            const historico = [conversaAtual, ...historicoConversas().filter(c => c.id !== conversaId)].slice(0, MAX_CONVERSAS_HISTORICO);
            historicoConversas.set(historico);
            salvarHistoricoLocal(clienteId, historico);
        }
    }

    /**
     * Inicia uma nova conversa, salvando a atual no histórico.
     */
    function novaConversa(): void {
        // Salva conversa atual no histórico antes de limpar
        salvarConversaAtualNoHistorico();

        const sessionIdAntigo = sessionId;

        // Limpa frontend
        mensagens.set([mensagemInicial]);
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(MENSAGENS_KEY);

        // Gera novo sessionId
        sessionId = obterOuGerarSessionId();

        // Limpa referência de conversa do histórico (agora é uma nova conversa)
        conversaHistoricoAtualId = null;

        // Limpa backend
        chatService.limparHistorico(sessionIdAntigo).subscribe();

        salvarMensagens(mensagens());
        mostrarHistorico.set(false);
    }

    /**
     * Carrega uma conversa do histórico.
     */
    function carregarConversaDoHistorico(conversaId: string): void {
        const conversa = historicoConversas().find(c => c.id === conversaId);
        if (!conversa) return;

        // Salva conversa atual antes de trocar (se tiver interação)
        salvarConversaAtualNoHistorico();

        // Carrega a conversa selecionada
        mensagens.set(conversa.mensagens);
        sessionId = conversa.sessionId;

        // Guarda o ID da conversa carregada para evitar duplicatas
        conversaHistoricoAtualId = conversa.id;

        sessionStorage.setItem(SESSION_KEY, sessionId);
        salvarMensagens(mensagens());
        mostrarHistorico.set(false);
    }

    /**
     * Alterna a exibição do painel de histórico.
     */
    function toggleHistorico(): void {
        mostrarHistorico.update(v => !v);
    }

    /**
     * Remove uma conversa do histórico.
     */
    function removerDoHistorico(conversaId: string): void {
        const clienteId = clienteIdGetter?.();

        // Remove localmente imediatamente para feedback rápido
        const novoHistorico = historicoConversas().filter(c => c.id !== conversaId);
        historicoConversas.set(novoHistorico);

        if (clienteId) {
            // Usuário logado: remove na API
            chatService.removerConversa(clienteId, conversaId).subscribe({
                error: () => {
                    // Em caso de erro, recarrega o histórico da API
                    carregarHistoricoConversas();
                }
            });
        } else {
            // Usuário não logado: atualiza localStorage
            salvarHistoricoLocal(clienteId, novoHistorico);
        }
    }

    /**
     * Adiciona uma mensagem do assistente localmente (sem chamar o backend).
     * Útil para respostas que não precisam de processamento do servidor,
     * como mostrar o conteúdo do carrinho.
     */
    function adicionarMensagemLocal(texto: string): void {
        const msgAssistente: MensagemChat = {
            id: crypto.randomUUID(),
            from: 'assistant',
            text: texto,
            timestamp: new Date()
        };
        mensagens.update(msgs => [...msgs, msgAssistente]);
        salvarMensagens(mensagens());
    }

    return {
        // Estado
        isOpen,
        isLoading,
        inputText,
        mensagens,
        erro,
        ultimaAcao,
        historicoConversas,
        mostrarHistorico,

        // Computed
        canSend,
        carrinhoVazio,
        temHistorico,

        // Métodos
        inicializar,
        toggleChat,
        abrirChat,
        fecharChat,
        setInputText,
        enviarMensagem,
        novaConversa,
        adicionarMensagemLocal,
        toggleHistorico,
        carregarConversaDoHistorico,
        removerDoHistorico
    };
}

export type ChatIAComposable = ReturnType<typeof useChatIA>;
