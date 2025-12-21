import { Component, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Produto } from '../../../../services/produto.service';

@Component({
  selector: 'app-selecao-produtos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selecao-produtos.component.html',
  styleUrl: './selecao-produtos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelecaoProdutosComponent {
  readonly produtos = input.required<Produto[]>();
  readonly onProdutoSelecionado = output<Produto>();

  readonly pesquisaProduto = signal<string>('');
  readonly categoriaFiltro = signal<string | null>(null);

  readonly produtosFiltrados = computed(() => {
    let produtos = this.produtos();
    
    const categoria = this.categoriaFiltro();
    if (categoria) {
      produtos = produtos.filter(p => p.categoria === categoria);
    }
    
    const texto = this.pesquisaProduto().toLowerCase().trim();
    if (texto) {
      produtos = produtos.filter(p => 
        p.nome.toLowerCase().includes(texto) ||
        p.descricao?.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto)
      );
    }
    
    return produtos;
  });

  readonly categoriasUnicas = computed(() => {
    const categorias = new Set<string>();
    this.produtos().forEach(p => {
      if (p.categoria) {
        categorias.add(p.categoria);
      }
    });
    return Array.from(categorias).sort((a, b) => a.localeCompare(b));
  });

  filtrarPorCategoria(categoria: string | null): void {
    this.categoriaFiltro.set(categoria);
  }

  pesquisarProduto(texto: string): void {
    this.pesquisaProduto.set(texto);
  }

  selecionarProduto(produto: Produto): void {
    if (!produto.disponivel) {
      return;
    }
    this.onProdutoSelecionado.emit(produto);
  }

  formatarPreco(preco: number): string {
    return `R$ ${preco.toFixed(2).replace('.', ',')}`;
  }
}

