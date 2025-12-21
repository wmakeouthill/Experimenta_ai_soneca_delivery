import { Component, inject, input, output, signal, computed, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectionStrategy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClienteService, Cliente, CriarClienteRequest } from '../../../../services/cliente.service';

@Component({
  selector: 'app-selecao-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './selecao-cliente.component.html',
  styleUrl: './selecao-cliente.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelecaoClienteComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly clienteService = inject(ClienteService);
  private readonly fb = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  @ViewChild('listaClientes', { static: false }) listaClientesRef!: ElementRef<HTMLDivElement>;

  readonly clienteSelecionado = input<Cliente | null>(null);
  readonly onClienteSelecionado = output<Cliente>();
  readonly onClienteCriado = output<Cliente>();
  readonly onTrocarCliente = output<void>();

  readonly clientes = signal<Cliente[]>([]);
  readonly paginaClientes = signal<number>(1);
  readonly clientesPorPagina = signal<number>(6);
  readonly gapCalculado = signal<string>('0.5rem');

  private resizeObserver?: ResizeObserver;

  readonly clienteForm: FormGroup;

  constructor() {
    this.clienteForm = this.fb.group({
      nome: ['', [Validators.required]],
      telefone: ['', [Validators.required]],
      email: [''],
      cpf: [''],
      observacoes: ['']
    });
  }

  ngOnInit(): void {
    this.carregarClientes();
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      // Aguarda um ciclo para garantir que o DOM está renderizado
      setTimeout(() => {
        if (this.listaClientesRef) {
          this.calcularClientesPorPagina();
          this.observarMudancasTamanho();
          this.calcularGapProporcional();
        }
      }, 0);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private observarMudancasTamanho(): void {
    if (!this.isBrowser || !this.listaClientesRef?.nativeElement) {
      return;
    }

    this.resizeObserver = new ResizeObserver(() => {
      this.calcularClientesPorPagina();
      this.calcularGapProporcional();
    });

    this.resizeObserver.observe(this.listaClientesRef.nativeElement);
  }

  private calcularClientesPorPagina(): void {
    if (!this.isBrowser || !this.listaClientesRef?.nativeElement) {
      return;
    }

    const listaElement = this.listaClientesRef.nativeElement;
    const alturaDisponivel = listaElement.clientHeight;
    
    // Se não há altura disponível, mantém o valor padrão
    if (alturaDisponivel <= 0) {
      return;
    }
    
    // Tenta calcular baseado em um item real se existir
    const primeiroItem = listaElement.querySelector('.cliente-item') as HTMLElement;
    let alturaPorItem = 72; // Valor padrão aproximado
    
    if (primeiroItem) {
      const estilo = window.getComputedStyle(primeiroItem);
      const alturaItem = primeiroItem.offsetHeight;
      const marginBottom = parseFloat(estilo.marginBottom) || 0;
      alturaPorItem = alturaItem + marginBottom;
    }
    
    // Gap entre itens (definido no CSS: gap: 0.5rem = 8px)
    const gapEntreItens = 8;
    
    // Calcula quantos itens cabem
    // Fórmula: (altura disponível + gap) / (altura item + gap)
    const itensQueCabem = Math.floor((alturaDisponivel + gapEntreItens) / (alturaPorItem + gapEntreItens));
    
    // Mínimo de 3 itens, máximo de 20 itens por página
    const clientesPorPagina = Math.max(3, Math.min(20, itensQueCabem));
    
    const atual = this.clientesPorPagina();
    if (clientesPorPagina !== atual && clientesPorPagina > 0) {
      this.clientesPorPagina.set(clientesPorPagina);
      // Ajusta a página atual se necessário
      const totalClientes = this.clientes().length;
      if (totalClientes > 0) {
        const totalPaginas = Math.ceil(totalClientes / clientesPorPagina);
        if (this.paginaClientes() > totalPaginas && totalPaginas > 0) {
          this.paginaClientes.set(totalPaginas);
        }
      }
    }
    
    // Calcula o gap proporcional
    this.calcularGapProporcional();
  }

  private calcularGapProporcional(): void {
    if (!this.isBrowser || !this.listaClientesRef?.nativeElement) {
      return;
    }

    const listaElement = this.listaClientesRef.nativeElement;
    const alturaDisponivel = listaElement.clientHeight;
    const itens = listaElement.querySelectorAll('.cliente-item');
    const quantidadeItens = itens.length;

    if (alturaDisponivel <= 0 || quantidadeItens === 0) {
      this.gapCalculado.set('0.5rem');
      return;
    }

    // Obtém o padding do elemento
    const estilo = window.getComputedStyle(listaElement);
    const paddingTop = parseFloat(estilo.paddingTop) || 0;
    const paddingBottom = parseFloat(estilo.paddingBottom) || 0;
    const paddingTotal = paddingTop + paddingBottom;

    // Calcula a altura total dos itens
    let alturaTotalItens = 0;
    itens.forEach(item => {
      const elemento = item as HTMLElement;
      alturaTotalItens += elemento.offsetHeight;
    });

    // Altura disponível para conteúdo (descontando padding)
    const alturaConteudo = alturaDisponivel - paddingTotal;
    
    // Se há mais de 1 item, calcula o gap proporcional
    if (quantidadeItens > 1) {
      // Número de gaps = quantidade de itens - 1
      const numeroGaps = quantidadeItens - 1;
      
      // Calcula o espaço disponível para gaps
      const espacoParaGaps = alturaConteudo - alturaTotalItens;
      
      if (espacoParaGaps > 0) {
        // Distribui o espaço proporcionalmente entre os gaps
        const gapPorItem = espacoParaGaps / numeroGaps;
        // Limita o gap entre 0.25rem (4px) e 2rem (32px)
        const gapLimitado = Math.max(4, Math.min(32, gapPorItem));
        this.gapCalculado.set(`${gapLimitado}px`);
      } else {
        // Se não há espaço suficiente, usa gap mínimo
        // Mas verifica se com gap mínimo ainda cabe tudo
        const gapMinimo = 8; // 0.5rem = 8px
        const alturaNecessaria = alturaTotalItens + (gapMinimo * numeroGaps);
        
        if (alturaNecessaria <= alturaConteudo) {
          this.gapCalculado.set('0.5rem');
        } else {
          // Não cabe mesmo com gap mínimo, usa gap mínimo mesmo (vai ter scroll)
          this.gapCalculado.set('0.5rem');
        }
      }
    } else {
      // Se só há 1 item, usa gap mínimo
      this.gapCalculado.set('0.5rem');
    }
  }

  readonly clientesPaginados = computed(() => {
    const todosClientes = [...this.clientes()].sort((a, b) => 
      a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
    );
    const pagina = this.paginaClientes();
    const porPagina = this.clientesPorPagina();
    const inicio = (pagina - 1) * porPagina;
    const fim = inicio + porPagina;
    return todosClientes.slice(inicio, fim);
  });

  readonly totalPaginasClientes = computed(() => {
    const total = this.clientes().length;
    const porPagina = this.clientesPorPagina();
    return Math.ceil(total / porPagina);
  });

  carregarClientes(telefone?: string, nome?: string): void {
    this.clienteService.listar({ telefone, nome })
      .subscribe({
        next: (clientes) => {
          this.clientes.set(clientes);
          // Recalcula após os clientes serem carregados
          if (this.isBrowser) {
            setTimeout(() => {
              this.calcularClientesPorPagina();
              this.calcularGapProporcional();
            }, 100);
          }
        },
        error: (error) => console.error('Erro ao carregar clientes:', error)
      });
  }

  buscarClientes(texto: string): void {
    this.paginaClientes.set(1);
    if (texto && texto.trim().length >= 2) {
      const textoLimpo = texto.trim();
      if (/^\d/.test(textoLimpo)) {
        this.carregarClientes(textoLimpo);
      } else {
        this.carregarClientes(undefined, textoLimpo);
      }
    } else {
      this.carregarClientes();
    }
  }

  selecionarCliente(cliente: Cliente): void {
    this.onClienteSelecionado.emit(cliente);
  }

  criarCliente(): void {
    if (this.clienteForm.invalid) {
      return;
    }

    const request: CriarClienteRequest = this.clienteForm.value;
    this.clienteService.criar(request)
      .subscribe({
        next: (cliente) => {
          this.clientes.update(lista => [...lista, cliente]);
          this.onClienteCriado.emit(cliente);
          this.clienteForm.reset();
          const totalClientes = this.clientes().length;
          const porPagina = this.clientesPorPagina();
          const ultimaPagina = Math.ceil(totalClientes / porPagina);
          this.paginaClientes.set(ultimaPagina);
        },
        error: (error) => {
          console.error('Erro ao criar cliente:', error);
          alert('Erro ao criar cliente. Tente novamente.');
        }
      });
  }

  paginaAnteriorClientes(): void {
    const paginaAtual = this.paginaClientes();
    if (paginaAtual > 1) {
      this.paginaClientes.set(paginaAtual - 1);
    }
  }

  proximaPaginaClientes(): void {
    const paginaAtual = this.paginaClientes();
    const totalPaginas = this.totalPaginasClientes();
    if (paginaAtual < totalPaginas) {
      this.paginaClientes.set(paginaAtual + 1);
    }
  }

  trocarCliente(): void {
    this.onTrocarCliente.emit();
  }
}

