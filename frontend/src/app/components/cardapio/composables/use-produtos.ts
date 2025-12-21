import { signal, computed, inject } from '@angular/core';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { ProdutoService, Produto, ProdutoFilters } from '../../../services/produto.service';
import { CategoriaService, Categoria } from '../../../services/categoria.service';
import { filtrarPorTexto } from '../../../utils/filtro.util';
import { paginar } from '../../../utils/paginacao.util';

type EstadoCarregamento = 'idle' | 'carregando' | 'sucesso' | 'erro';

export function useProdutos() {
  const produtoService = inject(ProdutoService);
  const categoriaService = inject(CategoriaService);

  // Estados
  const produtos = signal<Produto[]>([]);
  const categorias = signal<Categoria[]>([]);
  const estado = signal<EstadoCarregamento>('idle');
  const erro = signal<string | null>(null);

  // Filtros
  const categoriaSelecionada = signal<string | null>(null);
  const disponivelFiltro = signal<boolean | null>(null);
  const pesquisaTexto = signal<string>('');
  const paginaAtual = signal<number>(1);
  const itensPorPagina = signal<number>(12);

  // Computed
  const produtosFiltrados = computed(() => {
    let resultado = [...produtos()];

    // Filtro por categoria (categoriaSelecionada é o nome da categoria)
    if (categoriaSelecionada()) {
      resultado = resultado.filter(p => p.categoria === categoriaSelecionada());
    }

    // Filtro por disponibilidade
    if (disponivelFiltro() !== null) {
      resultado = resultado.filter(p => p.disponivel === disponivelFiltro());
    }

    // Filtro por texto
    if (pesquisaTexto().trim()) {
      resultado = filtrarPorTexto(resultado, {
        texto: pesquisaTexto(),
        campos: ['nome', 'descricao', 'categoria']
      });
    }

    return resultado;
  });

  const produtosPaginados = computed(() => {
    const resultado = paginar(
      produtosFiltrados(),
      itensPorPagina(),
      paginaAtual()
    );
    return resultado;
  });

  const categoriasAtivas = computed(() =>
    categorias().filter(c => c.ativa)
  );

  const temProdutos = computed(() => produtos().length > 0);
  const estaCarregando = computed(() => estado() === 'carregando');

  // Efeito para resetar página quando necessário
  const resetarPaginaSeNecessario = () => {
    const total = produtosPaginados().totalPaginas;
    if (paginaAtual() > total && total > 0) {
      paginaAtual.set(total);
    }
  };

  // Métodos
  const carregarProdutos = (filters?: ProdutoFilters) => {
    estado.set('carregando');
    erro.set(null);

    produtoService.listar(filters)
      .pipe(
        catchError((error) => {
          const mensagem = error.error?.message || error.message || 'Erro ao carregar produtos';
          erro.set(mensagem);
          estado.set('erro');
          console.error('Erro ao carregar produtos:', error);
          return of([]);
        }),
        finalize(() => {
          if (estado() === 'carregando') {
            estado.set('sucesso');
          }
        })
      )
      .subscribe((resultado) => {
        produtos.set(resultado);
      });
  };

  const carregarCategorias = () => {
    categoriaService.listar(true)
      .pipe(
        catchError((error) => {
          console.error('Erro ao carregar categorias:', error);
          return of([]);
        })
      )
      .subscribe((resultado) => {
        categorias.set(resultado);
      });
  };

  const filtrarPorCategoria = (categoriaId: string | null) => {
    categoriaSelecionada.set(categoriaId);
    paginaAtual.set(1);
  };

  const filtrarPorDisponibilidade = (disponivel: boolean | null) => {
    disponivelFiltro.set(disponivel);
    paginaAtual.set(1);
  };

  const pesquisar = (texto: string) => {
    pesquisaTexto.set(texto);
    paginaAtual.set(1);
  };

  const irParaPagina = (pagina: number) => {
    const total = produtosPaginados().totalPaginas;
    if (pagina >= 1 && pagina <= total) {
      paginaAtual.set(pagina);
    }
  };

  const limparFiltros = () => {
    categoriaSelecionada.set(null);
    disponivelFiltro.set(null);
    pesquisaTexto.set('');
    paginaAtual.set(1);
  };

  return {
    // Estados
    produtos,
    categorias,
    estado,
    erro,
    categoriaSelecionada,
    disponivelFiltro,
    pesquisaTexto,
    paginaAtual,

    // Computed
    produtosFiltrados,
    produtosPaginados,
    categoriasAtivas,
    temProdutos,
    estaCarregando,

    // Métodos
    carregarProdutos,
    carregarCategorias,
    filtrarPorCategoria,
    filtrarPorDisponibilidade,
    pesquisar,
    irParaPagina,
    limparFiltros
  };
}

