import { Component, inject, input, output, computed, signal, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BaseModalComponent } from '../base-modal/base-modal.component';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { ProdutoService } from '../../../../services/produto.service';
import { CategoriaService } from '../../../../services/categoria.service';
import { AdicionalService, Adicional } from '../../../../services/adicional.service';
import { useFormulario } from '../../composables/use-formulario';
import { FormatoUtil } from '../../../../utils/formato.util';
import { Validators } from '@angular/forms';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ProdutoFormData {
  nome: string;
  descricao: string;
  preco: string; // String para input de moeda
  categoria: string;
  disponivel: boolean;
  foto?: string; // Base64 da imagem
}

/**
 * Componente de modal para criar/editar produto.
 * Pequeno, focado e reutilizável.
 */
@Component({
  selector: 'app-produto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BaseModalComponent, ImageUploadComponent],
  templateUrl: './produto-modal.component.html',
  styleUrl: './produto-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProdutoModalComponent {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaService);
  private readonly adicionalService = inject(AdicionalService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly aberto = input<boolean>(false);
  readonly produto = input<any>(null); // Produto sendo editado

  readonly onFechar = output<void>();
  readonly onSucesso = output<void>();

  // Composable para formulário
  readonly formulario = useFormulario<ProdutoFormData>(
    { nome: '', descricao: '', preco: '', categoria: '', disponivel: true, foto: '' },
    {
      nome: [Validators.required, Validators.minLength(2)],
      preco: [Validators.required],
      categoria: [Validators.required]
    }
  );

  readonly categoriasLista = signal<any[]>([]);
  readonly fotoBase64 = signal<string | null>(null);

  // Adicionais
  readonly adicionaisDisponiveis = signal<Adicional[]>([]);
  readonly adicionaisSelecionados = signal<string[]>([]);

  readonly ehEdicao = computed(() => !!this.produto());

  private ultimoAberto = false;
  private ultimoProdutoId: string | null = null;

  constructor() {
    // Effects devem estar no injection context (constructor)
    if (this.isBrowser) {
      // Effect para carregar categorias e adicionais quando modal abrir
      effect(() => {
        const estaAberto = this.aberto();
        if (estaAberto && !this.ultimoAberto) {
          // Só carregar quando modal abrir (evitar recarregamento desnecessário)
          this.carregarCategorias();
          this.carregarAdicionais();
        }
        this.ultimoAberto = estaAberto;
      });

      // Effect para inicializar formulário quando produto ou aberto mudar
      effect(() => {
        const estaAberto = this.aberto();
        const produtoAtual = this.produto();
        const produtoId = produtoAtual?.id || null;

        // Só inicializar se modal abrir ou produto mudar
        if (estaAberto && (produtoId !== this.ultimoProdutoId || !this.ultimoAberto)) {
          // Usar setTimeout para garantir que executa após a renderização
          setTimeout(() => {
            this.inicializarFormulario();
            this.cdr.markForCheck();
          }, 0);
        }
        this.ultimoAberto = estaAberto;
        this.ultimoProdutoId = produtoId;
      });
    }
  }

  private inicializarFormulario(): void {
    const produtoEdit = this.produto();

    if (produtoEdit && produtoEdit.id) {
      // Edição: preencher com dados do produto
      this.formulario.definirValores({
        nome: produtoEdit.nome || '',
        descricao: produtoEdit.descricao || '',
        preco: FormatoUtil.numeroParaInputMoeda(produtoEdit.preco || 0),
        categoria: produtoEdit.categoria || '',
        disponivel: produtoEdit.disponivel ?? true,
        foto: produtoEdit.foto || ''
      });
      this.fotoBase64.set(produtoEdit.foto || null);

      // Carregar adicionais vinculados ao produto
      this.carregarAdicionaisDoProduto(produtoEdit.id);
    } else {
      // Criação: resetar formulário
      this.formulario.resetar();
      this.fotoBase64.set(null);
      this.adicionaisSelecionados.set([]);
    }
  }

  private carregarAdicionais(): void {
    this.adicionalService.listar({ disponivel: true }).subscribe({
      next: (adicionais) => {
        this.adicionaisDisponiveis.set(adicionais);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erro ao carregar adicionais:', error);
        this.adicionaisDisponiveis.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  private carregarAdicionaisDoProduto(produtoId: string): void {
    this.adicionalService.listarAdicionaisDoProduto(produtoId).subscribe({
      next: (adicionais) => {
        this.adicionaisSelecionados.set(adicionais.map(a => a.id));
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erro ao carregar adicionais do produto:', error);
        this.adicionaisSelecionados.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  toggleAdicional(adicionalId: string): void {
    const selecionados = [...this.adicionaisSelecionados()];
    const index = selecionados.indexOf(adicionalId);

    if (index > -1) {
      selecionados.splice(index, 1);
    } else {
      selecionados.push(adicionalId);
    }

    this.adicionaisSelecionados.set(selecionados);
  }

  isAdicionalSelecionado(adicionalId: string): boolean {
    return this.adicionaisSelecionados().includes(adicionalId);
  }

  private carregarCategorias(): void {
    this.categoriaService.listar(true).subscribe({
      next: (cats) => {
        this.categoriasLista.set(cats);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.categoriasLista.set([]);
        this.cdr.markForCheck();
      }
    });
  }

  fechar(): void {
    this.formulario.resetar();
    this.fotoBase64.set(null);
    this.onFechar.emit();
  }

  onImagemSelecionada(base64: string): void {
    this.fotoBase64.set(base64 || null);
    this.formulario.form.controls['foto']?.setValue(base64 || '');
  }

  onErroImagem(mensagem: string): void {
    alert(mensagem);
  }

  formatarPreco(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    const numero = FormatoUtil.moedaParaNumero(valor);

    if (numero > 0) {
      input.value = FormatoUtil.numeroParaInputMoeda(numero);
    } else {
      input.value = '';
    }

    // Atualizar o FormControl
    this.formulario.form.controls['preco'].setValue(input.value);
  }

  salvar(): void {
    if (!this.formulario.valido()) {
      this.formulario.marcarTodosComoTocados();

      // Validação customizada para preço
      const precoStr = this.formulario.form.controls['preco'].value;
      const preco = FormatoUtil.moedaParaNumero(precoStr);
      if (!preco || preco <= 0) {
        this.formulario.adicionarErro('preco', 'Preço deve ser maior que zero');
      }

      return;
    }

    this.formulario.enviando.set(true);
    this.formulario.limparErros();

    const valores = this.formulario.obterValores();
    const preco = FormatoUtil.moedaParaNumero(valores.preco);
    const produto = this.produto();

    const fotoBase64 = this.fotoBase64();
    const fotoParaEnviar = fotoBase64 && fotoBase64.trim().length > 0 ? fotoBase64.trim() : null;

    const dados: any = {
      nome: valores.nome.trim(),
      descricao: valores.descricao?.trim() || '',
      preco,
      categoria: valores.categoria.trim(),
      foto: fotoParaEnviar // Sempre incluir foto (pode ser null)
    };

    const request$ = produto
      ? this.produtoService.atualizar(produto.id, {
        ...dados,
        disponivel: valores.disponivel
        // foto já está em dados
      })
      : this.produtoService.criar(dados);

    request$
      .pipe(
        catchError((error) => {
          const mensagem = error.error?.message || 'Erro ao salvar produto';
          this.formulario.adicionarErro('nome', mensagem);
          this.cdr.markForCheck();
          return of(null);
        })
      )
      .subscribe((resultado) => {
        if (resultado) {
          // Salvar adicionais vinculados
          const produtoId = resultado.id;
          this.adicionalService.atualizarAdicionaisDoProduto(produtoId, this.adicionaisSelecionados())
            .pipe(
              catchError((error) => {
                console.error('Erro ao salvar adicionais:', error);
                return of(null);
              }),
              finalize(() => {
                this.formulario.enviando.set(false);
                this.cdr.markForCheck();
              })
            )
            .subscribe(() => {
              this.formulario.sucesso.set(true);
              this.cdr.markForCheck();
              // Emitir sucesso ANTES de fechar para garantir que dados sejam recarregados
              this.onSucesso.emit();
              setTimeout(() => {
                this.fechar();
              }, 300);
            });
        } else {
          this.formulario.enviando.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  obterTitulo(): string {
    return this.ehEdicao() ? '✏️ Editar Produto' : '➕ Novo Produto';
  }

  excluirProduto(): void {
    if (!this.isBrowser) {
      return;
    }

    const produto = this.produto();
    if (!produto || !confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    this.produtoService.excluir(produto.id)
      .pipe(
        catchError(() => of(null))
      )
      .subscribe(() => {
        this.onSucesso.emit();
        this.fechar();
      });
  }
}

