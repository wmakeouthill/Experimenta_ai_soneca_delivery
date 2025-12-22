import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Produto } from '../../../services/produto.service';
import { firstValueFrom } from 'rxjs';

const CACHE_KEY = 'experimenta-ai-favoritos-delivery';
const API_BASE = '/api/cliente/conta';

interface FavoritoResponse {
    id: string;
    clienteId: string;
    produtoId: string;
    createdAt: string;
}

/**
 * Composable para gerenciar produtos favoritos no delivery.
 *
 * FONTE DE VERDADE: MySQL (via API)
 * CACHE: localStorage (para exibição rápida enquanto carrega da API)
 */
export function useFavoritos(
    clienteId: () => string | undefined,
    produtos: () => Produto[]
) {
    const platformId = inject(PLATFORM_ID);
    const http = inject(HttpClient);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado
    const favoritosIds = signal<Set<string>>(new Set());
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const sincronizado = signal(false);

    // Computed: Lista de produtos favoritos
    const produtosFavoritos = computed(() => {
        const ids = favoritosIds();
        const todosProdutos = produtos();
        return todosProdutos.filter(p => ids.has(p.id));
    });

    const quantidadeFavoritos = computed(() => favoritosIds().size);

    // Verifica se um produto é favorito
    function isFavorito(produtoId: string): boolean {
        return favoritosIds().has(produtoId);
    }

    /**
     * Adiciona produto aos favoritos.
     */
    async function adicionar(produtoId: string): Promise<boolean> {
        const cliente = clienteId();
        if (!cliente) {
            erro.set('Cliente não identificado');
            return false;
        }

        // Estado otimista
        const idsAntes = new Set(favoritosIds());
        const novoIds = new Set(idsAntes);
        novoIds.add(produtoId);
        favoritosIds.set(novoIds);
        atualizarCache();

        try {
            await firstValueFrom(
                http.post<FavoritoResponse>(
                    `${API_BASE}/favoritos`,
                    { produtoId }
                )
            );
            erro.set(null);
            return true;
        } catch (e) {
            favoritosIds.set(idsAntes);
            atualizarCache();
            erro.set('Erro ao adicionar favorito');
            console.error('Erro ao adicionar favorito:', e);
            return false;
        }
    }

    /**
     * Remove produto dos favoritos.
     */
    async function remover(produtoId: string): Promise<boolean> {
        const cliente = clienteId();
        if (!cliente) {
            erro.set('Cliente não identificado');
            return false;
        }

        const idsAntes = new Set(favoritosIds());
        const novoIds = new Set(idsAntes);
        novoIds.delete(produtoId);
        favoritosIds.set(novoIds);
        atualizarCache();

        try {
            await firstValueFrom(
                http.delete(`${API_BASE}/favoritos/${produtoId}`)
            );
            erro.set(null);
            return true;
        } catch (e) {
            favoritosIds.set(idsAntes);
            atualizarCache();
            erro.set('Erro ao remover favorito');
            console.error('Erro ao remover favorito:', e);
            return false;
        }
    }

    /**
     * Toggle favorito - adiciona se não é, remove se já é.
     */
    async function toggle(produtoId: string): Promise<boolean> {
        if (isFavorito(produtoId)) {
            return await remover(produtoId);
        } else {
            return await adicionar(produtoId);
        }
    }

    /**
     * Carrega favoritos da API.
     */
    async function carregar(): Promise<void> {
        const cliente = clienteId();
        if (!cliente) return;

        carregarDoCache();
        carregando.set(true);
        erro.set(null);

        try {
            const idsFromApi = await firstValueFrom(
                http.get<string[]>(`${API_BASE}/favoritos/ids`)
            );

            favoritosIds.set(new Set(idsFromApi));
            sincronizado.set(true);
            atualizarCache();
        } catch (e) {
            console.error('Erro ao carregar favoritos da API:', e);
            erro.set('Erro ao sincronizar favoritos');
            sincronizado.set(false);
        } finally {
            carregando.set(false);
        }
    }

    // ========== CACHE (localStorage) ==========

    function carregarDoCache(): void {
        if (!isBrowser) return;

        const cliente = clienteId();
        if (!cliente) return;

        try {
            const key = `${CACHE_KEY}-${cliente}`;
            const cached = localStorage.getItem(key);
            if (cached) {
                const ids = JSON.parse(cached) as string[];
                favoritosIds.set(new Set(ids));
            }
        } catch {
            // Cache inválido, ignora
        }
    }

    function atualizarCache(): void {
        if (!isBrowser) return;

        const cliente = clienteId();
        if (!cliente) return;

        try {
            const key = `${CACHE_KEY}-${cliente}`;
            const ids = Array.from(favoritosIds());
            localStorage.setItem(key, JSON.stringify(ids));
        } catch {
            // Erro de storage, ignora
        }
    }

    function limpar(): void {
        favoritosIds.set(new Set());
    }

    return {
        // Estado
        favoritosIds: favoritosIds.asReadonly(),
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        sincronizado: sincronizado.asReadonly(),

        // Computed
        produtosFavoritos,
        quantidadeFavoritos,

        // Ações
        isFavorito,
        adicionar,
        remover,
        toggle,
        carregar,
        limpar
    };
}
