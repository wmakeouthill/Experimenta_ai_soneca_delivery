import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatIARequest {
    message: string;
    sessionId?: string;
    clienteId?: string;
}

/** Mensagem individual de uma conversa salva */
export interface MensagemConversa {
    id: string;
    from: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

/** Conversa salva no histórico */
export interface ConversaSalva {
    id: string;
    sessionId: string;
    titulo: string;
    previewUltimaMensagem: string;
    dataInicio: string;
    dataUltimaMensagem: string;
    mensagens: MensagemConversa[];
}

/** DTO para salvar uma conversa */
export interface SalvarConversaDTO {
    sessionId: string;
    titulo: string;
    previewUltimaMensagem: string;
    dataInicio: string;
    dataUltimaMensagem: string;
    mensagens: MensagemConversa[];
}

export interface ProdutoDestacado {
    id: string;
    nome: string;
    descricao: string;
    categoria: string;
    preco: number;
    imagemUrl: string;
    disponivel: boolean;
}

/** Tipos de ação que o chat pode executar */
export type TipoAcao = 'ADICIONAR_CARRINHO' | 'REMOVER_CARRINHO' | 'LIMPAR_CARRINHO' | 'VER_CARRINHO' | 'VER_DETALHES' | 'FINALIZAR_PEDIDO' | 'NENHUMA';

/** Ação executável retornada pelo chat */
export interface AcaoChat {
    tipo: TipoAcao;
    produtoId: string | null;
    produtoNome: string | null;
    quantidade: number | null;
    observacao: string | null;
}

export interface ChatIAResponse {
    reply: string;
    produtosDestacados?: ProdutoDestacado[];
    acao?: AcaoChat;
}

/**
 * Service para comunicação com o Chat IA backend.
 * Gerencia envio de mensagens e histórico via sessionId.
 * Suporta respostas ricas com cards de produtos.
 */
@Injectable({
    providedIn: 'root'
})
export class ChatIAService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/chat-ia`;

    /**
     * Envia uma mensagem para o Chat IA e recebe a resposta.
     * 
     * @param mensagem texto da mensagem do usuário
     * @param sessionId identificador opcional da sessão para manter contexto
     * @param clienteId identificador opcional do cliente para personalização
     * @returns Observable com a resposta do assistente
     */
    enviarMensagem(mensagem: string, sessionId?: string, clienteId?: string): Observable<ChatIAResponse> {
        const body: ChatIARequest = {
            message: mensagem,
            clienteId: clienteId
        };

        let headers = new HttpHeaders();
        if (sessionId) {
            headers = headers.set('X-Session-ID', sessionId);
        }

        return this.http.post<ChatIAResponse>(this.apiUrl, body, { headers }).pipe(
            catchError(error => {
                console.error('Erro ao enviar mensagem para Chat IA:', error);
                return of({ reply: 'Desculpe, ocorreu um erro. Tente novamente.', produtosDestacados: [] });
            })
        );
    }

    /**
     * Limpa o histórico de mensagens no backend para a sessão especificada.
     * 
     * @param sessionId identificador da sessão
     * @returns Observable<void>
     */
    limparHistorico(sessionId?: string): Observable<void> {
        let headers = new HttpHeaders();
        if (sessionId) {
            headers = headers.set('X-Session-ID', sessionId);
        }

        return this.http.post<void>(`${this.apiUrl}/clear`, {}, { headers }).pipe(
            catchError(error => {
                console.error('Erro ao limpar histórico:', error);
                return of(undefined);
            })
        );
    }

    // ==================== MÉTODOS DE HISTÓRICO DE CONVERSAS ====================

    /**
     * Lista as últimas conversas salvas de um cliente.
     * 
     * @param clienteId identificador do cliente
     * @returns Observable com lista de conversas
     */
    listarConversasSalvas(clienteId: string): Observable<ConversaSalva[]> {
        return this.http.get<ConversaSalva[]>(`${this.apiUrl}/historico/${clienteId}`).pipe(
            catchError(error => {
                console.error('Erro ao listar conversas:', error);
                return of([]);
            })
        );
    }

    /**
     * Salva uma conversa no histórico do cliente.
     * 
     * @param clienteId identificador do cliente
     * @param conversa dados da conversa a salvar
     * @returns Observable com a conversa salva
     */
    salvarConversa(clienteId: string, conversa: SalvarConversaDTO): Observable<ConversaSalva | null> {
        return this.http.post<ConversaSalva>(`${this.apiUrl}/historico/${clienteId}`, conversa).pipe(
            catchError(error => {
                console.error('Erro ao salvar conversa:', error);
                return of(null);
            })
        );
    }

    /**
     * Busca uma conversa específica pelo ID.
     * 
     * @param clienteId identificador do cliente
     * @param conversaId identificador da conversa
     * @returns Observable com a conversa ou null
     */
    buscarConversa(clienteId: string, conversaId: string): Observable<ConversaSalva | null> {
        return this.http.get<ConversaSalva>(`${this.apiUrl}/historico/${clienteId}/${conversaId}`).pipe(
            catchError(error => {
                console.error('Erro ao buscar conversa:', error);
                return of(null);
            })
        );
    }

    /**
     * Remove uma conversa do histórico.
     * 
     * @param clienteId identificador do cliente
     * @param conversaId identificador da conversa
     * @returns Observable<boolean> indicando sucesso
     */
    removerConversa(clienteId: string, conversaId: string): Observable<boolean> {
        return this.http.delete(`${this.apiUrl}/historico/${clienteId}/${conversaId}`, { observe: 'response' }).pipe(
            map(response => response.status === 204),
            catchError(error => {
                console.error('Erro ao remover conversa:', error);
                return of(false);
            })
        );
    }
}
