import { signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Produto } from '../../../services/produto.service';

export interface ProdutoPopular extends Produto {
    quantidadeVendida?: number;
    quantidadeFavoritos?: number;
    mediaAvaliacao?: number;
    totalAvaliacoes?: number;
}

/**
 * Composable para gerenciar a aba Início do delivery.
 * Carrega produtos populares e bem avaliados.
 */
export function useInicio(
    getClienteId: () => string | undefined,
    getProdutosFavoritos: () => Produto[],
    getTodosProdutos: () => Produto[]
) {
    const http = inject(HttpClient);

    // Estado
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const produtosMaisPedidos = signal<ProdutoPopular[]>([]);
    const produtosMaisFavoritados = signal<ProdutoPopular[]>([]);
    const produtosBemAvaliados = signal<ProdutoPopular[]>([]);

    // Computed
    const temFavoritos = computed(() => getProdutosFavoritos().length > 0);
    const temMaisFavoritados = computed(() => produtosMaisFavoritados().length > 0);

    /**
     * Carrega os produtos populares da API
     */
    async function carregar(): Promise<void> {
        carregando.set(true);
        erro.set(null);

        try {
            await Promise.all([
                carregarMaisPedidos(),
                carregarMaisFavoritados(),
                carregarBemAvaliados()
            ]);
        } catch (e) {
            console.error('Erro ao carregar produtos populares:', e);
            erro.set('Erro ao carregar produtos');
        } finally {
            carregando.set(false);
        }
    }

    async function carregarMaisPedidos(): Promise<void> {
        try {
            const produtos = await firstValueFrom(http.get<ProdutoPopular[]>(
                `/api/public/delivery/produtos/mais-pedidos?limite=8`
            ));

            produtosMaisPedidos.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-pedidos não disponível, usando fallback');
            // Fallback: 8 primeiros
            const todos = getTodosProdutos();
            produtosMaisPedidos.set(todos.slice(0, 8));
        }
    }

    async function carregarMaisFavoritados(): Promise<void> {
        try {
            const produtos = await firstValueFrom(http.get<ProdutoPopular[]>(
                `/api/public/delivery/produtos/mais-favoritados?limite=20`
            ));

            produtosMaisFavoritados.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-favoritados não disponível, usando fallback');
            // Fallback: aleatorizar ou offset
            const todos = getTodosProdutos();
            // Pegar do final para diferenciar
            const start = Math.max(0, todos.length - 8);
            produtosMaisFavoritados.set(todos.slice(start));
        }
    }

    async function carregarBemAvaliados(): Promise<void> {
        try {
            const produtos = await firstValueFrom(http.get<ProdutoPopular[]>(
                `/api/public/delivery/produtos/bem-avaliados?limite=8`
            ));

            produtosBemAvaliados.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint bem-avaliados não disponível, usando fallback');
            // Fallback: slice do meio
            const todos = getTodosProdutos();
            const meio = Math.floor(todos.length / 2);
            const fim = Math.min(meio + 8, todos.length);
            produtosBemAvaliados.set(todos.slice(meio, fim));
        }
    }

    return {
        // Estado (readonly)
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        produtosMaisPedidos: produtosMaisPedidos.asReadonly(),
        produtosMaisFavoritados: produtosMaisFavoritados.asReadonly(),
        produtosBemAvaliados: produtosBemAvaliados.asReadonly(),
        temFavoritos,
        temMaisFavoritados,

        // Ações
        carregar
    };
}
