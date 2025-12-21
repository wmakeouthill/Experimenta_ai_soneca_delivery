import { signal, computed, inject } from '@angular/core';
import { PedidoMesaService } from '../../../services/pedido-mesa.service';
import { Produto } from '../../../services/produto.service';
import { Categoria } from '../../../services/categoria.service';
import { firstValueFrom } from 'rxjs';

export interface GrupoCategoria {
    id: string;
    nome: string;
    produtos: Produto[];
}

/**
 * Composable para gerenciar o cardápio.
 * Responsabilidade única: carregar e filtrar categorias/produtos.
 */
export function useCardapio(mesaToken: () => string | undefined) {
    const pedidoMesaService = inject(PedidoMesaService);

    // Estado
    const categorias = signal<Categoria[]>([]);
    const produtos = signal<Produto[]>([]);
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const categoriaSelecionada = signal<string | null>(null);

    // Computed
    const produtosFiltrados = computed(() => {
        const categoria = categoriaSelecionada();
        const todosProdutos = produtos();

        if (!categoria) return todosProdutos;
        return todosProdutos.filter(p => p.categoria === categoria);
    });

    const produtosAgrupadosPorCategoria = computed((): GrupoCategoria[] => {
        const produtosFiltro = produtosFiltrados();
        const categoriasAtivas = categorias();

        const grupos: GrupoCategoria[] = [];

        for (const cat of categoriasAtivas) {
            const produtosDaCategoria = produtosFiltro.filter(p => p.categoria === cat.nome);
            if (produtosDaCategoria.length > 0) {
                grupos.push({
                    id: cat.id,
                    nome: cat.nome,
                    produtos: produtosDaCategoria
                });
            }
        }

        return grupos;
    });

    // Ações
    async function carregar(): Promise<void> {
        const token = mesaToken();
        if (!token) return;

        carregando.set(true);
        erro.set(null);

        try {
            const cardapio = await firstValueFrom(pedidoMesaService.buscarCardapio(token));
            categorias.set(cardapio.categorias.filter(c => c.ativa));
            produtos.set(cardapio.produtos.filter(p => p.disponivel));
        } catch (e) {
            erro.set('Erro ao carregar o cardápio');
            console.error('Erro ao carregar cardápio:', e);
        } finally {
            carregando.set(false);
        }
    }

    function selecionarCategoria(categoriaId: string | null): void {
        categoriaSelecionada.set(categoriaId);
    }

    return {
        // Estado
        categorias: categorias.asReadonly(),
        produtos: produtos.asReadonly(),
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        categoriaSelecionada: categoriaSelecionada.asReadonly(),

        // Computed
        produtosFiltrados,
        produtosAgrupadosPorCategoria,

        // Ações
        carregar,
        selecionarCategoria
    };
}
