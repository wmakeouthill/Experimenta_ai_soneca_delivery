import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ProdutoService, Produto } from '../../services/produto.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './produtos.component.html',
  styleUrl: './produtos.component.css'
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  carregando = false;
  erro: string | null = null;

  constructor(private produtoService: ProdutoService) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.erro = null;
    
    this.produtoService.listar().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.carregando = false;
      },
      error: (error) => {
        this.erro = 'Erro ao carregar produtos: ' + (error.message || 'Erro desconhecido');
        this.carregando = false;
        console.error('Erro ao carregar produtos:', error);
      }
    });
  }
}

