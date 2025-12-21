import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MotoboyService, Motoboy, CriarMotoboyRequest, AtualizarMotoboyRequest } from '../../services/motoboy.service';

@Component({
    selector: 'app-gestao-motoboys',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './gestao-motoboys.component.html',
    styleUrls: ['./gestao-motoboys.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoMotoboysComponent implements OnInit {
    private readonly motoboyService = inject(MotoboyService);

    // Lista de motoboys
    readonly motoboys = signal<Motoboy[]>([]);
    readonly carregando = signal(true);
    readonly erro = signal<string | null>(null);

    // Filtros
    readonly filtroAtivos = signal<'todos' | 'ativos' | 'inativos'>('todos');

    // Modal de edição/criação
    readonly mostrarModal = signal(false);
    readonly modoEdicao = signal(false);
    readonly salvando = signal(false);
    readonly motoboyEditando = signal<Motoboy | null>(null);

    // Form fields
    readonly formNome = signal('');
    readonly formTelefone = signal('');
    readonly formVeiculo = signal('');
    readonly formPlaca = signal('');
    readonly formAtivo = signal(true);

    // Modal de confirmação de exclusão
    readonly mostrarConfirmacao = signal(false);
    readonly motoboyExcluindo = signal<Motoboy | null>(null);
    readonly excluindo = signal(false);

    // Computed
    readonly motoboysFiltrados = computed(() => {
        const filtro = this.filtroAtivos();
        const lista = this.motoboys();

        switch (filtro) {
            case 'ativos':
                return lista.filter(m => m.ativo);
            case 'inativos':
                return lista.filter(m => !m.ativo);
            default:
                return lista;
        }
    });

    ngOnInit(): void {
        this.carregarMotoboys();
    }

    carregarMotoboys(): void {
        this.carregando.set(true);
        this.erro.set(null);

        this.motoboyService.listar().subscribe({
            next: (motoboys) => {
                this.motoboys.set(motoboys);
                this.carregando.set(false);
            },
            error: (err) => {
                console.error('Erro ao carregar motoboys:', err);
                this.erro.set('Erro ao carregar motoboys. Tente novamente.');
                this.carregando.set(false);
            }
        });
    }

    // Modal
    abrirModalNovo(): void {
        this.modoEdicao.set(false);
        this.motoboyEditando.set(null);
        this.limparFormulario();
        this.mostrarModal.set(true);
    }

    abrirModalEditar(motoboy: Motoboy): void {
        this.modoEdicao.set(true);
        this.motoboyEditando.set(motoboy);
        this.formNome.set(motoboy.nome);
        this.formTelefone.set(motoboy.telefone);
        this.formVeiculo.set(motoboy.veiculo || '');
        this.formPlaca.set(motoboy.placa || '');
        this.formAtivo.set(motoboy.ativo);
        this.mostrarModal.set(true);
    }

    fecharModal(): void {
        this.mostrarModal.set(false);
        this.motoboyEditando.set(null);
        this.limparFormulario();
    }

    limparFormulario(): void {
        this.formNome.set('');
        this.formTelefone.set('');
        this.formVeiculo.set('');
        this.formPlaca.set('');
        this.formAtivo.set(true);
    }

    salvar(): void {
        if (!this.validarFormulario()) return;

        this.salvando.set(true);
        this.erro.set(null);

        if (this.modoEdicao() && this.motoboyEditando()) {
            // Atualizar
            const request: AtualizarMotoboyRequest = {
                nome: this.formNome().trim(),
                telefone: this.formTelefone().trim(),
                veiculo: this.formVeiculo().trim() || undefined,
                placa: this.formPlaca().trim().toUpperCase() || undefined,
                ativo: this.formAtivo()
            };

            this.motoboyService.atualizar(this.motoboyEditando()!.id, request).subscribe({
                next: () => {
                    this.salvando.set(false);
                    this.fecharModal();
                    this.carregarMotoboys();
                },
                error: (err) => {
                    console.error('Erro ao atualizar motoboy:', err);
                    this.erro.set('Erro ao atualizar motoboy.');
                    this.salvando.set(false);
                }
            });
        } else {
            // Criar
            const request: CriarMotoboyRequest = {
                nome: this.formNome().trim(),
                telefone: this.formTelefone().trim(),
                veiculo: this.formVeiculo().trim() || undefined,
                placa: this.formPlaca().trim().toUpperCase() || undefined
            };

            this.motoboyService.criar(request).subscribe({
                next: () => {
                    this.salvando.set(false);
                    this.fecharModal();
                    this.carregarMotoboys();
                },
                error: (err) => {
                    console.error('Erro ao criar motoboy:', err);
                    this.erro.set('Erro ao criar motoboy.');
                    this.salvando.set(false);
                }
            });
        }
    }

    validarFormulario(): boolean {
        if (!this.formNome().trim()) {
            this.erro.set('Nome é obrigatório.');
            return false;
        }
        if (!this.formTelefone().trim()) {
            this.erro.set('Telefone é obrigatório.');
            return false;
        }
        return true;
    }

    // Ativar/Desativar
    toggleAtivo(motoboy: Motoboy): void {
        const operacao = motoboy.ativo
            ? this.motoboyService.desativar(motoboy.id)
            : this.motoboyService.ativar(motoboy.id);

        operacao.subscribe({
            next: () => this.carregarMotoboys(),
            error: (err) => {
                console.error('Erro ao alterar status:', err);
                this.erro.set('Erro ao alterar status do motoboy.');
            }
        });
    }

    // Exclusão
    confirmarExclusao(motoboy: Motoboy): void {
        this.motoboyExcluindo.set(motoboy);
        this.mostrarConfirmacao.set(true);
    }

    cancelarExclusao(): void {
        this.motoboyExcluindo.set(null);
        this.mostrarConfirmacao.set(false);
    }

    excluir(): void {
        const motoboy = this.motoboyExcluindo();
        if (!motoboy) return;

        this.excluindo.set(true);

        this.motoboyService.excluir(motoboy.id).subscribe({
            next: () => {
                this.excluindo.set(false);
                this.cancelarExclusao();
                this.carregarMotoboys();
            },
            error: (err) => {
                console.error('Erro ao excluir motoboy:', err);
                this.erro.set('Erro ao excluir motoboy.');
                this.excluindo.set(false);
            }
        });
    }

    // Formatação
    formatarTelefone(telefone: string): string {
        const numeros = telefone.replaceAll(/\D/g, '');
        if (numeros.length === 11) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        }
        if (numeros.length === 10) {
            return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
        }
        return telefone;
    }

    formatarData(dataStr: string): string {
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR');
    }
}
