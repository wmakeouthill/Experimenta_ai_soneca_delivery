import { Component, inject, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Produto } from '../../../../services/produto.service';
import { AdicionalService, Adicional } from '../../../../services/adicional.service';
import { ItemPedidoAdicionalRequest } from '../../../../services/pedido.service';

export interface ProdutoComAdicionais {
    produto: Produto;
    quantidade: number;
    observacoes?: string;
    adicionais: ItemAdicionalSelecionado[];
}

export interface ItemAdicionalSelecionado {
    adicional: Adicional;
    quantidade: number;
}

@Component({
    selector: 'app-produto-detalhes-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './produto-detalhes-modal.component.html',
    styleUrl: './produto-detalhes-modal.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProdutoDetalhesModalComponent {
    private readonly adicionalService = inject(AdicionalService);

    readonly aberto = input.required<boolean>();
    readonly produto = input.required<Produto | null>();
    readonly onFechar = output<void>();
    readonly onConfirmar = output<ProdutoComAdicionais>();

    readonly quantidade = signal(1);
    readonly observacoes = signal('');
    readonly adicionaisDisponiveis = signal<Adicional[]>([]);
    readonly adicionaisSelecionados = signal<ItemAdicionalSelecionado[]>([]);
    readonly carregandoAdicionais = signal(false);
    readonly adicionaisExpandido = signal(false);

    constructor() {
        // Carrega adicionais quando o modal abre com um produto
        effect(() => {
            const prod = this.produto();
            if (this.aberto() && prod) {
                this.carregarAdicionais(prod.id);
                this.resetar();
            }
        }, { allowSignalWrites: true });
    }

    readonly subtotalAdicionais = computed(() => {
        return this.adicionaisSelecionados().reduce((acc, item) =>
            acc + (item.adicional.preco * item.quantidade), 0);
    });

    readonly totalAdicionaisSelecionados = computed(() => {
        return this.adicionaisSelecionados().reduce((acc, item) => acc + item.quantidade, 0);
    });

    toggleAdicionaisExpandido(): void {
        this.adicionaisExpandido.update(v => !v);
    }

    readonly precoTotal = computed(() => {
        const prod = this.produto();
        if (!prod) return 0;
        const precoBase = prod.preco + this.subtotalAdicionais();
        return precoBase * this.quantidade();
    });

    private carregarAdicionais(produtoId: string): void {
        this.carregandoAdicionais.set(true);
        this.adicionalService.listarAdicionaisDoProduto(produtoId).subscribe({
            next: (adicionais) => {
                this.adicionaisDisponiveis.set(adicionais.filter(a => a.disponivel));
                this.carregandoAdicionais.set(false);
            },
            error: () => {
                this.adicionaisDisponiveis.set([]);
                this.carregandoAdicionais.set(false);
            }
        });
    }

    toggleAdicional(adicional: Adicional): void {
        const atuais = this.adicionaisSelecionados();
        const existente = atuais.find(a => a.adicional.id === adicional.id);

        if (existente) {
            this.adicionaisSelecionados.set(atuais.filter(a => a.adicional.id !== adicional.id));
        } else {
            this.adicionaisSelecionados.set([...atuais, { adicional, quantidade: 1 }]);
        }
    }

    isAdicionalSelecionado(adicionalId: string): boolean {
        return this.adicionaisSelecionados().some(a => a.adicional.id === adicionalId);
    }

    getQuantidadeAdicional(adicionalId: string): number {
        const item = this.adicionaisSelecionados().find(a => a.adicional.id === adicionalId);
        return item ? item.quantidade : 0;
    }

    incrementarAdicional(adicionalId: string, event: Event): void {
        event.stopPropagation();
        this.adicionaisSelecionados.update(lista =>
            lista.map(item =>
                item.adicional.id === adicionalId
                    ? { ...item, quantidade: item.quantidade + 1 }
                    : item
            )
        );
    }

    decrementarAdicional(adicionalId: string, event: Event): void {
        event.stopPropagation();
        this.adicionaisSelecionados.update(lista => {
            return lista.map(item => {
                if (item.adicional.id === adicionalId) {
                    if (item.quantidade <= 1) {
                        return null;
                    }
                    return { ...item, quantidade: item.quantidade - 1 };
                }
                return item;
            }).filter((item): item is ItemAdicionalSelecionado => item !== null);
        });
    }

    incrementarQuantidade(): void {
        this.quantidade.update(q => q + 1);
    }

    decrementarQuantidade(): void {
        this.quantidade.update(q => Math.max(1, q - 1));
    }

    confirmar(): void {
        const prod = this.produto();
        if (!prod) return;

        this.onConfirmar.emit({
            produto: prod,
            quantidade: this.quantidade(),
            observacoes: this.observacoes() || undefined,
            adicionais: this.adicionaisSelecionados()
        });
        this.fechar();
    }

    fechar(): void {
        this.onFechar.emit();
        this.resetar();
    }

    private resetar(): void {
        this.quantidade.set(1);
        this.observacoes.set('');
        this.adicionaisSelecionados.set([]);
        this.adicionaisExpandido.set(false);
    }

    formatarPreco(preco: number): string {
        return `R$ ${preco.toFixed(2).replace('.', ',')}`;
    }
}
