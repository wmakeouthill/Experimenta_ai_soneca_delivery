import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mesa } from './mesa.service';
import { Produto } from './produto.service';
import { Categoria } from './categoria.service';

/**
 * Gera uma chave de idempotência única para requisições.
 */
function generateIdempotencyKey(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export interface ItemPedidoMesaRequest {
    produtoId: string;
    quantidade: number;
    observacoes?: string;
    adicionais?: { adicionalId: string; quantidade: number }[];
}

export interface MeioPagamentoMesaRequest {
    meioPagamento: 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';
    valor: number;
}

export interface CriarPedidoMesaRequest {
    mesaToken: string;
    clienteId: string;
    nomeCliente: string;
    itens: ItemPedidoMesaRequest[];
    meiosPagamento?: MeioPagamentoMesaRequest[];
}

export interface PedidoMesaResponse {
    id: string;
    mesaId: string;
    nomeClienteMesa: string;
    status: string;
    itens: {
        produtoId: string;
        nomeProduto: string;
        quantidade: number;
        precoUnitario: number;
        observacao?: string;
    }[];
    total: number;
    createdAt: string;
}

export interface CardapioPublico {
    categorias: Categoria[];
    produtos: Produto[];
}

export interface ClientePublico {
    id: string;
    nome: string;
    telefone: string;
    fotoUrl?: string;
    temSenha?: boolean;
}

export interface CadastrarClienteRequest {
    nome: string;
    telefone: string;
}

export type StatusCliente =
    | 'AGUARDANDO_ACEITACAO'
    | 'ACEITO'
    | 'PREPARANDO'
    | 'PRONTO'
    | 'FINALIZADO'
    | 'CANCELADO';

export interface StatusPedidoCliente {
    pedidoId: string;
    status: StatusCliente;
    statusDescricao: string;
    numeroMesa?: number;
    dataHoraSolicitacao: string;
    tempoEsperaSegundos: number;
    numeroPedido?: number;
    motivoCancelamento?: string;
}

export interface AdicionalHistoricoPedido {
    adicionalId: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
}

export interface ItemHistoricoPedido {
    produtoId: string;
    nomeProduto: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
    adicionais?: AdicionalHistoricoPedido[];
}

export interface HistoricoPedidoCliente {
    id: string;
    numeroPedido: number;
    status: string;
    statusDescricao: string;
    dataHoraPedido: string;
    valorTotal: number;
    numeroMesa?: number;
    itens: ItemHistoricoPedido[];
}

export interface HistoricoPedidosResponse {
    pedidos: HistoricoPedidoCliente[];
    paginaAtual: number;
    totalPaginas: number;
    totalPedidos: number;
}

@Injectable({
    providedIn: 'root'
})
export class PedidoMesaService {
    private readonly http = inject(HttpClient);
    private readonly publicApiUrl = '/api/public/mesa';

    buscarMesa(token: string): Observable<Mesa> {
        return this.http.get<Mesa>(`${this.publicApiUrl}/${token}`);
    }

    buscarCardapio(token: string): Observable<CardapioPublico> {
        return this.http.get<CardapioPublico>(`${this.publicApiUrl}/${token}/cardapio`);
    }

    buscarClientePorTelefone(mesaToken: string, telefone: string): Observable<ClientePublico> {
        return this.http.get<ClientePublico>(`${this.publicApiUrl}/${mesaToken}/cliente/${telefone}`);
    }

    cadastrarCliente(mesaToken: string, request: CadastrarClienteRequest): Observable<ClientePublico> {
        return this.http.post<ClientePublico>(`${this.publicApiUrl}/${mesaToken}/cliente`, request);
    }

    /**
     * Cria um pedido via mesa (QR code).
     * Usa chave de idempotência para evitar duplicação em caso de retry.
     */
    criarPedido(request: CriarPedidoMesaRequest): Observable<PedidoMesaResponse> {
        const headers = new HttpHeaders({
            'X-Idempotency-Key': generateIdempotencyKey()
        });
        return this.http.post<PedidoMesaResponse>(`${this.publicApiUrl}/pedido`, request, { headers });
    }

    buscarStatusPedido(pedidoId: string): Observable<StatusPedidoCliente> {
        // Endpoint público de status não precisa de token; adicionamos bust de cache.
        const noCache = `t=${Date.now()}`;
        return this.http.get<StatusPedidoCliente>(`${this.publicApiUrl}/pedido/${pedidoId}/status?${noCache}`);
    }

    buscarStatusPedidoAutenticado(pedidoId: string): Observable<StatusPedidoCliente> {
        // Versão autenticada via /api/cliente para evitar 404 caso o público não exponha.
        const noCache = `t=${Date.now()}`;
        return this.http.get<StatusPedidoCliente>(`/api/cliente/mesa/pedido/${pedidoId}/status?${noCache}`);
    }

    /**
     * Busca histórico de pedidos do cliente.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    buscarHistoricoPedidos(clienteId: string, pagina: number, tamanho: number): Observable<HistoricoPedidosResponse> {
        return this.http.get<HistoricoPedidosResponse>(
            `/api/cliente/conta/pedidos?pagina=${pagina}&tamanho=${tamanho}`
        );
    }

    /**
     * Salva senha do cliente.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    salvarSenhaCliente(clienteId: string, novaSenha: string, senhaAtual?: string): Observable<void> {
        return this.http.put<void>(
            `/api/cliente/conta/senha`,
            { novaSenha, senhaAtual }
        );
    }

    /**
     * Avalia um produto de um pedido.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    avaliarProduto(
        clienteId: string,
        produtoId: string,
        pedidoId: string,
        nota: number,
        comentario?: string
    ): Observable<void> {
        return this.http.post<void>(
            `/api/cliente/conta/avaliacoes`,
            { produtoId, pedidoId, nota, comentario }
        );
    }

    /**
     * Busca avaliações do cliente.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    buscarAvaliacoesCliente(clienteId: string): Observable<{ produtoId: string; pedidoId: string; nota: number; comentario?: string }[]> {
        return this.http.get<{ produtoId: string; pedidoId: string; nota: number; comentario?: string }[]>(
            `/api/cliente/conta/avaliacoes`
        );
    }
}
