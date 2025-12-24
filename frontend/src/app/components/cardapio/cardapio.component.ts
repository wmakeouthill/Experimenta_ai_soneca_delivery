import { Component, inject, PLATFORM_ID, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { useProdutos } from './composables/use-produtos';
import { ProdutoModalComponent } from './modals/produto-modal/produto-modal.component';
import { CategoriaModalComponent } from './modals/categoria-modal/categoria-modal.component';
import { AdicionalModalComponent } from './modals/adicional-modal/adicional-modal.component';
import { MenuContextoCategoriaComponent } from './components/menu-contexto-categoria/menu-contexto-categoria.component';
import { ProdutoService } from '../../services/produto.service';
import { AdicionalService, Adicional } from '../../services/adicional.service';
import { CategoriaService, Categoria } from '../../services/categoria.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cardapio',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProdutoModalComponent,
    CategoriaModalComponent,
    AdicionalModalComponent,
    MenuContextoCategoriaComponent
  ],
  templateUrl: './cardapio.component.html',
  styleUrl: './cardapio.component.css'
})
export class CardapioComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly produtoService = inject(ProdutoService);
  private readonly adicionalService = inject(AdicionalService);
  private readonly categoriaService = inject(CategoriaService);
  readonly authService = inject(AuthService);

  // Composable com toda a lógica de produtos
  readonly produtosComposable = useProdutos();

  // Expor propriedades necessárias
  readonly produtosPaginados = this.produtosComposable.produtosPaginados;
  readonly categoriasAtivas = this.produtosComposable.categoriasAtivas;
  readonly categoriaSelecionada = this.produtosComposable.categoriaSelecionada;
  readonly estado = this.produtosComposable.estado;
  readonly erro = this.produtosComposable.erro;
  readonly estaCarregando = this.produtosComposable.estaCarregando;
  readonly temProdutos = this.produtosComposable.temProdutos;
  readonly pesquisaTexto = this.produtosComposable.pesquisaTexto;

  // Modal states
  readonly mostrarModalProduto = signal(false);
  readonly mostrarModalCategoria = signal(false);
  readonly mostrarModalAdicional = signal(false);
  readonly produtoEditando = signal<any>(null);
  readonly adicionalEditando = signal<Adicional | null>(null);
  readonly categoriaEditando = signal<Categoria | null>(null);

  // Menu de contexto
  readonly menuContextoAberto = signal(false);
  readonly menuContextoPosicao = signal<{ x: number; y: number } | null>(null);
  readonly categoriaMenuContexto = signal<Categoria | null>(null);

  // Abas: 'produtos' ou 'adicionais'
  readonly abaAtiva = signal<'produtos' | 'adicionais'>('produtos');

  // Lista de adicionais
  readonly adicionais = signal<Adicional[]>([]);
  readonly carregandoAdicionais = signal(false);

  @ViewChild('produtosSection', { static: false }) produtosSectionRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    if (this.isBrowser && this.estado() === 'idle') {
      this.carregarDados();
    }
  }

  private carregarDados(): void {
    this.produtosComposable.carregarProdutos();
    this.produtosComposable.carregarCategorias();
  }

  carregarAdicionais(): void {
    this.carregandoAdicionais.set(true);
    this.adicionalService.listar().subscribe({
      next: (adicionais) => {
        this.adicionais.set(adicionais);
        this.carregandoAdicionais.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar adicionais:', error);
        this.carregandoAdicionais.set(false);
      }
    });
  }

  mudarAba(aba: 'produtos' | 'adicionais'): void {
    this.abaAtiva.set(aba);
    if (aba === 'adicionais' && this.adicionais().length === 0) {
      this.carregarAdicionais();
    }
  }

  filtrarPorCategoria(categoriaId: string | null): void {
    this.produtosComposable.filtrarPorCategoria(categoriaId);
  }

  pesquisar(texto: string): void {
    this.produtosComposable.pesquisar(texto);
  }

  irParaPagina(pagina: number): void {
    this.produtosComposable.irParaPagina(pagina);

    if (this.isBrowser) {
      requestAnimationFrame(() => {
        if (this.produtosSectionRef?.nativeElement) {
          this.produtosSectionRef.nativeElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  }

  limparFiltros(): void {
    this.produtosComposable.limparFiltros();
  }

  recarregar(): void {
    this.carregarDados();
  }

  abrirModalProduto(produto?: any): void {
    this.produtoEditando.set(produto || null);
    this.mostrarModalProduto.set(true);
  }

  fecharModalProduto(): void {
    this.mostrarModalProduto.set(false);
    this.produtoEditando.set(null);
  }

  abrirModalCategoria(categoria?: Categoria): void {
    this.categoriaEditando.set(categoria || null);
    this.mostrarModalCategoria.set(true);
  }

  fecharModalCategoria(): void {
    this.mostrarModalCategoria.set(false);
    this.categoriaEditando.set(null);
  }

  editarCategoria(categoria: Categoria): void {
    this.abrirModalCategoria(categoria);
  }

  excluirCategoria(id: string): void {
    if (!this.isBrowser) {
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.')) {
      return;
    }

    this.categoriaService.excluir(id).subscribe({
      next: () => {
        this.produtosComposable.carregarCategorias();
        this.produtosComposable.carregarProdutos();
      },
      error: (error) => {
        console.error('Erro ao excluir categoria:', error);
        if (this.isBrowser) {
          alert('Erro ao excluir categoria. Tente novamente.');
        }
      }
    });
  }

  abrirMenuContextoCategoria(event: MouseEvent, categoria: Categoria): void {
    if (!this.isBrowser) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.categoriaMenuContexto.set(categoria);
    this.menuContextoPosicao.set({ x: event.clientX, y: event.clientY });
    this.menuContextoAberto.set(true);
  }

  fecharMenuContexto(): void {
    this.menuContextoAberto.set(false);
    this.menuContextoPosicao.set(null);
    this.categoriaMenuContexto.set(null);
  }

  // === Adicionais ===
  abrirModalAdicional(adicional?: Adicional): void {
    this.adicionalEditando.set(adicional || null);
    this.mostrarModalAdicional.set(true);
  }

  fecharModalAdicional(): void {
    this.mostrarModalAdicional.set(false);
    this.adicionalEditando.set(null);
  }

  editarAdicional(adicional: Adicional): void {
    this.abrirModalAdicional(adicional);
  }

  excluirAdicional(id: string): void {
    if (!this.isBrowser) {
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este adicional?')) {
      return;
    }

    this.adicionalService.excluir(id).subscribe({
      next: () => {
        this.carregarAdicionais();
      },
      error: (error) => {
        console.error('Erro ao excluir adicional:', error);
        if (this.isBrowser) {
          alert('Erro ao excluir adicional. Tente novamente.');
        }
      }
    });
  }

  alternarDisponibilidadeAdicional(adicional: Adicional): void {
    if (!this.isBrowser) {
      return;
    }

    const novaDisponibilidade = !adicional.disponivel;

    this.adicionalService.alternarDisponibilidade(adicional.id, novaDisponibilidade).subscribe({
      next: () => {
        this.carregarAdicionais();
      },
      error: (error) => {
        console.error('Erro ao alterar disponibilidade do adicional:', error);
        if (this.isBrowser) {
          alert('Erro ao alterar disponibilidade do adicional. Tente novamente.');
        }
      }
    });
  }

  onAdicionalSalvo(): void {
    this.carregarAdicionais();
  }

  editarProduto(produto: any): void {
    this.abrirModalProduto(produto);
  }

  excluirProduto(id: string): void {
    if (!this.isBrowser) {
      return;
    }

    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    this.produtoService.excluir(id)
      .subscribe({
        next: () => {
          this.carregarDados();
        },
        error: (error) => {
          console.error('Erro ao excluir produto:', error);
          if (this.isBrowser) {
            alert('Erro ao excluir produto. Tente novamente.');
          }
        }
      });
  }

  alternarDisponibilidade(produto: any): void {
    if (!this.isBrowser) {
      return;
    }

    const novaDisponibilidade = !produto.disponivel;

    this.produtoService.alternarDisponibilidade(produto.id, novaDisponibilidade)
      .subscribe({
        next: () => {
          this.carregarDados();
        },
        error: (error) => {
          console.error('Erro ao alterar disponibilidade do produto:', error);
          if (this.isBrowser) {
            alert('Erro ao alterar disponibilidade do produto. Tente novamente.');
          }
        }
      });
  }

  onProdutoSalvo(): void {
    this.carregarDados();
    this.produtosComposable.carregarCategorias();
  }

  onCategoriaSalva(): void {
    this.produtosComposable.carregarCategorias();
    this.produtosComposable.carregarProdutos();
  }

  gerarNumerosPagina(): (number | string)[] {
    const total = this.produtosPaginados().totalPaginas;
    const atual = this.produtosPaginados().paginaAtual;
    const numeros: (number | string)[] = [];

    if (total <= 7) {
      // Se há 7 ou menos páginas, mostrar todas
      for (let i = 1; i <= total; i++) {
        numeros.push(i);
      }
    } else {
      // Sempre mostrar primeira página
      numeros.push(1);

      if (atual > 3) {
        numeros.push('...');
      }

      // Páginas ao redor da atual
      const inicio = Math.max(2, atual - 1);
      const fim = Math.min(total - 1, atual + 1);

      for (let i = inicio; i <= fim; i++) {
        numeros.push(i);
      }

      if (atual < total - 2) {
        numeros.push('...');
      }

      // Sempre mostrar última página
      if (total > 1) {
        numeros.push(total);
      }
    }

    return numeros;
  }
}
