import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Produto } from '../../../services/produto.service';
import { firstValueFrom } from 'rxjs';

const CACHE_KEY = 'experimenta-ai-favoritos-cache';
const API_BASE = '/api/cliente/conta';

interface FavoritoResponse {
    id: string;
    clienteId: string;
    produtoId: string;
    createdAt: string;
}

/**
 * Composable para gerenciar produtos favoritos.
 *
 * FONTE DE VERDADE: MySQL (via API)
 * CACHE: localStorage (para exibição rápida enquanto carrega da API)
 *
 * Fluxo:
 * 1. Ao carregar: mostra cache imediatamente, busca da API e atualiza
 * 2. Ao adicionar/remover: atualiza API primeiro, depois atualiza cache
 * 3. Se API falhar: reverte estado e mostra erro
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
    const sincronizado = signal(false); // true quando dados vieram da API

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

    // ========== OPERAÇÕES COM API (fonte de verdade) ==========
    // Headers (Authorization e X-Cliente-Id) são adicionados automaticamente
    // pelo clienteAuthInterceptor

    /**
     * Adiciona produto aos favoritos.
     * Primeiro salva na API (MySQL), depois atualiza cache.
     */
    async function adicionar(produtoId: string): Promise<boolean> {
        const cliente = clienteId();
        if (!cliente) {
            erro.set('Cliente não identificado');
            return false;
        }

        // Estado otimista - mostra imediatamente
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
            // Reverte estado se API falhar
            favoritosIds.set(idsAntes);
            atualizarCache();
            erro.set('Erro ao adicionar favorito');
            console.error('Erro ao adicionar favorito:', e);
            return false;
        }
    }

    /**
     * Remove produto dos favoritos.
     * Primeiro remove da API (MySQL), depois atualiza cache.
     */
    async function remover(produtoId: string): Promise<boolean> {
        const cliente = clienteId();
        if (!cliente) {
            erro.set('Cliente não identificado');
            return false;
        }

        // Estado otimista - remove imediatamente
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
            // Reverte estado se API falhar
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
     * Carrega favoritos da API (MySQL - fonte de verdade).
     * Mostra cache imediatamente enquanto busca da API.
     */
    async function carregar(): Promise<void> {
        const cliente = clienteId();
        if (!cliente) return;

        // Mostra cache imediatamente para UX rápida
        carregarDoCache();

        carregando.set(true);
        erro.set(null);

        try {
            // Busca da API (fonte de verdade)
            const idsFromApi = await firstValueFrom(
                http.get<string[]>(`${API_BASE}/favoritos/ids`)
            );

            // Atualiza estado com dados da API
            favoritosIds.set(new Set(idsFromApi));
            sincronizado.set(true);

            // Atualiza cache com dados corretos da API
            atualizarCache();
        } catch (e) {
            // Se API falhar, mantém o cache (melhor que nada)
            console.error('Erro ao carregar favoritos da API:', e);
            erro.set('Erro ao sincronizar favoritos');
            sincronizado.set(false);
        } finally {
            carregando.set(false);
        }
    }

    /**
     * Força recarregar da API, ignorando cache.
     */
    async function recarregar(): Promise<void> {
        sincronizado.set(false);
        await carregar();
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

    function limparCache(): void {
        if (!isBrowser) return;

        const cliente = clienteId();
        if (!cliente) return;

        try {
            const key = `${CACHE_KEY}-${cliente}`;
            localStorage.removeItem(key);
        } catch {
            // Ignora
        }
    }

    // ========== OPERAÇÕES DE LIMPEZA ==========

    /**
     * Limpa todos os favoritos (remove da API e do cache).
     */
    async function limpar(): Promise<void> {
        const cliente = clienteId();
        if (!cliente) return;

        const idsAtuais = Array.from(favoritosIds());

        // Limpa estado e cache imediatamente
        favoritosIds.set(new Set());
        limparCache();

        // Remove da API
        for (const produtoId of idsAtuais) {
            try {
                await firstValueFrom(
                    http.delete(`${API_BASE}/favoritos/${produtoId}`)
                );
            } catch {
                // Continua tentando remover os outros
            }
        }
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
        recarregar,
        limpar
    };
}
