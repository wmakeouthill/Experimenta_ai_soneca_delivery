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
 * Composable para gerenciar a aba Início do delivery.
 * Carrega produtos populares e bem avaliados.
 */
export function useInicio(
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
     */
    async function carregar(): Promise<void> {
        const clienteId = getClienteId();
        if (!clienteId) return;

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
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/delivery/produtos/mais-pedidos?limite=8`
            ).toPromise();

            produtosMaisPedidos.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-pedidos não disponível');
            produtosMaisPedidos.set([]);
        }
    }

    async function carregarMaisFavoritados(): Promise<void> {
        try {
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/delivery/produtos/mais-favoritados?limite=20`
            ).toPromise();

            produtosMaisFavoritados.set(produtos || []);
        } catch (e) {
            console.warn('Endpoint mais-favoritados não disponível');
            produtosMaisFavoritados.set([]);
        }
    }

    async function carregarBemAvaliados(): Promise<void> {
        try {
            const produtos = await http.get<ProdutoPopular[]>(
                `${environment.apiUrl}/delivery/produtos/bem-avaliados?limite=8`
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
