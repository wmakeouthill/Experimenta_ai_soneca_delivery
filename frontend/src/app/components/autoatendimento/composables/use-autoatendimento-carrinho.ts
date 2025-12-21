import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Produto } from '../../../services/produto.service';
import { Adicional } from '../../../services/adicional.service';

const CARRINHO_TOTEM_STORAGE_KEY = 'autoatendimento-carrinho';

export interface ItemAdicionalTotem {
    adicional: Adicional;
    quantidade: number;
}

export interface ItemCarrinhoTotem {
    produto: Produto;
    quantidade: number;
    observacao: string;
    adicionais: ItemAdicionalTotem[];
}

/**
 * Composable para gerenciar o carrinho do auto atendimento.
 * Responsabilidade única: adicionar, remover e controlar itens do carrinho.
 * Usa sessionStorage para manter o carrinho durante a sessão do totem.
 */
export function useAutoAtendimentoCarrinho() {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Restaura carrinho do sessionStorage
    function restaurarCarrinho(): ItemCarrinhoTotem[] {
        if (!isBrowser) return [];
        try {
            const stored = sessionStorage.getItem(CARRINHO_TOTEM_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as ItemCarrinhoTotem[];
            }
        } catch {
            // Ignora erros de parse
        }
        return [];
    }

    // Persiste carrinho no sessionStorage
    function persistirCarrinho(items: ItemCarrinhoTotem[]): void {
        if (!isBrowser) return;
        try {
            sessionStorage.setItem(CARRINHO_TOTEM_STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Ignora erros de storage
        }
    }

    // Estado
    const itens = signal<ItemCarrinhoTotem[]>(restaurarCarrinho());
    const produtoSelecionado = signal<Produto | null>(null);
    const quantidadeTemp = signal(1);
    const _observacaoTemp = signal('');
    const mostrarDetalhes = signal(false);
    const mostrarCarrinho = signal(false);

    // Estado para adicionais
    const adicionaisDisponiveis = signal<Adicional[]>([]);
    const adicionaisSelecionados = signal<ItemAdicionalTotem[]>([]);
    const carregandoAdicionais = signal(false);
    const adicionaisExpandido = signal(false);

    // Computed
    const totalItens = computed(() =>
        itens().reduce((total, item) => total + item.quantidade, 0)
    );

    const totalValor = computed(() =>
        itens().reduce((total, item) => {
            let subtotal = item.produto.preco * item.quantidade;
            if (item.adicionais && item.adicionais.length > 0) {
                subtotal += item.adicionais.reduce((acc, ad) =>
                    acc + (ad.adicional.preco * ad.quantidade * item.quantidade), 0);
            }
            return total + subtotal;
        }, 0)
    );

    const subtotalAdicionais = computed(() => {
        return adicionaisSelecionados().reduce((acc, ad) =>
            acc + (ad.adicional.preco * ad.quantidade), 0);
    });

    const precoTotalItemModal = computed(() => {
        const produto = produtoSelecionado();
        if (!produto) return 0;
        const precoBase = produto.preco + subtotalAdicionais();
        return precoBase * quantidadeTemp();
    });

    const carrinhoVazio = computed(() => itens().length === 0);

    const podeEnviarPedido = computed(() => itens().length > 0);

    // Getters/Setters
    function getObservacao(): string {
        return _observacaoTemp();
    }

    function setObservacao(value: string): void {
        _observacaoTemp.set(value);
    }

    // Ações
    function abrirDetalhes(produto: Produto): void {
        produtoSelecionado.set(produto);
        quantidadeTemp.set(1);
        _observacaoTemp.set('');
        adicionaisSelecionados.set([]);
        adicionaisExpandido.set(false);

        const itemExistente = itens().find(item => item.produto.id === produto.id);
        if (itemExistente) {
            quantidadeTemp.set(itemExistente.quantidade);
            _observacaoTemp.set(itemExistente.observacao);
            if (itemExistente.adicionais) {
                adicionaisSelecionados.set([...itemExistente.adicionais]);
                if (itemExistente.adicionais.length > 0) {
                    adicionaisExpandido.set(true);
                }
            }
        }

        mostrarDetalhes.set(true);
    }

    function fecharDetalhes(): void {
        mostrarDetalhes.set(false);
        produtoSelecionado.set(null);
        adicionaisDisponiveis.set([]);
        adicionaisSelecionados.set([]);
        adicionaisExpandido.set(false);
    }

    function setAdicionaisDisponiveis(adicionais: Adicional[]): void {
        adicionaisDisponiveis.set(adicionais);
    }

    function setCarregandoAdicionais(loading: boolean): void {
        carregandoAdicionais.set(loading);
    }

    function toggleAdicionaisExpandido(): void {
        adicionaisExpandido.update(v => !v);
    }

    function adicionarAdicional(adicional: Adicional): void {
        const atuais = adicionaisSelecionados();
        const index = atuais.findIndex(a => a.adicional.id === adicional.id);
        if (index >= 0) {
            const novos = [...atuais];
            novos[index] = { ...novos[index], quantidade: novos[index].quantidade + 1 };
            adicionaisSelecionados.set(novos);
        } else {
            adicionaisSelecionados.set([...atuais, { adicional, quantidade: 1 }]);
        }
    }

    function removerAdicional(adicionalId: string): void {
        const atuais = adicionaisSelecionados();
        const index = atuais.findIndex(a => a.adicional.id === adicionalId);
        if (index >= 0) {
            const novos = [...atuais];
            if (novos[index].quantidade > 1) {
                novos[index] = { ...novos[index], quantidade: novos[index].quantidade - 1 };
            } else {
                novos.splice(index, 1);
            }
            adicionaisSelecionados.set(novos);
        }
    }

    function isAdicionalSelecionado(adicionalId: string): boolean {
        return adicionaisSelecionados().some(a => a.adicional.id === adicionalId);
    }

    function toggleAdicional(adicional: Adicional): void {
        if (isAdicionalSelecionado(adicional.id)) {
            removerAdicional(adicional.id);
        } else {
            adicionarAdicional(adicional);
        }
    }

    function incrementarAdicional(adicionalId: string): void {
        const atuais = adicionaisSelecionados();
        const index = atuais.findIndex(a => a.adicional.id === adicionalId);
        if (index >= 0) {
            const novos = [...atuais];
            novos[index] = { ...novos[index], quantidade: novos[index].quantidade + 1 };
            adicionaisSelecionados.set(novos);
        }
    }

    function decrementarAdicional(adicionalId: string): void {
        removerAdicional(adicionalId);
    }

    function getQuantidadeAdicional(adicionalId: string): number {
        const item = adicionaisSelecionados().find(a => a.adicional.id === adicionalId);
        return item?.quantidade ?? 0;
    }

    function incrementarQuantidade(): void {
        quantidadeTemp.update(q => q + 1);
    }

    function decrementarQuantidade(): void {
        quantidadeTemp.update(q => Math.max(1, q - 1));
    }

    function confirmarProduto(): void {
        const produto = produtoSelecionado();
        if (!produto) return;

        const novoItem: ItemCarrinhoTotem = {
            produto,
            quantidade: quantidadeTemp(),
            observacao: _observacaoTemp(),
            adicionais: [...adicionaisSelecionados()]
        };

        const itensAtuais = [...itens()];
        const index = itensAtuais.findIndex(item => item.produto.id === produto.id);

        if (index >= 0) {
            itensAtuais[index] = novoItem;
        } else {
            itensAtuais.push(novoItem);
        }

        itens.set(itensAtuais);
        persistirCarrinho(itensAtuais);
        fecharDetalhes();
    }

    function removerItem(produtoId: string): void {
        const novosItens = itens().filter(item => item.produto.id !== produtoId);
        itens.set(novosItens);
        persistirCarrinho(novosItens);
    }

    function atualizarQuantidadeItem(produtoId: string, novaQuantidade: number): void {
        if (novaQuantidade <= 0) {
            removerItem(produtoId);
            return;
        }

        const novosItens = itens().map(item => {
            if (item.produto.id === produtoId) {
                return { ...item, quantidade: novaQuantidade };
            }
            return item;
        });

        itens.set(novosItens);
        persistirCarrinho(novosItens);
    }

    function abrirCarrinho(): void {
        mostrarCarrinho.set(true);
    }

    function fecharCarrinho(): void {
        mostrarCarrinho.set(false);
    }

    function limparCarrinho(): void {
        itens.set([]);
        persistirCarrinho([]);
    }

    return {
        // Estado
        itens: itens.asReadonly(),
        produtoSelecionado: produtoSelecionado.asReadonly(),
        quantidadeTemp: quantidadeTemp.asReadonly(),
        mostrarDetalhes: mostrarDetalhes.asReadonly(),
        mostrarCarrinho: mostrarCarrinho.asReadonly(),
        adicionaisDisponiveis: adicionaisDisponiveis.asReadonly(),
        adicionaisSelecionados: adicionaisSelecionados.asReadonly(),
        carregandoAdicionais: carregandoAdicionais.asReadonly(),
        adicionaisExpandido: adicionaisExpandido.asReadonly(),

        // Computed
        totalItens,
        totalValor,
        subtotalAdicionais,
        precoTotalItemModal,
        carrinhoVazio,
        podeEnviarPedido,

        // Getters/Setters
        getObservacao,
        setObservacao,

        // Ações
        abrirDetalhes,
        fecharDetalhes,
        setAdicionaisDisponiveis,
        setCarregandoAdicionais,
        toggleAdicionaisExpandido,
        adicionarAdicional,
        removerAdicional,
        isAdicionalSelecionado,
        toggleAdicional,
        incrementarAdicional,
        decrementarAdicional,
        getQuantidadeAdicional,
        incrementarQuantidade,
        decrementarQuantidade,
        confirmarProduto,
        removerItem,
        atualizarQuantidadeItem,
        abrirCarrinho,
        fecharCarrinho,
        limparCarrinho
    };
}
