import { Component, inject, input, output, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MotoboyService, Motoboy } from '../../../../services/motoboy.service';

/**
 * Componente para seleção de motoboy em pedidos de delivery.
 * Exibe um dropdown com motoboys ativos para atribuição.
 * 
 * Segue padrões Angular 20+ Zoneless:
 * - Standalone component
 * - Signal-based inputs/outputs
 * - ChangeDetection OnPush
 * - inject() ao invés de constructor injection
 */
@Component({
    selector: 'app-seletor-motoboy',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './seletor-motoboy.component.html',
    styleUrl: './seletor-motoboy.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeletorMotoboyComponent implements OnInit {
    private readonly motoboyService = inject(MotoboyService);

    // Inputs (Signal-based)
    readonly motoboyAtualId = input<string | null | undefined>(null);
    readonly motoboyAtualNome = input<string | null | undefined>(null);
    readonly desabilitado = input<boolean>(false);

    // Outputs (Signal-based)
    readonly onMotoboySelecionado = output<string>();

    // State
    readonly motoboys = signal<Motoboy[]>([]);
    readonly carregando = signal<boolean>(false);
    readonly aberto = signal<boolean>(false);
    readonly erro = signal<string | null>(null);

    // Computed
    readonly motoboyAtual = computed(() => {
        const id = this.motoboyAtualId();
        const nome = this.motoboyAtualNome();
        if (nome) return nome;
        if (id) {
            const motoboy = this.motoboys().find(m => m.id === id);
            return motoboy?.nome ?? 'Motoboy atribuído';
        }
        return null;
    });

    readonly temMotoboyAtribuido = computed(() => {
        return !!this.motoboyAtualId() || !!this.motoboyAtualNome();
    });

    ngOnInit(): void {
        this.carregarMotoboys();
    }

    carregarMotoboys(): void {
        this.carregando.set(true);
        this.erro.set(null);

        this.motoboyService.listar(true).subscribe({
            next: (motoboys) => {
                this.motoboys.set(motoboys);
                this.carregando.set(false);
            },
            error: (error) => {
                console.error('Erro ao carregar motoboys:', error);
                this.erro.set('Erro ao carregar motoboys');
                this.carregando.set(false);
            }
        });
    }

    toggleDropdown(): void {
        if (this.desabilitado()) return;
        this.aberto.update(v => !v);
    }

    fecharDropdown(): void {
        this.aberto.set(false);
    }

    selecionarMotoboy(motoboy: Motoboy): void {
        this.onMotoboySelecionado.emit(motoboy.id);
        this.fecharDropdown();
    }

    onClickFora(event: Event): void {
        // Fecha o dropdown se clicar fora
        const target = event.target as HTMLElement;
        if (!target.closest('.seletor-motoboy-container')) {
            this.fecharDropdown();
        }
    }
}
