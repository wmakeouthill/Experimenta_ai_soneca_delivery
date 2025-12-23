import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef, effect, untracked } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, interval, switchMap, catchError, of, firstValueFrom } from 'rxjs';
import {
    ClienteAuthService,
    ClienteAuth,
    CadastrarClienteDeliveryRequest,
    ClienteLoginRequest,
    AtualizarEnderecoRequest
} from '../../services/cliente-auth.service';
import { GoogleSignInService } from '../../services/google-signin.service';
import { DeliveryService, TipoPedido, CriarPedidoDeliveryRequest, ItemPedidoDeliveryRequest, StatusPedidoDelivery } from '../../services/delivery.service';
import { Produto } from '../../services/produto.service';
import { Categoria } from '../../services/categoria.service';
import { AdicionalService, Adicional } from '../../services/adicional.service';
import { CepService } from '../../services/cep.service';
import { MenuPerfilComponent } from '../menu-perfil/menu-perfil.component';
import { FooterNavComponent } from './components/footer-nav/footer-nav.component';
import { DraggableScrollDirective } from '../pedido-cliente-mesa/directives/draggable-scroll.directive';
import { useFavoritos, useInicio, useMeusPedidos, useSucessoPedido, useAvaliacao } from './composables';
import { useChatIA } from './composables/use-chat-ia';
import { GoogleMapsService } from '../../services/google-maps.service';
import { ChatIAButtonDeliveryComponent } from './components/chat-ia-button.component';
import { ChatIAFullscreenDeliveryComponent } from './components/chat-ia-fullscreen.component';
import { AcaoChat } from '../../services/chat-ia.service';
import { StatusLojaService, StatusLoja, StatusLojaResponse } from '../../services/status-loja.service';

type Etapa = 'boas-vindas' | 'login' | 'cadastro' | 'cardapio' | 'checkout' | 'sucesso';
type AbaDelivery = 'inicio' | 'cardapio' | 'carrinho' | 'perfil';
type SecaoPerfil = 'principal' | 'edicao' | 'pedidos' | 'favoritos';

interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
    observacao?: string;
    adicionais?: { adicional: Adicional; quantidade: number }[];
}

export type MeioPagamentoTipo = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

export interface MeioPagamentoSelecionado {
    tipo: MeioPagamentoTipo;
    valor: number;
}

interface FormCadastro {
    nome: string;
    telefone: string;
    email: string;
    senha: string;
    confirmarSenha: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pontoReferencia: string;
    latitude?: number;
    longitude?: number;
}

@Component({
    selector: 'app-pedido-delivery',
    standalone: true,
    imports: [CommonModule, FormsModule, MenuPerfilComponent, FooterNavComponent, ChatIAButtonDeliveryComponent, ChatIAFullscreenDeliveryComponent, DraggableScrollDirective],
    templateUrl: './pedido-delivery.component.html',
    styleUrls: [
        './styles/base.css',
        './styles/auth.css',
        './styles/cardapio.css',
        './styles/modal.css',
        './styles/abas.css',
        './styles/inicio.css',
        './styles/checkout.css',
        './styles/responsive.css'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidoDeliveryComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
    private readonly clienteAuthService = inject(ClienteAuthService);
    private readonly googleSignInService = inject(GoogleSignInService);
    private readonly deliveryService = inject(DeliveryService);
    private readonly googleMapsService = inject(GoogleMapsService);

    @ViewChild('mapContainer') mapContainer!: ElementRef;
    map: any;
    marker: any;
    errorMessageMap = '';
    private readonly adicionalService = inject(AdicionalService);
    private readonly cepService = inject(CepService);
    private readonly statusLojaService = inject(StatusLojaService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly destroy$ = new Subject<void>();

    constructor() {
        effect(() => {
            const cliente = this.cliente();
            untracked(() => {
                if (cliente) {
                    // Carregar dados dependentes do cliente
                    this.favoritos.carregar();
                    this.meusPedidos.carregar();
                    this.inicio.carregar();
                    this.avaliacao.carregarAvaliacoesCliente();
                } else {
                    // Limpar dados ao deslogar
                    if (this.favoritos?.limpar) this.favoritos.limpar();
                    if (this.meusPedidos?.limpar) this.meusPedidos.limpar();
                }
            });
        }, { allowSignalWrites: true });

        // Efeito para resetar renderização do botão Google quando a loja reabre
        effect(() => {
            const status = this.statusLoja();
            if (status === StatusLoja.ABERTA) {
                untracked(() => {
                    // Resetar flags de renderização pois o DOM pode ter sido recriado pelo @if/@else
                    this.googleButtonBoasVindasRendered = false;
                    this.googleButtonLoginRendered = false;
                    this.googleButtonCadastroRendered = false;

                    // Tenta renderizar novamente após um breve delay para o DOM estabilizar
                    setTimeout(() => {
                        this.renderizarBotaoGoogle();
                        this.cdr.detectChanges();
                    }, 200);
                });
            }
        });

        // Efeito para iniciar polling quando cliente logado tem pedidos em andamento
        // O polling mantém os status atualizados para o CTA global funcionar
        effect(() => {
            const secao = this.secaoPerfil();
            const cliente = this.cliente();
            const temEmAndamento = this.meusPedidos.temPedidosEmAndamento();
            untracked(() => {
                // Inicia polling se:
                // 1. Cliente está logado E está na seção de pedidos (para ver atualizações na lista)
                // 2. OU tem pedidos em andamento (para o CTA global funcionar)
                if (cliente && (secao === 'pedidos' || temEmAndamento)) {
                    this.meusPedidos.iniciarPolling();
                } else {
                    this.meusPedidos.pararPolling();
                }
            });
        });

        // Efeito para sincronizar o status do pedido em acompanhamento 
        // quando o meusPedidos atualiza via polling
        effect(() => {
            const pedidos = this.meusPedidos.pedidos();
            const pedidoEmAcompanhamento = this.sucessoPedido.pedidoId();
            untracked(() => {
                if (pedidoEmAcompanhamento && pedidos.length > 0) {
                    const pedidoAtualizado = pedidos.find(p => p.id === pedidoEmAcompanhamento);
                    if (pedidoAtualizado) {
                        // Atualiza o status no sucessoPedido com dados do histórico
                        this.sucessoPedido.atualizarStatusComDados(
                            pedidoAtualizado.status,
                            pedidoAtualizado.tipoPedido
                        );
                    }
                }
            });
        });
    }

    protected readonly Math = Math;

    // Estado geral
    readonly carregando = signal(true);
    readonly erro = signal<string | null>(null);
    readonly etapaAtual = signal<Etapa>('boas-vindas');
    readonly enviando = signal(false);

    // Status da loja (sessão de trabalho)
    readonly statusLoja = signal<StatusLoja>(StatusLoja.FECHADA);
    readonly mensagemStatusLoja = signal<string | null>(null);
    readonly verificandoStatusLoja = signal(true);

    // Cliente autenticado
    readonly cliente = signal<ClienteAuth | null>(null);

    // Login
    readonly loginTelefone = signal('');
    readonly loginSenha = signal('');
    readonly loginCarregando = signal(false);

    // Cadastro
    readonly formCadastro = signal<FormCadastro>({
        nome: '',
        telefone: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        pontoReferencia: ''
    });
    readonly cadastroCarregando = signal(false);
    readonly etapaCadastro = signal<'dados' | 'endereco'>('dados');
    readonly buscandoCep = signal(false);
    readonly cepEncontrado = signal<boolean | null>(null); // null = não buscou, true = encontrado, false = não encontrado

    // Google Auth
    readonly googleIniciado = signal(false);
    private googleButtonBoasVindasRendered = false;
    private googleButtonLoginRendered = false;
    private googleButtonCadastroRendered = false;
    @ViewChild('googleButtonBoasVindas') googleButtonBoasVindasRef?: ElementRef<HTMLDivElement>;
    @ViewChild('googleButtonLogin') googleButtonLoginRef?: ElementRef<HTMLDivElement>;
    @ViewChild('googleButtonCadastro') googleButtonCadastroRef?: ElementRef<HTMLDivElement>;

    // Tipo de pedido
    readonly tipoPedido = signal<TipoPedido>('DELIVERY');
    readonly enderecoEntrega = signal('');

    // Cardápio
    readonly categorias = signal<Categoria[]>([]);
    readonly produtos = signal<Produto[]>([]);
    readonly categoriaSelecionada = signal<string | null>(null);

    // Carrinho
    readonly itensCarrinho = signal<ItemCarrinho[]>([]);
    readonly mostrarCarrinho = signal(false);

    // Detalhes do produto
    readonly produtoSelecionado = signal<Produto | null>(null);
    readonly quantidadeSelecionada = signal(1);
    readonly observacaoItem = signal('');
    readonly mostrarDetalhes = signal(false);
    readonly adicionaisDisponiveis = signal<Adicional[]>([]);
    readonly adicionaisSelecionados = signal<{ adicional: Adicional; quantidade: number }[]>([]);
    readonly carregandoAdicionais = signal(false);
    readonly adicionaisExpandido = signal(false);

    // PWA
    readonly mostrarBannerPwa = signal(false);
    private deferredPrompt: any = null;

    // Pagamento
    // Pagamento
    readonly meiosPagamentoSelecionados = signal<MeioPagamentoSelecionado[]>([]);
    readonly pagamentoDividido = signal(false);

    readonly totalAlocado = computed(() =>
        this.meiosPagamentoSelecionados().reduce((sum, m) => sum + m.valor, 0)
    );

    readonly valorRestante = computed(() =>
        this.totalCarrinho() - this.totalAlocado()
    );

    readonly pagamentoValido = computed(() => {
        if (this.meiosPagamentoSelecionados().length === 0) return false;
        if (this.pagamentoDividido()) {
            return Math.abs(this.totalAlocado() - this.totalCarrinho()) < 0.01;
        }
        return true;
    });

    // Sucesso
    readonly pedidoId = signal<string | null>(null);
    readonly statusPedido = signal<StatusPedidoDelivery | null>(null);

    // Navegação por Abas
    readonly abaAtual = signal<AbaDelivery>('inicio');
    readonly secaoPerfil = signal<SecaoPerfil>('principal');

    // CTA Telefone (flutuante)
    readonly ctaTelefoneFechado = signal(false);

    // ========== COMPOSABLES ==========
    readonly favoritos = useFavoritos(
        () => this.cliente()?.id,
        () => this.produtos()
    );

    readonly inicio = useInicio(
        () => this.cliente()?.id,
        () => this.favoritos.produtosFavoritos(),
        () => this.produtos()
    );

    readonly meusPedidos = useMeusPedidos(
        () => this.cliente()?.id
    );

    readonly chatIA = useChatIA(
        () => this.cliente()?.id,
        (acao: AcaoChat) => this.executarAcaoChat(acao)
    );

    readonly sucessoPedido = useSucessoPedido();

    readonly avaliacao = useAvaliacao(
        () => this.cliente()?.id,
        () => this.meusPedidos.pedidoSelecionado(),
        (pedidoId: string) => this.meusPedidos.marcarComoAvaliado(pedidoId)
    );

    // ========== COMPUTED ==========

    readonly deveMostrarCtaTelefone = computed(() => {
        // Mostra CTA quando cliente logado não tem telefone e está no cardápio
        return this.etapaAtual() === 'cardapio' &&
            this.cliente() &&
            !this.cliente()?.telefone &&
            !this.ctaTelefoneFechado();
    });

    readonly deveMostrarCtaTelefoneGlobal = computed(() => {
        // Mostra CTA global quando cliente logado não tem telefone
        return this.cliente() &&
            !this.cliente()?.telefone &&
            !this.ctaTelefoneFechado() &&
            this.etapaAtual() !== 'boas-vindas' &&
            this.etapaAtual() !== 'login' &&
            this.etapaAtual() !== 'cadastro';
    });

    readonly loginValido = computed(() => {
        const tel = this.loginTelefone().replace(/\D/g, '');
        return tel.length >= 10 && this.loginSenha().length >= 6;
    });

    readonly dadosCadastroValidos = computed(() => {
        const form = this.formCadastro();
        const tel = form.telefone.replace(/\D/g, '');
        return (
            form.nome.trim().length >= 2 &&
            tel.length >= 10 &&
            form.senha.length >= 6 &&
            form.senha === form.confirmarSenha
        );
    });

    readonly enderecoCadastroValido = computed(() => {
        const form = this.formCadastro();
        const cep = form.cep.replace(/\D/g, '');
        return (
            form.logradouro.trim().length >= 3 &&
            form.numero.trim().length >= 1 &&
            form.bairro.trim().length >= 2 &&
            form.cidade.trim().length >= 2 &&
            form.estado.length === 2 &&
            cep.length === 8
        );
    });

    readonly produtosFiltrados = computed(() => {
        const cat = this.categoriaSelecionada();
        if (!cat) return this.produtos();
        return this.produtos().filter(p => p.categoria === cat);
    });

    /**
     * Agrupa produtos por categoria para exibição organizada.
     * Usado quando nenhuma categoria específica está selecionada.
     */
    readonly produtosAgrupadosPorCategoria = computed(() => {
        const todosProdutos = this.produtos();
        const categoriasAtivas = this.categorias();

        const grupos: { id: string; nome: string; produtos: Produto[] }[] = [];

        for (const cat of categoriasAtivas) {
            const produtosDaCategoria = todosProdutos.filter(p => p.categoria === cat.nome);
            if (produtosDaCategoria.length > 0) {
                grupos.push({
                    id: cat.id,
                    nome: cat.nome,
                    produtos: produtosDaCategoria
                });
            }
        }

        return grupos;
    });

    readonly totalCarrinho = computed(() => {
        return this.itensCarrinho().reduce((acc, item) => {
            let itemTotal = item.produto.preco * item.quantidade;
            if (item.adicionais) {
                itemTotal += item.adicionais.reduce(
                    (adAcc, ad) => adAcc + ad.adicional.preco * ad.quantidade * item.quantidade,
                    0
                );
            }
            return acc + itemTotal;
        }, 0);
    });

    readonly quantidadeItensCarrinho = computed(() =>
        this.itensCarrinho().reduce((acc, item) => acc + item.quantidade, 0)
    );

    readonly carrinhoVazio = computed(() => this.itensCarrinho().length === 0);

    readonly podeEnviarPedido = computed(() => {
        if (this.carrinhoVazio()) return false;
        if (!this.pagamentoValido()) return false;
        if (this.tipoPedido() === 'DELIVERY' && !this.enderecoEntrega().trim()) return false;
        return true;
    });

    readonly enderecoObrigatorio = computed(() => this.tipoPedido() === 'DELIVERY');

    executarAcaoChat(acao: AcaoChat): void {
        console.log('Executando ação do chat:', acao);

        switch (acao.tipo) {
            case 'ADICIONAR_CARRINHO':
            case 'VER_DETALHES':
                if (acao.produtoId) {
                    const produto = this.produtos().find(p => p.id === acao.produtoId);
                    if (produto) {
                        this.abrirDetalhesProduto(produto);
                        this.chatIA.fecharChat();
                    }
                }
                break;

            case 'VER_CARRINHO':
                this.navegarPara('carrinho');
                this.chatIA.fecharChat();
                break;

            case 'FINALIZAR_PEDIDO':
                if (this.itensCarrinho().length > 0) {
                    this.irParaCheckout();
                    this.chatIA.fecharChat();
                } else {
                    this.navegarPara('carrinho');
                    this.chatIA.fecharChat();
                }
                break;
        }
    }

    // ========== LIFECYCLE ==========

    ngOnInit(): void {
        if (this.isBrowser) {
            // Verificar status da loja PRIMEIRO
            this.verificarStatusLoja();

            this.chatIA.inicializar(); // Inicializa o chat e histórico

            // PWA Install Prompt
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.mostrarBannerPwa.set(true);
            });

            // Verificar se já está logado
            const clienteLogado = this.clienteAuthService.clienteLogado;
            if (clienteLogado) {
                this.cliente.set(clienteLogado);

                // Só vai para cardápio se tiver endereço cadastrado
                if (clienteLogado.enderecoFormatado) {
                    this.enderecoEntrega.set(clienteLogado.enderecoFormatado);
                    this.etapaAtual.set('cardapio');
                } else {
                    // Cliente sem endereço - precisa completar cadastro
                    this.etapaAtual.set('cadastro');
                    this.etapaCadastro.set('endereco');
                    // Preencher dados básicos no formulário
                    this.formCadastro.update(form => ({
                        ...form,
                        nome: clienteLogado.nome || '',
                        telefone: clienteLogado.telefone || '',
                        email: clienteLogado.email || ''
                    }));
                }
            }
            this.carregarCardapio();
            this.inicializarGoogleAuth();

            // Conectar ao stream de status da loja (SSE)
            this.conectarStatusLojaSSE();
        } else {
            this.carregando.set(false);
            this.verificandoStatusLoja.set(false);
        }
    }

    /**
     * Verifica o status da loja (sessão de trabalho).
     * Se fechada ou pausada, bloqueia o acesso ao delivery.
     */
    verificarStatusLoja(): void {
        this.verificandoStatusLoja.set(true);
        this.statusLojaService.verificarStatus().subscribe({
            next: (response) => {
                this.statusLoja.set(response.status);
                this.mensagemStatusLoja.set(response.mensagem);
                this.verificandoStatusLoja.set(false);
            },
            error: () => {
                // Em caso de erro, assume fechada por segurança
                this.statusLoja.set(StatusLoja.FECHADA);
                this.mensagemStatusLoja.set('Não foi possível verificar o status da loja.');
                this.verificandoStatusLoja.set(false);
            }
        });
    }

    /**
     * Conecta ao stream SSE de status da loja para feedback em tempo real.
     */
    private conectarStatusLojaSSE(): void {
        this.statusLojaService.conectarStream()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    // Só atualiza se mudou (embora o signal já lide com isso, é bom ser explícito)
                    this.statusLoja.set(response.status);
                    this.mensagemStatusLoja.set(response.mensagem);

                    // Se o status for alterado, remove o loading se estiver ativo
                    if (this.verificandoStatusLoja()) {
                        this.verificandoStatusLoja.set(false);
                    }
                },
                error: (e) => {
                    console.error('Erro no stream de status da loja:', e);
                }
            });
    }

    ngAfterViewInit(): void {
        this.renderizarBotaoGoogle();
    }

    ngAfterViewChecked(): void {
        this.renderizarBotaoGoogle();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.sucessoPedido.destroy();
        this.meusPedidos.destroy();
    }

    // ========== GOOGLE AUTH ==========

    private async inicializarGoogleAuth(): Promise<void> {
        if (!this.isBrowser) return;

        try {
            await this.googleSignInService.initialize();
            this.googleIniciado.set(true);
            console.debug('[Google] SDK inicializado com sucesso');

            // Força detecção de mudanças e renderização do botão
            this.cdr.detectChanges();
            setTimeout(() => this.renderizarBotaoGoogle(), 100);

            // Escutar credenciais do Google
            this.googleSignInService.credential$
                .pipe(takeUntil(this.destroy$))
                .subscribe(async (token) => {
                    await this.processarLoginGoogle(token);
                });
        } catch (e) {
            console.error('Erro ao inicializar Google Sign-In:', e);
        }
    }

    private renderizarBotaoGoogle(): void {
        if (!this.isBrowser || !this.googleIniciado()) {
            console.debug('[Google] Não pode renderizar: isBrowser=', this.isBrowser, 'googleIniciado=', this.googleIniciado());
            return;
        }

        const etapa = this.etapaAtual();
        console.debug('[Google] Renderizando para etapa:', etapa, {
            boasVindasRef: !!this.googleButtonBoasVindasRef?.nativeElement,
            boasVindasRendered: this.googleButtonBoasVindasRendered,
            loginRef: !!this.googleButtonLoginRef?.nativeElement,
            loginRendered: this.googleButtonLoginRendered
        });

        // Renderizar botão na tela de boas-vindas
        if (etapa === 'boas-vindas' && !this.googleButtonBoasVindasRendered && this.googleButtonBoasVindasRef?.nativeElement) {
            try {
                this.googleSignInService.renderButton(this.googleButtonBoasVindasRef.nativeElement, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 300
                });
                this.googleButtonBoasVindasRendered = true;
            } catch (e) {
                console.error('Erro ao renderizar botão Google (boas-vindas):', e);
            }
        }

        // Renderizar botão na tela de login
        if (etapa === 'login' && !this.googleButtonLoginRendered && this.googleButtonLoginRef?.nativeElement) {
            try {
                this.googleSignInService.renderButton(this.googleButtonLoginRef.nativeElement, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 300
                });
                this.googleButtonLoginRendered = true;
            } catch (e) {
                console.error('Erro ao renderizar botão Google (login):', e);
            }
        }

        // Renderizar botão na tela de cadastro
        if (etapa === 'cadastro' && !this.googleButtonCadastroRendered && this.googleButtonCadastroRef?.nativeElement) {
            try {
                this.googleSignInService.renderButton(this.googleButtonCadastroRef.nativeElement, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'rectangular',
                    width: 300
                });
                this.googleButtonCadastroRendered = true;
            } catch (e) {
                console.error('Erro ao renderizar botão Google (cadastro):', e);
            }
        }
    }

    private async processarLoginGoogle(idToken: string): Promise<void> {
        this.loginCarregando.set(true);
        this.erro.set(null);

        try {
            const response = await firstValueFrom(this.clienteAuthService.loginGoogle(idToken));
            this.cliente.set(response.cliente);

            // Se cliente Google não tem endereço, ir para cadastro de endereço
            if (!response.cliente.temEndereco) {
                this.etapaCadastro.set('endereco');
                this.etapaAtual.set('cadastro');
            } else {
                if (response.cliente.enderecoFormatado) {
                    this.enderecoEntrega.set(response.cliente.enderecoFormatado);
                }
                this.etapaAtual.set('cardapio');
            }
        } catch (e: any) {
            console.error('Erro no login com Google:', e);
            this.erro.set(e?.error?.message || 'Erro ao fazer login com Google');
        } finally {
            this.loginCarregando.set(false);
        }
    }

    // ========== LOGIN ==========

    formatarTelefone(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 2) return numeros;
        if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }

    onLoginTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.loginTelefone.set(formatted);
    }

    async fazerLogin(): Promise<void> {
        if (!this.loginValido()) return;

        this.loginCarregando.set(true);
        this.erro.set(null);

        const request: ClienteLoginRequest = {
            telefone: this.loginTelefone().replace(/\D/g, ''),
            senha: this.loginSenha()
        };

        try {
            const response = await firstValueFrom(this.clienteAuthService.login(request));
            this.cliente.set(response.cliente);

            // Se cliente não tem endereço, ir para cadastro de endereço
            if (!response.cliente.temEndereco) {
                this.etapaCadastro.set('endereco');
                this.etapaAtual.set('cadastro');
                // Preencher dados do cliente no formulário
                this.formCadastro.update(form => ({
                    ...form,
                    nome: response.cliente.nome || '',
                    telefone: response.cliente.telefone || '',
                    email: response.cliente.email || ''
                }));
            } else {
                if (response.cliente.enderecoFormatado) {
                    this.enderecoEntrega.set(response.cliente.enderecoFormatado);
                }
                this.etapaAtual.set('cardapio');
            }
        } catch (e: any) {
            console.error('Erro no login:', e);
            this.erro.set(e?.error?.message || 'Telefone ou senha incorretos');
        } finally {
            this.loginCarregando.set(false);
        }
    }

    // ========== CADASTRO ==========

    onCadastroTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.atualizarFormCadastro('telefone', formatted);
    }

    formatarCep(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 5) return numeros;
        return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
    }

    onCepChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarCep(input.value);
        this.atualizarFormCadastro('cep', formatted);

        // Reset feedback quando digitar
        this.cepEncontrado.set(null);

        // Buscar CEP quando tiver 8 dígitos
        const cep = formatted.replace(/\D/g, '');
        if (cep.length === 8) {
            this.buscarCep(cep);
        }
    }

    private buscarCep(cep: string): void {
        this.buscandoCep.set(true);
        this.cepEncontrado.set(null);

        this.cepService.buscarPorCep(cep).subscribe({
            next: (endereco) => {
                if (endereco) {
                    this.atualizarFormCadastro('logradouro', endereco.logradouro);
                    this.atualizarFormCadastro('bairro', endereco.bairro);
                    this.atualizarFormCadastro('cidade', endereco.cidade);
                    this.atualizarFormCadastro('estado', endereco.estado);
                    this.cepEncontrado.set(true);
                    this.atualizarMapaComEndereco();
                } else {
                    this.cepEncontrado.set(false);
                }
                this.buscandoCep.set(false);
            },
            error: () => {
                this.cepEncontrado.set(false);
                this.buscandoCep.set(false);
            }
        });
    }

    atualizarFormCadastro<K extends keyof FormCadastro>(campo: K, valor: FormCadastro[K]): void {
        this.formCadastro.update(form => ({ ...form, [campo]: valor }));
    }

    avancarParaEndereco(): void {
        if (this.dadosCadastroValidos()) {
            this.etapaCadastro.set('endereco');
        }
    }

    voltarParaDados(): void {
        this.etapaCadastro.set('dados');
    }

    async finalizarCadastro(): Promise<void> {
        if (!this.enderecoCadastroValido()) return;

        this.cadastroCarregando.set(true);
        this.erro.set(null);

        const form = this.formCadastro();

        try {
            // Se cliente já está logado, apenas atualizar endereço
            if (this.cliente()) {
                const enderecoRequest: AtualizarEnderecoRequest = {
                    logradouro: form.logradouro.trim(),
                    numero: form.numero.trim(),
                    complemento: form.complemento.trim() || undefined,
                    bairro: form.bairro.trim(),
                    cidade: form.cidade.trim(),
                    estado: form.estado.toUpperCase(),
                    cep: form.cep.replace(/\D/g, ''),
                    pontoReferencia: form.pontoReferencia.trim() || undefined,
                    latitude: form.latitude,
                    longitude: form.longitude
                };

                const clienteAtualizado = await firstValueFrom(this.clienteAuthService.atualizarEndereco(enderecoRequest));
                this.cliente.set(clienteAtualizado);
                if (clienteAtualizado.enderecoFormatado) {
                    this.enderecoEntrega.set(clienteAtualizado.enderecoFormatado);
                }
                this.etapaAtual.set('cardapio');
            } else {
                // Cliente não logado - fazer cadastro completo
                const request: CadastrarClienteDeliveryRequest = {
                    nome: form.nome.trim(),
                    telefone: form.telefone.replace(/\D/g, ''),
                    email: form.email.trim() || undefined,
                    senha: form.senha,
                    logradouro: form.logradouro.trim(),
                    numero: form.numero.trim(),
                    complemento: form.complemento.trim() || undefined,
                    bairro: form.bairro.trim(),
                    cidade: form.cidade.trim(),
                    estado: form.estado.toUpperCase(),
                    cep: form.cep.replace(/\D/g, ''),
                    pontoReferencia: form.pontoReferencia.trim() || undefined,
                    latitude: form.latitude,
                    longitude: form.longitude
                };

                const response = await firstValueFrom(this.clienteAuthService.cadastrarDelivery(request));
                this.cliente.set(response.cliente);
                if (response.cliente.enderecoFormatado) {
                    this.enderecoEntrega.set(response.cliente.enderecoFormatado);
                }
                this.etapaAtual.set('cardapio');
            }
        } catch (e: any) {
            console.error('Erro no cadastro:', e);
            this.erro.set(e?.error?.message || 'Erro ao cadastrar. Tente novamente.');
        } finally {
            this.cadastroCarregando.set(false);
        }
    }

    // ========== NAVEGAÇÃO ==========

    irParaLogin(): void {
        this.erro.set(null);
        this.googleButtonLoginRendered = false;
        this.etapaAtual.set('login');
    }

    irParaCadastro(): void {
        this.erro.set(null);
        this.googleButtonCadastroRendered = false;
        this.etapaCadastro.set('dados');
        this.etapaAtual.set('cadastro');
    }

    irParaBoasVindas(): void {
        this.erro.set(null);
        this.googleButtonBoasVindasRendered = false;
        this.googleButtonLoginRendered = false;
        this.googleButtonCadastroRendered = false;
        this.etapaAtual.set('boas-vindas');
    }

    logout(): void {
        this.clienteAuthService.logout();
        this.cliente.set(null);
        this.itensCarrinho.set([]);
        this.googleButtonBoasVindasRendered = false;
        this.googleButtonLoginRendered = false;
        this.googleButtonCadastroRendered = false;
        this.etapaAtual.set('boas-vindas');
    }

    // ========== NAVEGAÇÃO POR ABAS ==========

    navegarPara(aba: AbaDelivery): void {
        this.abaAtual.set(aba);
        // Reset seção do perfil quando navegar para ele
        if (aba === 'perfil') {
            this.secaoPerfil.set('principal');
        }
        // Carregar meus pedidos quando ir para a seção de pedidos
        if (aba === 'perfil') {
            // Pré-carregar pedidos para quando abrir a seção
        }
    }

    /**
     * Volta para a tela inicial mantendo o pedido em acompanhamento.
     */
    voltarParaInicio(): void {
        this.etapaAtual.set('cardapio');
        this.abaAtual.set('inicio');
    }

    // ========== FAVORITOS ==========

    toggleFavorito(produtoId: string, event: Event): void {
        event.stopPropagation();
        this.favoritos.toggle(produtoId);
    }

    // ========== PWA ==========

    async instalarPwa(): Promise<void> {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                this.deferredPrompt = null;
            }
            this.mostrarBannerPwa.set(false);
        }
    }

    fecharBannerPwa(): void {
        this.mostrarBannerPwa.set(false);
    }

    abrirMenuPerfil(): void {
        this.navegarPara('perfil');
    }

    onClienteAtualizado(clienteAtualizado: ClienteAuth): void {
        this.cliente.set(clienteAtualizado);
        if (clienteAtualizado.enderecoFormatado) {
            this.enderecoEntrega.set(clienteAtualizado.enderecoFormatado);
        }
    }

    // ========== CTA TELEFONE ==========

    fecharCtaTelefone(): void {
        this.ctaTelefoneFechado.set(true);
    }

    abrirPerfilParaCadastrarTelefone(): void {
        this.navegarPara('perfil');
        this.secaoPerfil.set('edicao');
        this.ctaTelefoneFechado.set(true);
    }

    // ========== CTA AVALIAÇÃO ==========

    readonly ctaAvaliacaoFechado = signal(false);

    fecharCtaAvaliacao(): void {
        this.ctaAvaliacaoFechado.set(true);
    }

    abrirAvaliacaoPedido(): void {
        const pedido = this.meusPedidos.primeiroPedidoNaoAvaliado();
        if (pedido) {
            this.navegarPara('perfil');
            this.secaoPerfil.set('pedidos');
            // Aguarda a navegação e seleciona o pedido
            setTimeout(() => {
                this.meusPedidos.selecionarPedido(pedido);
            }, 100);
        }
        this.ctaAvaliacaoFechado.set(true);
    }

    // ========== CTA ACOMPANHAMENTO ==========

    readonly ctaAcompanhamentoFechado = signal(false);

    fecharCtaAcompanhamento(): void {
        this.ctaAcompanhamentoFechado.set(true);
    }

    irParaAcompanhamento(): void {
        this.etapaAtual.set('sucesso');
    }

    /**
     * Acompanha o primeiro pedido em andamento do histórico.
     * Inicia o acompanhamento com dados do histórico e navega para a tela.
     */
    acompanharPedidoEmAndamento(): void {
        const pedidosEmAndamento = this.meusPedidos.pedidosEmAndamento();
        if (pedidosEmAndamento.length > 0) {
            const pedido = pedidosEmAndamento[0];
            // Inicia o acompanhamento com dados do histórico (sem chamar API pública)
            this.sucessoPedido.iniciarAcompanhamentoComDados({
                id: pedido.id,
                status: pedido.status,
                tipoPedido: pedido.tipoPedido,
                total: pedido.total,
                createdAt: pedido.createdAt
            });
            // Configura o tipo de pedido para a exibição correta da timeline
            if (pedido.tipoPedido === 'RETIRADA') {
                this.tipoPedido.set('RETIRADA');
            } else {
                this.tipoPedido.set('DELIVERY');
            }
            this.etapaAtual.set('sucesso');
        }
    }

    /**
     * Acompanha um pedido específico pelo ID.
     * Útil para quando o usuário clica em um pedido específico em "Meus Pedidos".
     */
    acompanharPedidoPorId(pedidoId: string, tipoPedido: 'DELIVERY' | 'RETIRADA' | 'MESA'): void {
        // Busca os dados completos do pedido no histórico
        const pedido = this.meusPedidos.pedidos().find(p => p.id === pedidoId);
        if (pedido) {
            // Usa dados do histórico (sem chamar API pública que retorna 404)
            this.sucessoPedido.iniciarAcompanhamentoComDados({
                id: pedido.id,
                status: pedido.status,
                tipoPedido: pedido.tipoPedido,
                total: pedido.total,
                createdAt: pedido.createdAt
            });
        } else {
            // Fallback: cria dados mínimos se não encontrar no histórico
            this.sucessoPedido.iniciarAcompanhamentoComDados({
                id: pedidoId,
                status: 'AGUARDANDO_ACEITACAO',
                tipoPedido: tipoPedido
            });
        }
        if (tipoPedido === 'RETIRADA') {
            this.tipoPedido.set('RETIRADA');
        } else {
            this.tipoPedido.set('DELIVERY');
        }
        // Fecha o modal de detalhes se estiver aberto
        this.meusPedidos.fecharDetalhes();
        this.etapaAtual.set('sucesso');
    }

    // ========== CARDÁPIO ==========

    private carregarCardapio(): void {
        this.carregando.set(true);

        this.deliveryService.buscarCardapio().subscribe({
            next: (cardapio) => {
                this.categorias.set(cardapio.categorias);
                this.produtos.set(cardapio.produtos.filter(p => p.disponivel));
                this.carregando.set(false);
                // Carregar destaques da home (agora que temos produtos para fallback)
                this.inicio.carregar();
            },
            error: () => {
                this.erro.set('Erro ao carregar cardápio. Tente novamente.');
                this.carregando.set(false);
            }
        });
    }

    selecionarCategoria(categoria: string | null): void {
        this.categoriaSelecionada.set(categoria);
    }

    // ========== PRODUTO/CARRINHO ==========

    abrirDetalhesProduto(produto: Produto): void {
        this.produtoSelecionado.set(produto);
        this.quantidadeSelecionada.set(1);
        this.observacaoItem.set('');
        this.adicionaisSelecionados.set([]);
        this.adicionaisExpandido.set(false); // Inicia colapsado
        this.mostrarDetalhes.set(true);
        this.carregarAdicionais(produto.id);
        // Trava scroll do body
        document.body.style.overflow = 'hidden';
    }

    fecharDetalhes(): void {
        this.mostrarDetalhes.set(false);
        this.produtoSelecionado.set(null);
        this.adicionaisDisponiveis.set([]);
        // Libera scroll do body
        document.body.style.overflow = '';
    }

    toggleAdicionaisExpandido(): void {
        this.adicionaisExpandido.update(v => !v);
    }

    private carregarAdicionais(produtoId: string): void {
        this.carregandoAdicionais.set(true);
        // Usa endpoint público para não exigir autenticação de admin/operador
        this.adicionalService.listarAdicionaisDoProdutoPublico(produtoId).subscribe({
            next: (adicionais) => {
                // O backend já filtra os disponíveis, mas mantemos o filtro por segurança
                this.adicionaisDisponiveis.set(adicionais.filter(a => a.disponivel));
                this.carregandoAdicionais.set(false);
            },
            error: () => {
                this.adicionaisDisponiveis.set([]);
                this.carregandoAdicionais.set(false);
            }
        });
    }

    incrementarQuantidade(): void {
        this.quantidadeSelecionada.update(q => q + 1);
    }

    decrementarQuantidade(): void {
        this.quantidadeSelecionada.update(q => Math.max(1, q - 1));
    }

    toggleAdicional(adicional: Adicional): void {
        const selecionados = this.adicionaisSelecionados();
        const index = selecionados.findIndex(a => a.adicional.id === adicional.id);

        if (index >= 0) {
            this.adicionaisSelecionados.set(selecionados.filter(a => a.adicional.id !== adicional.id));
        } else {
            this.adicionaisSelecionados.set([...selecionados, { adicional, quantidade: 1 }]);
        }
    }

    isAdicionalSelecionado(adicionalId: string): boolean {
        return this.adicionaisSelecionados().some(a => a.adicional.id === adicionalId);
    }

    getQuantidadeAdicional(adicionalId: string): number {
        const item = this.adicionaisSelecionados().find(a => a.adicional.id === adicionalId);
        return item?.quantidade ?? 0;
    }

    incrementarAdicional(adicionalId: string): void {
        this.adicionaisSelecionados.update(selecionados =>
            selecionados.map(a =>
                a.adicional.id === adicionalId
                    ? { ...a, quantidade: a.quantidade + 1 }
                    : a
            )
        );
    }

    decrementarAdicional(adicionalId: string): void {
        const selecionados = this.adicionaisSelecionados();
        const item = selecionados.find(a => a.adicional.id === adicionalId);

        if (!item) return;

        if (item.quantidade <= 1) {
            // Remove o adicional se a quantidade for 1 ou menos
            this.adicionaisSelecionados.set(selecionados.filter(a => a.adicional.id !== adicionalId));
        } else {
            // Decrementa a quantidade
            this.adicionaisSelecionados.update(s =>
                s.map(a =>
                    a.adicional.id === adicionalId
                        ? { ...a, quantidade: a.quantidade - 1 }
                        : a
                )
            );
        }
    }

    subtotalAdicionais(): number {
        return this.adicionaisSelecionados().reduce(
            (total, item) => total + (item.adicional.preco * item.quantidade),
            0
        );
    }

    formatarAdicionaisItem(item: ItemCarrinho): string {
        if (!item.adicionais || item.adicionais.length === 0) {
            return '';
        }
        return item.adicionais.map(a => a.adicional.nome).join(', ');
    }

    calcularTotalItem(item: ItemCarrinho): number {
        let totalUnitario = item.produto.preco;
        if (item.adicionais) {
            totalUnitario += item.adicionais.reduce((acc, ad) => acc + (ad.adicional.preco * ad.quantidade), 0);
        }
        return totalUnitario * item.quantidade;
    }

    atualizarMapaComEndereco() {
        const form = this.formCadastro();
        const endereco = `${form.logradouro}, ${form.numero}, ${form.cidade} - ${form.estado}`;
        if (endereco.length < 10) return;

        this.googleMapsService.geocodeAddress(endereco).then(coords => {
            if (coords) {
                this.atualizarFormCadastro('latitude', coords.lat);
                this.atualizarFormCadastro('longitude', coords.lng);
                this.errorMessageMap = '';
                this.inicializarOuAtualizarMapa(coords.lat, coords.lng);
            } else {
                this.errorMessageMap = 'Não foi possível localizar o endereço no mapa.';
            }
        });
    }

    inicializarOuAtualizarMapa(lat: number, lng: number) {
        this.googleMapsService.getGoogleMaps().then(maps => {
            if (!this.mapContainer) return;

            const position = { lat, lng };
            if (!this.map) {
                this.map = new maps.Map(this.mapContainer.nativeElement, {
                    center: position,
                    zoom: 15
                });
                this.marker = new maps.Marker({
                    position: position,
                    map: this.map,
                    draggable: true,
                    title: "Local de Entrega"
                });

                this.marker.addListener('dragend', () => {
                    const pos = this.marker.getPosition();
                    this.atualizarFormCadastro('latitude', pos.lat());
                    this.atualizarFormCadastro('longitude', pos.lng());
                });
            } else {
                this.map.setCenter(position);
                this.marker.setPosition(position);
            }
        }).catch(() => {
            this.errorMessageMap = 'Erro ao carregar o mapa. Verifique a chave API.';
        });
    }

    adicionarAoCarrinho(): void {
        const produto = this.produtoSelecionado();
        if (!produto) return;

        const novoItem: ItemCarrinho = {
            produto,
            quantidade: this.quantidadeSelecionada(),
            observacao: this.observacaoItem() || undefined,
            adicionais: this.adicionaisSelecionados().length > 0
                ? [...this.adicionaisSelecionados()]
                : undefined
        };

        const itens = this.itensCarrinho();
        const itemExistente = itens.find(
            i => i.produto.id === produto.id &&
                i.observacao === novoItem.observacao &&
                JSON.stringify(i.adicionais) === JSON.stringify(novoItem.adicionais)
        );

        if (itemExistente) {
            this.itensCarrinho.set(
                itens.map(i =>
                    i === itemExistente
                        ? { ...i, quantidade: i.quantidade + novoItem.quantidade }
                        : i
                )
            );
        } else {
            this.itensCarrinho.set([...itens, novoItem]);
        }

        this.fecharDetalhes();
    }

    removerDoCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        this.itensCarrinho.set(itens.filter((_, i) => i !== index));
    }

    /**
     * Adiciona um produto ao carrinho rapidamente (quantidade 1, sem adicionais).
     * Usado pelo botão '+' no card do produto.
     */
    adicionarAoCarrinhoRapido(produto: Produto): void {
        const novoItem: ItemCarrinho = {
            produto,
            quantidade: 1
        };

        const itens = this.itensCarrinho();
        const itemExistente = itens.find(
            i => i.produto.id === produto.id && !i.observacao && !i.adicionais
        );

        if (itemExistente) {
            this.itensCarrinho.set(
                itens.map(i =>
                    i === itemExistente
                        ? { ...i, quantidade: i.quantidade + 1 }
                        : i
                )
            );
        } else {
            this.itensCarrinho.set([...itens, novoItem]);
        }
    }

    incrementarItemCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        this.itensCarrinho.set(
            itens.map((item, i) =>
                i === index ? { ...item, quantidade: item.quantidade + 1 } : item
            )
        );
    }

    decrementarItemCarrinho(index: number): void {
        const itens = this.itensCarrinho();
        const item = itens[index];
        if (item.quantidade <= 1) {
            this.removerDoCarrinho(index);
        } else {
            this.itensCarrinho.set(
                itens.map((it, i) =>
                    i === index ? { ...it, quantidade: it.quantidade - 1 } : it
                )
            );
        }
    }

    abrirCarrinho(): void {
        this.navegarPara('carrinho');
    }

    fecharCarrinho(): void {
        this.navegarPara('cardapio');
    }

    // ========== CHECKOUT ==========

    irParaCheckout(): void {
        if (this.carrinhoVazio()) return;
        this.etapaAtual.set('checkout');
    }

    voltarParaCardapio(): void {
        this.etapaAtual.set('cardapio');
        this.navegarPara('cardapio');
    }

    // ========== PAGAMENTO ==========

    toggleDividido(): void {
        this.pagamentoDividido.update(v => !v);
        if (!this.pagamentoDividido()) {
            this.meiosPagamentoSelecionados.set([]);
        }
    }

    selecionarMeioPagamento(tipo: MeioPagamentoTipo): void {
        if (this.pagamentoDividido()) {
            const meios = [...this.meiosPagamentoSelecionados()];
            const index = meios.findIndex(m => m.tipo === tipo);
            if (index >= 0) {
                meios.splice(index, 1);
            } else {
                const totalJaAlocado = meios.reduce((sum, m) => sum + m.valor, 0);
                const restante = this.totalCarrinho() - totalJaAlocado;
                meios.push({ tipo, valor: restante > 0 ? restante : 0 });
            }
            this.meiosPagamentoSelecionados.set(meios);
        } else {
            this.meiosPagamentoSelecionados.set([{ tipo, valor: this.totalCarrinho() }]);
        }
    }

    atualizarValorMeio(tipo: MeioPagamentoTipo, valor: number): void {
        const meios = [...this.meiosPagamentoSelecionados()];
        const index = meios.findIndex(m => m.tipo === tipo);
        if (index >= 0) {
            meios[index].valor = valor;
            this.meiosPagamentoSelecionados.set(meios);
        }
    }

    isMeioSelecionado(tipo: MeioPagamentoTipo): boolean {
        return this.meiosPagamentoSelecionados().some(m => m.tipo === tipo);
    }

    getValorMeio(tipo: MeioPagamentoTipo): number {
        const meio = this.meiosPagamentoSelecionados().find(m => m.tipo === tipo);
        return meio?.valor ?? 0;
    }

    enviarPedido(): void {
        if (!this.podeEnviarPedido()) return;

        this.enviando.set(true);

        const itens: ItemPedidoDeliveryRequest[] = this.itensCarrinho().map(item => ({
            produtoId: item.produto.id,
            quantidade: item.quantidade,
            observacoes: item.observacao || undefined,
            adicionais: item.adicionais && item.adicionais.length > 0
                ? item.adicionais.map(ad => ({ adicionalId: ad.adicional.id, quantidade: ad.quantidade }))
                : undefined
        }));

        const cliente = this.cliente();
        if (!cliente) return;

        // Formata os meios de pagamento
        const meiosPagamento = this.meiosPagamentoSelecionados().map(m => ({
            meioPagamento: m.tipo,
            valor: m.valor
        }));

        const request: CriarPedidoDeliveryRequest = {
            clienteId: cliente.id,
            nomeCliente: cliente.nome,
            telefoneCliente: cliente.telefone || '',
            enderecoEntrega: this.tipoPedido() === 'DELIVERY' ? this.enderecoEntrega() : undefined,
            tipoPedido: this.tipoPedido(),
            itens,
            meiosPagamento
        };

        this.deliveryService.criarPedido(request).subscribe({
            next: (response) => {
                this.enviando.set(false);
                this.etapaAtual.set('sucesso');
                this.itensCarrinho.set([]);
                this.meiosPagamentoSelecionados.set([]);
                this.pagamentoDividido.set(false);
                this.observacaoItem.set('');
                this.categoriaSelecionada.set(null);

                // Acompanhar status usando o composable
                if (response.id) {
                    this.pedidoId.set(response.id);
                    this.sucessoPedido.iniciarAcompanhamento(response.id);
                }
            },
            error: (e) => {
                this.enviando.set(false);
                this.erro.set(e?.error?.message || 'Erro ao enviar pedido. Tente novamente.');
            }
        });
    }

    // ========== SUCESSO/STATUS ==========

    novoPedido(): void {
        // Limpa o estado do composable de sucesso
        this.sucessoPedido.limpar();

        this.pedidoId.set(null);
        this.statusPedido.set(null);
        this.meiosPagamentoSelecionados.set([]);
        this.pagamentoDividido.set(false);
        this.etapaAtual.set('cardapio');
    }

    // ========== HELPERS PARA TEMPLATE ==========

    getStatusDescricao(status: string): string {
        const descricoes: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': 'Aguardando confirmação',
            'ACEITO': 'Pedido aceito',
            'PREPARANDO': 'Preparando seu pedido',
            'PRONTO': 'Pedido pronto',
            'SAIU_PARA_ENTREGA': 'Saiu para entrega',
            'ENTREGUE': 'Entregue',
            'FINALIZADO': 'Finalizado',
            'CANCELADO': 'Cancelado'
        };
        return descricoes[status] || status;
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'AGUARDANDO_ACEITACAO': '⏳',
            'ACEITO': '✅',
            'PREPARANDO': '👨‍🍳',
            'PRONTO': '🍽️',
            'SAIU_PARA_ENTREGA': '🛵',
            'ENTREGUE': '📦',
            'FINALIZADO': '🎉',
            'CANCELADO': '❌'
        };
        return icons[status] || '📋';
    }
}
