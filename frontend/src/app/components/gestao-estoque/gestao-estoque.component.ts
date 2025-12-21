import { Component, inject, signal, ChangeDetectionStrategy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { useGestaoEstoque } from './composables/use-gestao-estoque';
import {
  UNIDADES_MEDIDA,
  UnidadeMedida,
  ItemEstoque,
  CriarItemEstoqueRequest,
  AtualizarItemEstoqueRequest
} from '../../services/estoque.service';
import { FormatoUtil } from '../../utils/formato.util';

interface FormularioItem {
  nome: string;
  descricao: string;
  quantidade: number | null;
  quantidadeMinima: number | null;
  unidadeMedida: UnidadeMedida;
  precoUnitario: number | null;
  fornecedor: string;
  codigoBarras: string;
  ativo: boolean;
}

@Component({
  selector: 'app-gestao-estoque',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gestao-estoque.component.html',
  styleUrl: './gestao-estoque.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoEstoqueComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly store = useGestaoEstoque();
  readonly unidadesMedida = UNIDADES_MEDIDA;

  // Modal
  readonly mostrarModal = signal(false);
  readonly modoFormulario = signal<'criar' | 'editar'>('criar');

  // Formulário
  readonly formulario = signal<FormularioItem>({
    nome: '',
    descricao: '',
    quantidade: null,
    quantidadeMinima: null,
    unidadeMedida: 'UN',
    precoUnitario: null,
    fornecedor: '',
    codigoBarras: '',
    ativo: true
  });

  // ID do item em edição
  readonly itemIdEdicao = signal<string | null>(null);

  // Filtro de busca
  readonly termoBusca = signal('');

  // Confirmação de exclusão
  readonly mostrarConfirmacaoExclusao = signal(false);
  readonly itemParaExcluir = signal<ItemEstoque | null>(null);

  // Mensagem de feedback
  readonly mensagemSucesso = signal<string | null>(null);

  ngOnInit(): void {
    if (this.isBrowser) {
      this.store.carregarItens();
    }
  }

  // ========== Modal ==========

  abrirModalCriar(): void {
    this.modoFormulario.set('criar');
    this.itemIdEdicao.set(null);
    this.formulario.set({
      nome: '',
      descricao: '',
      quantidade: 0,
      quantidadeMinima: 0,
      unidadeMedida: 'UN',
      precoUnitario: null,
      fornecedor: '',
      codigoBarras: '',
      ativo: true
    });
    this.mostrarModal.set(true);
  }

  abrirModalEditar(item: ItemEstoque): void {
    this.modoFormulario.set('editar');
    this.itemIdEdicao.set(item.id);
    this.formulario.set({
      nome: item.nome,
      descricao: item.descricao || '',
      quantidade: item.quantidade,
      quantidadeMinima: item.quantidadeMinima,
      unidadeMedida: item.unidadeMedida,
      precoUnitario: item.precoUnitario,
      fornecedor: item.fornecedor || '',
      codigoBarras: item.codigoBarras || '',
      ativo: item.ativo
    });
    this.mostrarModal.set(true);
  }

  fecharModal(): void {
    this.mostrarModal.set(false);
    this.itemIdEdicao.set(null);
  }

  // ========== Atualização de campos do formulário ==========

  atualizarNome(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, nome: valor }));
  }

  atualizarDescricao(event: Event): void {
    const valor = (event.target as HTMLTextAreaElement).value;
    this.formulario.update(f => ({ ...f, descricao: valor }));
  }

  atualizarQuantidade(event: Event): void {
    const valor = +(event.target as HTMLInputElement).value || 0;
    this.formulario.update(f => ({ ...f, quantidade: valor }));
  }

  atualizarQuantidadeMinima(event: Event): void {
    const valor = +(event.target as HTMLInputElement).value || 0;
    this.formulario.update(f => ({ ...f, quantidadeMinima: valor }));
  }

  atualizarUnidadeMedida(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value as UnidadeMedida;
    this.formulario.update(f => ({ ...f, unidadeMedida: valor }));
  }

  atualizarPrecoUnitario(event: Event): void {
    const valor = +(event.target as HTMLInputElement).value || null;
    this.formulario.update(f => ({ ...f, precoUnitario: valor }));
  }

  atualizarFornecedor(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, fornecedor: valor }));
  }

  atualizarCodigoBarras(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.formulario.update(f => ({ ...f, codigoBarras: valor }));
  }

  atualizarAtivo(event: Event): void {
    const valor = (event.target as HTMLInputElement).checked;
    this.formulario.update(f => ({ ...f, ativo: valor }));
  }

  atualizarTermoBusca(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.termoBusca.set(valor);
  }

  // ========== Formulário ==========

  async salvarItem(): Promise<void> {
    const form = this.formulario();

    if (!form.nome.trim()) {
      return;
    }

    try {
      if (this.modoFormulario() === 'criar') {
        const request: CriarItemEstoqueRequest = {
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          quantidade: form.quantidade ?? 0,
          quantidadeMinima: form.quantidadeMinima ?? 0,
          unidadeMedida: form.unidadeMedida,
          precoUnitario: form.precoUnitario ?? undefined,
          fornecedor: form.fornecedor.trim() || undefined,
          codigoBarras: form.codigoBarras.trim() || undefined
        };

        await this.store.criarItem(request);
        this.exibirMensagemSucesso('Item criado com sucesso!');
      } else {
        const id = this.itemIdEdicao();
        if (!id) return;

        const request: AtualizarItemEstoqueRequest = {
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || undefined,
          quantidade: form.quantidade ?? 0,
          quantidadeMinima: form.quantidadeMinima ?? 0,
          unidadeMedida: form.unidadeMedida,
          precoUnitario: form.precoUnitario ?? undefined,
          fornecedor: form.fornecedor.trim() || undefined,
          codigoBarras: form.codigoBarras.trim() || undefined,
          ativo: form.ativo
        };

        await this.store.atualizarItem(id, request);
        this.exibirMensagemSucesso('Item atualizado com sucesso!');
      }

      this.fecharModal();
    } catch {
      // Erro já tratado no composable
    }
  }

  // ========== Exclusão ==========

  confirmarExclusao(item: ItemEstoque): void {
    this.itemParaExcluir.set(item);
    this.mostrarConfirmacaoExclusao.set(true);
  }

  cancelarExclusao(): void {
    this.itemParaExcluir.set(null);
    this.mostrarConfirmacaoExclusao.set(false);
  }

  async executarExclusao(): Promise<void> {
    const item = this.itemParaExcluir();
    if (!item) return;

    try {
      await this.store.excluirItem(item.id);
      this.exibirMensagemSucesso('Item excluído com sucesso!');
    } catch {
      // Erro já tratado no composable
    }

    this.cancelarExclusao();
  }

  // ========== Filtro e Paginação ==========

  aplicarFiltro(): void {
    this.store.aplicarFiltro(this.termoBusca());
  }

  limparFiltro(): void {
    this.termoBusca.set('');
    this.store.aplicarFiltro('');
  }

  irParaPagina(pagina: number): void {
    this.store.irParaPagina(pagina);
  }

  // ========== Formatação ==========

  formatarMoeda(valor: number | null | undefined): string {
    if (valor === null || valor === undefined) return '-';
    return FormatoUtil.moeda(valor);
  }

  formatarQuantidade(valor: number, unidade: string): string {
    const formatado = valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    });
    return `${formatado} ${unidade}`;
  }

  // ========== Paginação Visual ==========

  gerarNumerosPagina(): (number | string)[] {
    const total = this.store.totalPaginas();
    const atual = this.store.paginaAtual();
    const numeros: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) {
        numeros.push(i);
      }
    } else {
      numeros.push(0);

      if (atual > 3) {
        numeros.push('...');
      }

      const inicio = Math.max(1, atual - 1);
      const fim = Math.min(total - 2, atual + 1);

      for (let i = inicio; i <= fim; i++) {
        numeros.push(i);
      }

      if (atual < total - 3) {
        numeros.push('...');
      }

      if (total > 1) {
        numeros.push(total - 1);
      }
    }

    return numeros;
  }

  // ========== Helpers ==========

  private exibirMensagemSucesso(mensagem: string): void {
    this.mensagemSucesso.set(mensagem);
    setTimeout(() => {
      this.mensagemSucesso.set(null);
    }, 3000);
  }

  getClasseEstoque(item: ItemEstoque): string {
    if (!item.ativo) return 'status-inativo';
    if (item.quantidade === 0) return 'status-sem-estoque';
    if (item.quantidade <= item.quantidadeMinima * 0.5) return 'status-critico';
    if (item.estoqueBaixo || item.quantidade <= item.quantidadeMinima) return 'status-baixo';
    if (item.quantidade <= item.quantidadeMinima * 2) return 'status-medio';
    return 'status-ok';
  }

  getTextoStatus(item: ItemEstoque): string {
    if (!item.ativo) return 'Inativo';
    if (item.quantidade === 0) return 'Sem Estoque';
    if (item.quantidade <= item.quantidadeMinima * 0.5) return 'Crítico';
    if (item.estoqueBaixo || item.quantidade <= item.quantidadeMinima) return 'Baixo';
    if (item.quantidade <= item.quantidadeMinima * 2) return 'Médio';
    return 'OK';
  }

  filtrarPorStatus(status: string | null): void {
    this.store.filtrarPorStatus(status);
  }

  pararPropagacao(event: Event): void {
    event.stopPropagation();
  }
}
