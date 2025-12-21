import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Produto } from '../../../services/produto.service';
import { Adicional } from '../../../services/adicional.service';

const CARRINHO_STORAGE_KEY = 'pedido-mesa-carrinho';

export interface ItemAdicionalCarrinho {
    adicional: Adicional;
    quantidade: number;
}

export interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
    observacao: string;
    adicionais: ItemAdicionalCarrinho[];
}

/**
 * Composable para gerenciar o carrinho de compras.
 * Responsabilidade única: adicionar, remover e controlar itens do carrinho.
 * Persiste no sessionStorage para manter entre atualizações de página.
 */
export function useCarrinho() {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Restaura carrinho do sessionStorage
    function restaurarCarrinho(): ItemCarrinho[] {
        if (!isBrowser) return [];
        try {
            const stored = sessionStorage.getItem(CARRINHO_STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored) as ItemCarrinho[];
            }
        } catch {
            // Ignora erros de parse
        }
        return [];
    }

    // Persiste carrinho no sessionStorage
    function persistirCarrinho(items: ItemCarrinho[]): void {
        if (!isBrowser) return;
        try {
            sessionStorage.setItem(CARRINHO_STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Ignora erros de storage
        }
    }

    // Estado
    const itens = signal<ItemCarrinho[]>(restaurarCarrinho());
    const produtoSelecionado = signal<Produto | null>(null);
    const quantidadeTemp = signal(1);
    const _observacaoTemp = signal('');
    const mostrarDetalhes = signal(false);
    const mostrarCarrinho = signal(false);

    // Estado para adicionais
    const adicionaisDisponiveis = signal<Adicional[]>([]);
    const adicionaisSelecionados = signal<ItemAdicionalCarrinho[]>([]);
    const carregandoAdicionais = signal(false);
    const adicionaisExpandido = signal(false);

    // Computed
    const totalItens = computed(() =>
        itens().reduce((total, item) => total + item.quantidade, 0)
    );

    const totalValor = computed(() =>
        itens().reduce((total, item) => {
            // Preço do produto * quantidade
            let subtotal = item.produto.preco * item.quantidade;
            // Soma adicionais (preço adicional * quantidade adicional * quantidade do item)
            if (item.adicionais && item.adicionais.length > 0) {
                subtotal += item.adicionais.reduce((acc, ad) =>
                    acc + (ad.adicional.preco * ad.quantidade * item.quantidade), 0);
            }
            return total + subtotal;
        }, 0)
    );

    // Calcula o subtotal dos adicionais selecionados no modal (para preview)
    const subtotalAdicionais = computed(() => {
        return adicionaisSelecionados().reduce((acc, ad) =>
            acc + (ad.adicional.preco * ad.quantidade), 0);
    });

    // Calcula o preço total do item no modal (produto + adicionais) * quantidade
    const precoTotalItemModal = computed(() => {
        const produto = produtoSelecionado();
        if (!produto) return 0;
        const precoBase = produto.preco + subtotalAdicionais();
        return precoBase * quantidadeTemp();
    });

    const carrinhoVazio = computed(() => itens().length === 0);

    const podeEnviarPedido = computed(() =>
        itens().length > 0
    );

    // Getters/Setters para binding
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
        adicionaisExpandido.set(false); // Começa recolhido

        const itemExistente = itens().find(item => item.produto.id === produto.id);
        if (itemExistente) {
            quantidadeTemp.set(itemExistente.quantidade);
            _observacaoTemp.set(itemExistente.observacao);
            // Restaura adicionais selecionados anteriormente
            if (itemExistente.adicionais) {
                adicionaisSelecionados.set([...itemExistente.adicionais]);
                // Se já tem adicionais, expande automaticamente
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

    // Funções para gerenciar adicionais disponíveis
    function setAdicionaisDisponiveis(adicionais: Adicional[]): void {
        adicionaisDisponiveis.set(adicionais);
    }

    function setCarregandoAdicionais(value: boolean): void {
        carregandoAdicionais.set(value);
    }

    function toggleAdicionaisExpandido(): void {
        adicionaisExpandido.update(v => !v);
    }

    // Funções para gerenciar adicionais selecionados
    function toggleAdicional(adicional: Adicional): void {
        const atuais = adicionaisSelecionados();
        const existente = atuais.find(a => a.adicional.id === adicional.id);

        if (existente) {
            // Remove se já existe
            adicionaisSelecionados.set(atuais.filter(a => a.adicional.id !== adicional.id));
        } else {
            // Adiciona com quantidade 1
            adicionaisSelecionados.set([...atuais, { adicional, quantidade: 1 }]);
        }
    }

    function isAdicionalSelecionado(adicionalId: string): boolean {
        return adicionaisSelecionados().some(a => a.adicional.id === adicionalId);
    }

    function getQuantidadeAdicional(adicionalId: string): number {
        const item = adicionaisSelecionados().find(a => a.adicional.id === adicionalId);
        return item ? item.quantidade : 0;
    }

    function incrementarAdicional(adicionalId: string): void {
        adicionaisSelecionados.update(lista =>
            lista.map(item =>
                item.adicional.id === adicionalId
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
            )
        );
    }

    function decrementarAdicional(adicionalId: string): void {
        adicionaisSelecionados.update(lista => {
            return lista.map(item => {
                if (item.adicional.id === adicionalId) {
                    if (item.quantidade <= 1) {
                        return null; // Marca para remover
                    }
                    return { ...item, quantidade: item.quantidade - 1 };
                }
                return item;
            }).filter((item): item is ItemAdicionalCarrinho => item !== null);
        });
    }

    function incrementarQuantidade(): void {
        quantidadeTemp.update(q => q + 1);
    }

    function decrementarQuantidade(): void {
        if (quantidadeTemp() > 1) {
            quantidadeTemp.update(q => q - 1);
        }
    }

    function adicionarAoCarrinho(): void {
        const produto = produtoSelecionado();
        if (!produto) return;

        const itensAtuais = [...itens()];
        const indexExistente = itensAtuais.findIndex(item => item.produto.id === produto.id);

        if (indexExistente >= 0) {
            itensAtuais[indexExistente] = {
                ...itensAtuais[indexExistente],
                quantidade: quantidadeTemp(),
                observacao: _observacaoTemp(),
                adicionais: [...adicionaisSelecionados()]
            };
        } else {
            itensAtuais.push({
                produto,
                quantidade: quantidadeTemp(),
                observacao: _observacaoTemp(),
                adicionais: [...adicionaisSelecionados()]
            });
        }

        itens.set(itensAtuais);
        persistirCarrinho(itensAtuais);
        fecharDetalhes();
    }

    /**
     * Adiciona um produto diretamente ao carrinho com quantidade 1.
     * Usado para adicionar rapidamente sem abrir detalhes.
     */
    function adicionarRapido(produto: Produto): void {
        const existente = itens().find(item => item.produto.id === produto.id);
        if (existente) {
            alterarQuantidade(produto.id, 1);
        } else {
            const novoItem: ItemCarrinho = {
                produto,
                quantidade: 1,
                observacao: '',
                adicionais: []
            };
            itens.update(lista => [...lista, novoItem]);
            persistirCarrinho(itens());
        }
    }

    /**
     * Adiciona um produto ao carrinho com quantidade e observação personalizadas.
     * Usado pelo chat IA para adicionar via comando de texto.
     */
    function adicionarComOpcoes(produto: Produto, quantidade: number, observacao: string): void {
        const itensAtuais = [...itens()];
        const indexExistente = itensAtuais.findIndex(item => item.produto.id === produto.id);

        if (indexExistente >= 0) {
            // Se já existe, soma a quantidade e concatena observação
            const itemExistente = itensAtuais[indexExistente];
            let novaObservacao = itemExistente.observacao;
            if (observacao) {
                novaObservacao = novaObservacao
                    ? `${novaObservacao}; ${observacao}`
                    : observacao;
            }
            itensAtuais[indexExistente] = {
                ...itemExistente,
                quantidade: itemExistente.quantidade + quantidade,
                observacao: novaObservacao
            };
        } else {
            itensAtuais.push({
                produto,
                quantidade,
                observacao,
                adicionais: []
            });
        }

        itens.set(itensAtuais);
        persistirCarrinho(itensAtuais);
    }

    function removerDoCarrinho(produtoId: string): void {
        const novosItens = itens().filter(item => item.produto.id !== produtoId);
        itens.set(novosItens);
        persistirCarrinho(novosItens);
    }

    function alterarQuantidade(produtoId: string, delta: number): void {
        const novosItens = itens()
            .map(item => {
                if (item.produto.id === produtoId) {
                    const novaQuantidade = item.quantidade + delta;
                    if (novaQuantidade <= 0) return null;
                    return { ...item, quantidade: novaQuantidade };
                }
                return item;
            })
            .filter((item): item is ItemCarrinho => item !== null);

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
        mostrarCarrinho,

        // Estado de adicionais
        adicionaisDisponiveis: adicionaisDisponiveis.asReadonly(),
        adicionaisSelecionados: adicionaisSelecionados.asReadonly(),
        carregandoAdicionais: carregandoAdicionais.asReadonly(),
        adicionaisExpandido: adicionaisExpandido.asReadonly(),

        // Computed
        totalItens,
        totalValor,
        carrinhoVazio,
        podeEnviarPedido,
        subtotalAdicionais,
        precoTotalItemModal,

        // Getters/Setters
        getObservacao,
        setObservacao,

        // Ações
        abrirDetalhes,
        fecharDetalhes,
        incrementarQuantidade,
        decrementarQuantidade,
        adicionarAoCarrinho,
        adicionarRapido,
        adicionarComOpcoes,
        removerDoCarrinho,
        alterarQuantidade,
        abrirCarrinho,
        fecharCarrinho,
        limparCarrinho,

        // Ações de adicionais
        setAdicionaisDisponiveis,
        setCarregandoAdicionais,
        toggleAdicional,
        isAdicionalSelecionado,
        getQuantidadeAdicional,
        incrementarAdicional,
        decrementarAdicional,
        toggleAdicionaisExpandido
    };
}
