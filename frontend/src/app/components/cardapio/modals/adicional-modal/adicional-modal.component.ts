import { Component, inject, input, output, computed, signal, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaseModalComponent } from '../base-modal/base-modal.component';
import { AdicionalService, Adicional } from '../../../../services/adicional.service';
import { useFormulario } from '../../composables/use-formulario';
import { FormatoUtil } from '../../../../utils/formato.util';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export interface AdicionalFormData {
    nome: string;
    descricao: string;
    preco: string;
    categoria: string;
    disponivel: boolean;
}

/**
 * Componente de modal para criar/editar adicional.
 */
@Component({
    selector: 'app-adicional-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseModalComponent],
    templateUrl: './adicional-modal.component.html',
    styleUrl: './adicional-modal.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdicionalModalComponent {
    private readonly adicionalService = inject(AdicionalService);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly cdr = inject(ChangeDetectorRef);

    readonly aberto = input<boolean>(false);
    readonly adicional = input<Adicional | null>(null);

    readonly onFechar = output<void>();
    readonly onSucesso = output<void>();

    // Composable para formulário
    readonly formulario = useFormulario<AdicionalFormData>(
        { nome: '', descricao: '', preco: '', categoria: '', disponivel: true },
        {
            nome: [Validators.required, Validators.minLength(2)],
            preco: [Validators.required]
        }
    );

    readonly ehEdicao = computed(() => !!this.adicional());

    // Categorias sugeridas para adicionais
    readonly categoriasSugeridas = [
        'Proteína',
        'Acompanhamento',
        'Molho',
        'Queijo',
        'Vegetais',
        'Bebida',
        'Outro'
    ];

    private ultimoAberto = false;
    private ultimoAdicionalId: string | null = null;

    constructor() {
        if (this.isBrowser) {
            effect(() => {
                const estaAberto = this.aberto();
                const adicionalAtual = this.adicional();
                const adicionalId = adicionalAtual?.id || null;

                if (estaAberto && (adicionalId !== this.ultimoAdicionalId || !this.ultimoAberto)) {
                    setTimeout(() => {
                        this.inicializarFormulario();
                        this.cdr.markForCheck();
                    }, 0);
                }
                this.ultimoAberto = estaAberto;
                this.ultimoAdicionalId = adicionalId;
            });
        }
    }

    private inicializarFormulario(): void {
        const adicionalEdit = this.adicional();

        if (adicionalEdit && adicionalEdit.id) {
            this.formulario.definirValores({
                nome: adicionalEdit.nome || '',
                descricao: adicionalEdit.descricao || '',
                preco: FormatoUtil.numeroParaInputMoeda(adicionalEdit.preco || 0),
                categoria: adicionalEdit.categoria || '',
                disponivel: adicionalEdit.disponivel ?? true
            });
        } else {
            this.formulario.resetar();
        }
    }

    fechar(): void {
        this.formulario.resetar();
        this.onFechar.emit();
    }

    formatarPreco(event: Event): void {
        const input = event.target as HTMLInputElement;
        // Remove tudo exceto números e vírgula
        let valor = input.value.replace(/[^\d,]/g, '');
        // Garante apenas uma vírgula
        const partes = valor.split(',');
        if (partes.length > 2) {
            valor = partes[0] + ',' + partes.slice(1).join('');
        }
        input.value = valor;
        this.formulario.form.controls['preco'].setValue(valor);
    }

    salvar(): void {
        if (!this.formulario.valido()) {
            this.formulario.marcarTodosComoTocados();
            return;
        }

        const valores = this.formulario.obterValores();
        const precoNumerico = FormatoUtil.moedaParaNumero(valores.preco);

        this.formulario.enviando.set(true);

        const adicionalEdit = this.adicional();
        const operacao = adicionalEdit?.id
            ? this.adicionalService.atualizar(adicionalEdit.id, {
                nome: valores.nome,
                descricao: valores.descricao,
                preco: precoNumerico,
                categoria: valores.categoria,
                disponivel: valores.disponivel
            })
            : this.adicionalService.criar({
                nome: valores.nome,
                descricao: valores.descricao,
                preco: precoNumerico,
                categoria: valores.categoria
            });

        operacao.pipe(
            catchError((error) => {
                console.error('Erro ao salvar adicional:', error);
                if (this.isBrowser) {
                    alert('Erro ao salvar adicional. Tente novamente.');
                }
                return of(null);
            }),
            finalize(() => {
                this.formulario.enviando.set(false);
                this.cdr.markForCheck();
            })
        ).subscribe((resultado) => {
            if (resultado) {
                this.onSucesso.emit();
                this.fechar();
            }
        });
    }
}
