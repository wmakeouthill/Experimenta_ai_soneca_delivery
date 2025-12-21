import { signal, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Produto } from '../../../services/produto.service';

export interface ProdutoPopular extends Produto {
    quantidadeVendida?: number;
    quantidadeFavoritos?: number;
    mediaAvaliacao?: number;
    totalAvaliacoes?: number;
}

/**
 * Composable para gerenciar a aba Início.
 * Responsabilidade única: carrossel de produtos populares e bem avaliados.
 */
export function useInicio(
    getMesaToken: () => string | undefined,
    getClienteId: () => string | undefined,
    getProdutosFavoritos: () => Produto[]
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
     * Executa todas as chamadas em paralelo para melhor performance
     */
    async function carregar(): Promise<void> {
        const token = getMesaToken();
        if (!token) return;

        carregando.set(true);
        erro.set(null);

        try {
            // Carregar TODAS as categorias em paralelo (muito mais rápido!)
            await Promise.all([
                carregarMaisPedidos(token),
                carregarMaisFavoritados(token),
                carregarBemAvaliados(token)
            ]);
        } catch (e) {
            console.error('Erro ao carregar produtos populares:', e);
            erro.set('Erro ao carregar produtos');
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Carrega os produtos mais pedidos (geral)
     */
    async function carregarMaisPedidos(token: string): Promise<void> {
        try {
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/public/mesa/${token}/produtos/mais-pedidos?limite=8`
            ).toPromise();

            produtosMaisPedidos.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-pedidos não disponível');
            produtosMaisPedidos.set([]);
        }
    }

    /**
     * Carrega os produtos mais favoritados (geral)
     */
    async function carregarMaisFavoritados(token: string): Promise<void> {
        try {
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/public/mesa/${token}/produtos/mais-favoritados?limite=20`
            ).toPromise();

            produtosMaisFavoritados.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-favoritados não disponível');
            produtosMaisFavoritados.set([]);
        }
    }

    /**
     * Carrega os produtos mais bem avaliados
     */
    async function carregarBemAvaliados(token: string): Promise<void> {
        try {
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/public/mesa/${token}/produtos/bem-avaliados?limite=8`
            ).toPromise();

            produtosBemAvaliados.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint bem-avaliados não disponível');
            produtosBemAvaliados.set([]);
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
