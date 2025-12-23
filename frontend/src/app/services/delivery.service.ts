import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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

export type TipoPedido = 'DELIVERY' | 'RETIRADA';

export interface ItemPedidoDeliveryRequest {
    produtoId: string;
    quantidade: number;
    observacoes?: string;
    adicionais?: { adicionalId: string; nomeAdicional?: string; quantidade: number; precoUnitario?: number }[];
}

export interface MeioPagamentoDeliveryRequest {
    meioPagamento: 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';
    valor: number;
    trocoPara?: number;
}

export interface CriarPedidoDeliveryRequest {
    clienteId?: string;
    nomeCliente: string;
    telefoneCliente: string;
    emailCliente?: string;
    itens: ItemPedidoDeliveryRequest[];
    meiosPagamento?: MeioPagamentoDeliveryRequest[];
    tipoPedido: TipoPedido;
    enderecoEntrega?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    pontoReferencia?: string;
    taxaEntrega?: number;
    valorDesconto?: number;
    meioPagamento?: string;
    trocoPara?: number;
    observacoes?: string;
}

export interface PedidoDeliveryResponse {
    id: string;
    numeroPedido: string;
    nomeCliente: string;
    telefoneCliente: string;
    tipoPedido: TipoPedido;
    enderecoEntrega?: string;
    status: string;
    total: number;
    previsaoEntrega?: string;
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
    | 'SAIU_PARA_ENTREGA'
    | 'ENTREGUE'
    | 'FINALIZADO'
    | 'CANCELADO';

export interface StatusPedidoDelivery {
    pedidoId: string;
    status: StatusCliente;
    statusDescricao: string;
    tipoPedido: TipoPedido;
    enderecoEntrega?: string;
    dataHoraSolicitacao: string;
    tempoEsperaSegundos: number;
    numeroPedido?: number;
    motivoCancelamento?: string;
    nomeMotoboyAtribuido?: string;
    telefoneMotoboyAtribuido?: string;
    taxaEntrega?: number;
    previsaoEntrega?: string;
    total?: number;
    itens?: any[];
}

export interface ConfiguracaoDelivery {
    deliveryHabilitado: boolean;
    retiradaHabilitada: boolean;
    horarioFuncionamento: {
        abertura: string;
        fechamento: string;
    };
    tempoMinimoPrevisao: number; // minutos
    tempoMaximoPrevisao: number; // minutos
}

@Injectable({
    providedIn: 'root'
})
export class DeliveryService {
    private readonly http = inject(HttpClient);
    private readonly publicApiUrl = '/api/public/delivery';

    /**
     * Busca o cardápio público para delivery.
     */
    buscarCardapio(): Observable<CardapioPublico> {
        return this.http.get<CardapioPublico>(`${this.publicApiUrl}/cardapio`);
    }

    /**
     * Busca configuração de delivery do estabelecimento.
     */
    buscarConfiguracao(): Observable<ConfiguracaoDelivery> {
        return this.http.get<ConfiguracaoDelivery>(`${this.publicApiUrl}/configuracao`);
    }

    /**
     * Busca cliente por telefone.
     */
    buscarClientePorTelefone(telefone: string): Observable<ClientePublico> {
        return this.http.get<ClientePublico>(`${this.publicApiUrl}/cliente/${telefone}`);
    }

    /**
     * Cadastra novo cliente para delivery.
     */
    cadastrarCliente(request: CadastrarClienteRequest): Observable<ClientePublico> {
        return this.http.post<ClientePublico>(`${this.publicApiUrl}/cliente`, request);
    }

    /**
     * Cria um pedido de delivery/retirada.
     * Usa chave de idempotência para evitar duplicação em caso de retry.
     */
    criarPedido(request: CriarPedidoDeliveryRequest): Observable<PedidoDeliveryResponse> {
        const headers = new HttpHeaders({
            'X-Idempotency-Key': generateIdempotencyKey()
        });
        return this.http.post<PedidoDeliveryResponse>(`${this.publicApiUrl}/pedido`, request, { headers });
    }

    /**
     * Busca status do pedido de delivery.
     */
    buscarStatusPedido(pedidoId: string): Observable<StatusPedidoDelivery> {
        const noCache = `t=${Date.now()}`;
        return this.http.get<StatusPedidoDelivery>(`${this.publicApiUrl}/pedido/${pedidoId}/status?${noCache}`);
    }

    /**
     * Busca histórico de pedidos do cliente logado.
     */
    buscarHistoricoPedidos(pagina: number = 0, limite: number = 10): Observable<Page<StatusPedidoDelivery>> {
        return this.http.get<Page<StatusPedidoDelivery>>(`/api/cliente/conta/pedidos?page=${pagina}&size=${limite}`);
    }

    /**
     * Avalia um produto de um pedido.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    avaliarProduto(
        produtoId: string,
        pedidoId: string,
        nota: number,
        comentario?: string
    ): Observable<AvaliacaoResponse> {
        return this.http.post<AvaliacaoResponse>(
            `/api/cliente/conta/avaliacoes`,
            { produtoId, pedidoId, nota, comentario }
        );
    }

    /**
     * Busca avaliações do cliente logado.
     * Headers são adicionados automaticamente pelo clienteAuthInterceptor
     */
    buscarAvaliacoesCliente(): Observable<AvaliacaoResponse[]> {
        return this.http.get<AvaliacaoResponse[]>(`/api/cliente/conta/avaliacoes`);
    }
}

export interface AvaliacaoResponse {
    id: string;
    clienteId: string;
    produtoId: string;
    pedidoId: string;
    nota: number;
    comentario?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Page<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number; // Correção: size
    // outros campos se necessário
}
