import {
    Component,
    inject,
    signal,
    computed,
    OnInit,
    OnDestroy,
    ChangeDetectionStrategy,
    PLATFORM_ID,
    effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AdicionalService } from '../../services/adicional.service';
import {
    AutoAtendimentoService,
    CriarPedidoAutoAtendimentoRequest,
    ItemPedidoAutoAtendimentoRequest,
    MeioPagamentoAutoAtendimentoRequest
} from '../../services/autoatendimento.service';
import { Produto } from '../../services/produto.service';
import { ImageProxyUtil } from '../../utils/image-proxy.util';

import {
    useAutoAtendimentoCardapio,
    useAutoAtendimentoCarrinho,
    useAutoAtendimentoPagamento,
    useAutoAtendimentoCliente
} from './composables';

type EtapaTotem = 'inicio' | 'cardapio' | 'carrinho' | 'pagamento' | 'confirmacao' | 'sucesso';
type MeioPagamentoTipo = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

/**
 * Componente de auto atendimento para totem.
 * Baseado no pedido-cliente-mesa, mas com autenticação de operador.
 * Permite criar pedidos contínuos sem identificação obrigatória do cliente.
 */
@Component({
    selector: 'app-autoatendimento',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './autoatendimento.component.html',
    styleUrls: [
        './styles/base.css',
        './styles/cardapio.css',
        './styles/modal.css',
        './styles/carrinho.css',
        './styles/pagamento.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoatendimentoComponent implements OnInit, OnDestroy {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly router = inject(Router);
    private readonly authService = inject(AuthService);
    private readonly adicionalService = inject(AdicionalService);
    private readonly autoAtendimentoService = inject(AutoAtendimentoService);

    protected readonly Math = Math;

    // ========== Estado Geral ==========
    readonly carregando = signal(true);
    readonly erro = signal<string | null>(null);
    readonly etapaAtual = signal<EtapaTotem>('inicio');
    readonly enviando = signal(false);

    // Estado do pedido criado
    readonly pedidoCriado = signal<{ id: string; numeroPedido: number } | null>(null);

    // Timer de inatividade (em segundos)
    private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly INACTIVITY_TIMEOUT = 120; // 2 minutos
    readonly tempoInatividade = signal(0);
    readonly mostrarAvisoInatividade = signal(false);

    // ========== Composables ==========
    readonly cardapio = useAutoAtendimentoCardapio();
    readonly carrinho = useAutoAtendimentoCarrinho();
    readonly pagamento = useAutoAtendimentoPagamento(() => this.carrinho.totalValor());
    readonly cliente = useAutoAtendimentoCliente();

    // ========== Input para nome do cliente ==========
    nomeClienteInput = '';

    // ========== Computed ==========
    readonly operadorLogado = computed(() => this.authService.usuarioAtual());

    readonly podeEnviarPedido = computed(() =>
        this.carrinho.podeEnviarPedido() &&
        this.pagamento.pagamentoValido() &&
        !this.enviando()
    );

    constructor() {
        // Effect para carregar adicionais quando abre detalhes de produto
        effect(() => {
            const produto = this.carrinho.produtoSelecionado();
            if (produto && this.isBrowser && this.carrinho.mostrarDetalhes()) {
                // Usa setTimeout para evitar erro de signal write dentro de effect
                setTimeout(() => this.carregarAdicionaisProduto(produto.id), 0);
            }
        });
    }

    ngOnInit(): void {
        if (!this.isBrowser) return;

        // Verifica se operador está logado
        if (!this.authService.estaAutenticado()) {
            this.router.navigate(['/login'], {
                queryParams: { returnUrl: '/autoatendimento' }
            });
            return;
        }

        this.carregarCardapio();
        this.iniciarMonitoramentoInatividade();
    }

    ngOnDestroy(): void {
        this.pararMonitoramentoInatividade();
    }

    // ========== Carregamento ==========
    private async carregarCardapio(): Promise<void> {
        this.carregando.set(true);
        this.erro.set(null);

        try {
            await this.cardapio.carregar();
        } catch (e) {
            this.erro.set('Erro ao carregar cardápio. Tente novamente.');
            console.error('Erro ao carregar cardápio:', e);
        } finally {
            this.carregando.set(false);
        }
    }

    private carregarAdicionaisProduto(produtoId: string): void {
        this.carrinho.setCarregandoAdicionais(true);
        this.adicionalService.listarAdicionaisDoProduto(produtoId)
            .subscribe({
                next: (adicionais) => {
                    // Filtra apenas os disponíveis
                    const disponiveis = adicionais.filter(a => a.disponivel);
                    this.carrinho.setAdicionaisDisponiveis(disponiveis);
                    this.carrinho.setCarregandoAdicionais(false);
                },
                error: (err) => {
                    console.error('Erro ao carregar adicionais:', err);
                    this.carrinho.setAdicionaisDisponiveis([]);
                    this.carrinho.setCarregandoAdicionais(false);
                }
            });
    }

    // ========== Navegação ==========
    irParaCardapio(): void {
        this.etapaAtual.set('cardapio');
        this.resetarInatividade();
    }

    irParaCarrinho(): void {
        this.etapaAtual.set('carrinho');
        this.resetarInatividade();
    }

    irParaPagamento(): void {
        this.etapaAtual.set('pagamento');
        this.resetarInatividade();
    }

    irParaConfirmacao(): void {
        if (this.pagamento.pagamentoValido()) {
            this.etapaAtual.set('confirmacao');
            this.resetarInatividade();
        }
    }

    voltarEtapa(): void {
        const etapa = this.etapaAtual();
        switch (etapa) {
            case 'cardapio':
                this.etapaAtual.set('inicio');
                break;
            case 'carrinho':
                this.etapaAtual.set('cardapio');
                break;
            case 'pagamento':
                this.etapaAtual.set('carrinho');
                break;
            case 'confirmacao':
                this.etapaAtual.set('pagamento');
                break;
        }
        this.resetarInatividade();
    }

    // ========== Cardápio ==========
    abrirDetalhesProduto(produto: Produto): void {
        this.carrinho.abrirDetalhes(produto);
        this.resetarInatividade();
    }

    adicionarAoCarrinhoRapido(produto: Produto): void {
        // Adiciona direto ao carrinho sem abrir modal
        this.carrinho.abrirDetalhes(produto);
        this.carrinho.confirmarProduto();
        this.resetarInatividade();
    }

    // ========== Pedido ==========
    async finalizarPedido(): Promise<void> {
        if (!this.podeEnviarPedido()) return;

        this.enviando.set(true);
        this.resetarInatividade();

        try {
            const request = this.montarRequestPedido();
            console.log('[DEBUG] Request pedido:', JSON.stringify(request, null, 2));
            console.log('[DEBUG] Total carrinho:', this.carrinho.totalValor());
            console.log('[DEBUG] Total pagamento:', this.pagamento.meiosSelecionados().reduce((s, m) => s + m.valor, 0));
            const response = await firstValueFrom(
                this.autoAtendimentoService.criarPedido(request)
            );

            this.pedidoCriado.set({
                id: response.id,
                numeroPedido: response.numeroPedido
            });

            this.etapaAtual.set('sucesso');

            // Auto-reset após 10 segundos
            setTimeout(() => {
                this.novoAtendimento();
            }, 10000);

        } catch (e) {
            console.error('Erro ao criar pedido:', e);
            this.erro.set('Erro ao criar pedido. Tente novamente.');
        } finally {
            this.enviando.set(false);
        }
    }

    private montarRequestPedido(): CriarPedidoAutoAtendimentoRequest {
        const itens: ItemPedidoAutoAtendimentoRequest[] = this.carrinho.itens().map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            observacoes: item.observacao || undefined,
            adicionais: item.adicionais?.map(ad => ({
                adicionalId: ad.adicional.id,
                quantidade: ad.quantidade
            }))
        }));

        const meiosPagamento: MeioPagamentoAutoAtendimentoRequest[] =
            this.pagamento.meiosSelecionados().map((m: { tipo: string; valor: number }) => ({
                meioPagamento: m.tipo as MeioPagamentoAutoAtendimentoRequest['meioPagamento'],
                valor: m.valor
            }));

        return {
            nomeCliente: this.nomeClienteInput.trim() || undefined,
            itens,
            meiosPagamento
        };
    }

    novoAtendimento(): void {
        // Limpa tudo e volta para tela inicial
        this.carrinho.limparCarrinho();
        this.pagamento.resetar();
        this.cliente.limpar();
        this.nomeClienteInput = '';
        this.pedidoCriado.set(null);
        this.erro.set(null);
        this.etapaAtual.set('inicio');
        this.resetarInatividade();
    }

    cancelarPedido(): void {
        if (confirm('Deseja cancelar o pedido atual?')) {
            this.novoAtendimento();
        }
    }

    // ========== Inatividade ==========
    private iniciarMonitoramentoInatividade(): void {
        if (!this.isBrowser) return;

        document.addEventListener('touchstart', this.resetarInatividade.bind(this));
        document.addEventListener('click', this.resetarInatividade.bind(this));
        document.addEventListener('keypress', this.resetarInatividade.bind(this));

        this.resetarInatividade();
    }

    private pararMonitoramentoInatividade(): void {
        if (!this.isBrowser) return;

        document.removeEventListener('touchstart', this.resetarInatividade.bind(this));
        document.removeEventListener('click', this.resetarInatividade.bind(this));
        document.removeEventListener('keypress', this.resetarInatividade.bind(this));

        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
    }

    private resetarInatividade(): void {
        this.tempoInatividade.set(0);
        this.mostrarAvisoInatividade.set(false);

        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }

        // Só monitora inatividade se não estiver na tela inicial
        if (this.etapaAtual() !== 'inicio' && this.etapaAtual() !== 'sucesso') {
            this.inactivityTimer = setTimeout(() => {
                this.mostrarAvisoInatividade.set(true);

                // Dá mais 30 segundos antes de resetar
                setTimeout(() => {
                    if (this.mostrarAvisoInatividade()) {
                        this.novoAtendimento();
                    }
                }, 30000);
            }, this.INACTIVITY_TIMEOUT * 1000);
        }
    }

    continuarAtendimento(): void {
        this.mostrarAvisoInatividade.set(false);
        this.resetarInatividade();
    }

    // ========== Formatação ==========
    formatarPreco(valor: number): string {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }

    getImagemProduto(produto: Produto): string {
        if (produto.foto) {
            return ImageProxyUtil.getProxyUrl(produto.foto) || produto.foto;
        }
        return '';
    }

    // ========== Pagamento ==========
    selecionarMeioPagamento(tipo: MeioPagamentoTipo): void {
        this.pagamento.selecionarMeio(tipo);
        this.resetarInatividade();
    }

    // ========== Debug/Admin ==========
    sairDoTotem(): void {
        if (confirm('Deseja sair do modo totem?')) {
            this.router.navigate(['/']);
        }
    }
}
