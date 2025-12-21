import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy, PLATFORM_ID, AfterViewInit, AfterViewChecked, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { PedidoMesaService, ItemPedidoMesaRequest, CriarPedidoMesaRequest } from '../../services/pedido-mesa.service';
import { Mesa } from '../../services/mesa.service';
import { Produto } from '../../services/produto.service';
import { ClienteAuthService } from '../../services/cliente-auth.service';
import { PwaInstallService } from '../../services/pwa-install.service';
import { AcaoChat } from '../../services/chat-ia.service';
import { AdicionalService } from '../../services/adicional.service';
import { DraggableScrollDirective } from './directives/draggable-scroll.directive';
import { ImageProxyUtil } from '../../utils/image-proxy.util';

import {
  useIdentificacaoCliente,
  useCarrinho,
  usePagamento,
  useCardapio,
  useFavoritos,
  useGoogleAuth,
  useInicio,
  useSucessoPedido,
  useMeusPedidos,
  useAvaliacao,
  useChatIA
} from './composables';

import {
  SucessoScreenComponent,
  CardapioFooterNavComponent,
  ChatIAButtonComponent,
  ChatIAFullscreenComponent,
  AbaNavegacao
} from './components';

type EtapaPrincipal = 'identificacao' | 'cadastro' | 'cardapio' | 'sucesso';
type AbaCliente = 'inicio' | 'cardapio' | 'perfil';
type SecaoPerfil = 'principal' | 'favoritos' | 'pedidos' | 'senha' | 'celular';

/**
 * Componente de pedido para cliente via QR Code da mesa.
 * Orquestra os composables de identificação, carrinho, pagamento e cardápio.
 */
@Component({
  selector: 'app-pedido-cliente-mesa',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DraggableScrollDirective,
    SucessoScreenComponent,
    CardapioFooterNavComponent,
    ChatIAButtonComponent,
    ChatIAFullscreenComponent
  ],
  templateUrl: './pedido-cliente-mesa.component.html',
  styleUrls: [
    './styles/base.css',
    './styles/identificacao.css',
    './styles/cardapio.css',
    './styles/modal.css',
    './styles/carrinho.css',
    './styles/abas.css',
    './styles/pagamento.css',
    './styles/responsive.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PedidoClienteMesaComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  private readonly route = inject(ActivatedRoute);
  private readonly pedidoMesaService = inject(PedidoMesaService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly clienteAuthService = inject(ClienteAuthService);
  private readonly pwaInstallService = inject(PwaInstallService);
  private readonly adicionalService = inject(AdicionalService);

  protected readonly Math = Math;

  // ========== Estado Geral ==========
  readonly mesa = signal<Mesa | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal<string | null>(null);
  readonly etapaAtual = signal<EtapaPrincipal>('identificacao');
  readonly abaAtual = signal<AbaCliente>('inicio');
  readonly enviando = signal(false);
  readonly secaoPerfil = signal<SecaoPerfil>('principal');
  readonly mostrarBannerPwa = signal(false);
  readonly podeInstalarPwa = computed(() => this.pwaInstallService ? !this.pwaInstallService.isStandalone() : false);

  // Estado do formulário de celular
  readonly celularInput = signal('');
  readonly celularSalvando = signal(false);
  readonly celularErro = signal<string | null>(null);
  readonly celularSucesso = signal(false);

  // Estado para animação do carrinho no chat
  readonly animarCarrinhoChat = signal(false);
  // Indica se o carrinho foi aberto a partir do chat (para voltar ao chat ao fechar)
  readonly carrinhoAbertoPeloChat = signal(false);

  // ========== Composables ==========
  private readonly mesaToken = () => this.mesa()?.qrCodeToken;

  readonly identificacao = useIdentificacaoCliente(this.mesaToken);
  readonly carrinho = useCarrinho();
  readonly pagamento = usePagamento(() => this.carrinho.totalValor());
  readonly cardapio = useCardapio(this.mesaToken);
  readonly favoritos = useFavoritos(
    () => this.identificacao.clienteIdentificado()?.id,
    () => this.cardapio.produtos()
  );
  readonly googleAuth = useGoogleAuth(
    () => this.identificacao.clienteIdentificado(),
    (cliente) => {
      this.identificacao.setClienteFromGoogle(cliente);
      this.irParaCardapio();
    }
  );
  readonly inicio = useInicio(
    this.mesaToken,
    () => this.identificacao.clienteIdentificado()?.id,
    () => this.favoritos.produtosFavoritos()
  );
  readonly sucesso = useSucessoPedido();
  readonly meusPedidos = useMeusPedidos(() => this.identificacao.clienteIdentificado()?.id);
  readonly avaliacao = useAvaliacao(
    () => this.identificacao.clienteIdentificado()?.id,
    () => this.meusPedidos.pedidoSelecionado()
  );
  readonly chatIA = useChatIA(
    () => this.identificacao.clienteIdentificado()?.id,
    (acao) => this.processarAcaoChat(acao)
  );

  // ========== ViewChild para botão do Google ==========
  @ViewChild('googleButtonLogin') googleButtonLoginRef?: ElementRef<HTMLDivElement>;
  private googleButtonRendered = false;

  // ========== Estado para Seção de Senha ==========
  senhaAtual = '';
  novaSenha = '';
  confirmarSenha = '';
  readonly erroSenha = signal<string | null>(null);
  readonly salvandoSenha = signal(false);

  // ========== Computed ==========
  readonly podeEnviarPedido = computed(() =>
    !this.carrinho.carrinhoVazio() && this.identificacao.clienteIdentificado() !== null
  );

  // Verifica se há pedidos finalizados não avaliados
  readonly temPedidosNaoAvaliados = computed(() => {
    const pedidos = this.meusPedidos.pedidos();
    if (!pedidos || pedidos.length === 0) return false;

    return pedidos.some(pedido =>
      pedido.status === 'FINALIZADO' && !this.avaliacao.isPedidoAvaliado(pedido.id)
    );
  });

  // Verifica se há pedido ativo (não finalizado/cancelado)
  readonly pedidoAtivoNaoFinalizado = computed(() => {
    const pedidos = this.meusPedidos.pedidos();
    if (!pedidos || pedidos.length === 0) return null;

    return pedidos.find(pedido =>
      pedido.status !== 'FINALIZADO' && pedido.status !== 'CANCELADO'
    ) || null;
  });

  // Verifica se deve mostrar CTA de pedido ativo (quando não está na tela de sucesso)
  readonly mostrarCtaPedidoAtivo = computed(() => {
    return this.pedidoAtivoNaoFinalizado() !== null && this.etapaAtual() !== 'sucesso';
  });

  // ========== Bindings para NgModel ==========
  get telefoneInputValue(): string { return this.identificacao.getTelefone(); }
  set telefoneInputValue(value: string) { this.identificacao.setTelefone(value); }

  get nomeInputValue(): string { return this.identificacao.getNome(); }
  set nomeInputValue(value: string) { this.identificacao.setNome(value); }

  get observacaoTempValue(): string { return this.carrinho.getObservacao(); }
  set observacaoTempValue(value: string) { this.carrinho.setObservacao(value); }

  // Handler para back button do navegador
  private readonly boundHandlePopState = this.handlePopState.bind(this);
  private readonly destroy$ = new Subject<void>();

  constructor() {
    // Effect para carregar adicionais quando o modal de detalhes é aberto
    effect(() => {
      const produtoSelecionado = this.carrinho.produtoSelecionado();
      if (produtoSelecionado && this.carrinho.mostrarDetalhes()) {
        this.carregarAdicionaisDoProduto(produtoSelecionado.id);
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Carrega os adicionais disponíveis para um produto.
   */
  private carregarAdicionaisDoProduto(produtoId: string): void {
    this.carrinho.setCarregandoAdicionais(true);
    this.adicionalService.listarAdicionaisDoProduto(produtoId)
      .subscribe({
        next: (adicionais) => {
          // Filtra apenas os disponíveis
          const disponíveis = adicionais.filter(a => a.disponivel);
          this.carrinho.setAdicionaisDisponiveis(disponíveis);
          this.carrinho.setCarregandoAdicionais(false);
        },
        error: (err) => {
          console.error('Erro ao carregar adicionais:', err);
          this.carrinho.setAdicionaisDisponiveis([]);
          this.carrinho.setCarregandoAdicionais(false);
        }
      });
  }

  // ========== Lifecycle ==========
  ngOnInit(): void {
    if (!this.isBrowser) return;
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.erro.set('Token da mesa não encontrado');
      this.carregando.set(false);
      return;
    }
    this.carregarMesa(token);

    // Listener para fechar carrinho no back button do celular
    window.addEventListener('popstate', this.boundHandlePopState);

    // Banner de instalação PWA (apenas web, não standalone)
    this.mostrarBannerPwa.set(this.pwaInstallService.shouldShow());
    this.pwaInstallService.onPromptChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.mostrarBannerPwa.set(this.pwaInstallService.shouldShow()));

    // Inicializa o Chat IA
    this.chatIA.inicializar();
  }

  async ngAfterViewInit(): Promise<void> {
    if (this.isBrowser) {
      await this.googleAuth.inicializar();
      this.renderizarBotaoGoogle();
    }
  }

  ngAfterViewChecked(): void {
    // Tenta renderizar o botão do Google sempre que a view for checada
    // Isso garante que o botão seja renderizado quando o elemento estiver disponível
    this.renderizarBotaoGoogle();
  }

  /**
   * Renderiza o botão oficial do Google Sign-In
   */
  private renderizarBotaoGoogle(): void {
    if (!this.isBrowser) return;

    const element = this.googleButtonLoginRef?.nativeElement;
    if (element && !this.googleButtonRendered && this.googleAuth.inicializado()) {
      this.googleAuth.renderizarBotao(element);
      this.googleButtonRendered = true;
    }
  }

  ngOnDestroy(): void {
    this.googleAuth.destroy();
    this.identificacao.destroy();
    this.sucesso.destroy();
    if (this.isBrowser) {
      window.removeEventListener('popstate', this.boundHandlePopState);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handler para o evento popstate (back button)
   * Fecha o carrinho em vez de navegar para trás
   */
  private handlePopState(): void {
    if (this.carrinho.mostrarCarrinho()) {
      // Fecha o carrinho
      this.carrinho.fecharCarrinho();
      this.pagamento.resetarEtapa();
      // Adiciona nova entrada no histórico para manter a posição
      history.pushState({ carrinho: false }, '');
    }
  }

  // ========== Ações Gerais ==========
  private carregarMesa(token: string): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.pedidoMesaService.buscarMesa(token).subscribe({
      next: (mesa) => {
        if (!mesa.ativa) {
          this.erro.set('Esta mesa não está ativa no momento');
          this.carregando.set(false);
          return;
        }
        this.mesa.set(mesa);
        this.carregando.set(false);

        // Se cliente já está identificado (restaurado do sessionStorage), vai direto para cardápio
        if (this.identificacao.clienteIdentificado()) {
          this.irParaCardapio();
        }
      },
      error: () => {
        this.erro.set('Mesa não encontrada ou indisponível');
        this.carregando.set(false);
      }
    });
  }

  // ========== Ações de Identificação ==========
  buscarCliente(): void {
    this.identificacao.buscarCliente(() => this.irParaCardapio());
  }

  cadastrarCliente(): void {
    this.identificacao.cadastrarCliente(() => this.irParaCardapio());
  }

  voltarParaIdentificacao(): void {
    this.identificacao.voltarParaIdentificacao();
    this.etapaAtual.set('identificacao');
  }

  trocarCliente(): void {
    this.identificacao.trocarCliente();
    this.carrinho.limparCarrinho();
    this.etapaAtual.set('identificacao');
  }

  // ========== Navegação ==========
  private irParaCardapio(): void {
    this.etapaAtual.set('cardapio');

    // Carrega TUDO em paralelo para máxima velocidade
    // Cardápio, favoritos e início são independentes
    Promise.all([
      this.cardapio.carregar(),
      this.favoritos.carregar(),
      this.inicio.carregar()
    ]).catch(err => console.warn('Erro ao carregar dados:', err));
  }

  navegarPara(aba: AbaCliente | 'carrinho'): void {
    if (aba === 'carrinho') {
      this.carrinho.abrirCarrinho();
    } else {
      this.carrinho.fecharCarrinho();
      this.abaAtual.set(aba);
      // Reset seção do perfil quando navegar para ele
      if (aba === 'perfil') {
        this.secaoPerfil.set('principal');
      }
    }
  }

  // ========== Ações do Cardápio ==========
  abrirDetalhesProduto(produto: Produto): void {
    this.carrinho.abrirDetalhes(produto);
  }

  // ========== PWA Banner ==========
  async instalarPwa(event?: Event): Promise<void> {
    event?.stopPropagation();
    await this.pwaInstallService.promptInstall();
    this.mostrarBannerPwa.set(this.pwaInstallService.shouldShow());
  }

  fecharBannerPwa(event?: Event): void {
    event?.stopPropagation();
    this.pwaInstallService.dismissPrompt();
    this.mostrarBannerPwa.set(false);
  }

  // ========== Ações de Favoritos ==========
  toggleFavorito(produtoId: string, event?: Event): void {
    event?.stopPropagation();
    this.favoritos.toggle(produtoId);
  }

  // ========== Ações do Carrinho ==========
  abrirCarrinho(): void {
    this.carrinho.abrirCarrinho();
    this.pagamento.resetarEtapa();
    // Adiciona entrada no histórico para capturar back button
    if (this.isBrowser) {
      history.pushState({ carrinho: true }, '');
    }
  }

  fecharCarrinho(): void {
    this.carrinho.fecharCarrinho();
    this.pagamento.resetarEtapa();

    // Se o carrinho foi aberto pelo chat, volta para o chat
    if (this.carrinhoAbertoPeloChat()) {
      this.carrinhoAbertoPeloChat.set(false);
      // Chat já está aberto, só precisa mostrar novamente
    }
  }

  // ========== Google Auth ==========
  loginComGoogle(): void {
    this.googleAuth.abrirPrompt();
  }

  vincularGoogle(): void {
    this.googleAuth.abrirPrompt();
  }

  async desvincularGoogle(): Promise<void> {
    if (confirm('Deseja desvincular sua conta Google?')) {
      await this.googleAuth.desvincular();
    }
  }

  // ========== Celular ==========
  abrirEdicaoCelular(): void {
    const telefoneAtual = this.googleAuth.clienteAuth.cliente()?.telefone || '';
    this.celularInput.set(telefoneAtual);
    this.celularErro.set(null);
    this.celularSucesso.set(false);
    this.secaoPerfil.set('celular');
  }

  async salvarCelular(): Promise<void> {
    const telefone = this.celularInput().trim();

    // Validação básica
    if (!telefone) {
      this.celularErro.set('Digite um número de celular');
      return;
    }

    // Remove formatação para validar
    const apenasNumeros = telefone.replace(/\D/g, '');
    if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
      this.celularErro.set('Celular deve ter 10 ou 11 dígitos');
      return;
    }

    this.celularSalvando.set(true);
    this.celularErro.set(null);

    try {
      await firstValueFrom(this.clienteAuthService.atualizarTelefone(telefone));
      this.celularSucesso.set(true);
      // Aguarda 1.5s e volta para o perfil principal
      setTimeout(() => {
        this.secaoPerfil.set('principal');
        this.celularSucesso.set(false);
      }, 1500);
    } catch (e) {
      console.error('Erro ao salvar celular:', e);
      this.celularErro.set('Erro ao salvar celular. Tente novamente.');
    } finally {
      this.celularSalvando.set(false);
    }
  }

  // ========== Seções do Perfil ==========
  irParaMeusPedidos(): void {
    this.secaoPerfil.set('pedidos');
    this.meusPedidos.carregar();
    this.avaliacao.carregarAvaliacoesCliente();
  }

  // ========== Status do Pedido ==========
  verStatusPedido(pedidoId: string): void {
    // Fecha o modal de detalhes se estiver aberto
    this.meusPedidos.fecharDetalhes();
    // Inicia acompanhamento do pedido e vai para tela de sucesso
    this.sucesso.iniciarAcompanhamento(pedidoId);
    this.etapaAtual.set('sucesso');
  }

  verStatusPedidoAtivo(): void {
    const pedidoAtivo = this.pedidoAtivoNaoFinalizado();
    if (pedidoAtivo) {
      this.verStatusPedido(pedidoAtivo.id);
    }
  }

  /**
   * Minimiza a tela de sucesso e volta para o cardápio.
   * Mantém o polling de status ativo em background.
   */
  continuarNavegando(): void {
    this.etapaAtual.set('cardapio');
    // NÃO limpa o sucesso - mantém o polling ativo
  }

  adicionarAoCarrinhoRapido(produto: Produto): void {
    this.carrinho.adicionarRapido(produto);
    // Feedback visual pode ser adicionado aqui
  }

  /**
   * Processa ações do Chat IA (ex: adicionar, remover ou limpar carrinho via comando de texto).
   */
  processarAcaoChat(acao: AcaoChat): void {
    switch (acao.tipo) {
      case 'ADICIONAR_CARRINHO':
        if (acao.produtoId) {
          const produto = this.cardapio.produtos().find(p => p.id === acao.produtoId);
          if (produto) {
            const quantidade = acao.quantidade || 1;
            const observacao = acao.observacao || '';
            this.carrinho.adicionarComOpcoes(produto, quantidade, observacao);
            console.log(`✅ Chat IA: Adicionado ${quantidade}x ${produto.nome} ao carrinho`, observacao ? `(${observacao})` : '');
            // Dispara animação do carrinho no header do chat
            this.dispararAnimacaoCarrinhoChat();
          } else {
            console.warn(`⚠️ Chat IA: Produto não encontrado: ${acao.produtoId}`);
          }
        }
        break;

      case 'REMOVER_CARRINHO':
        if (acao.produtoId) {
          this.carrinho.removerDoCarrinho(acao.produtoId);
          console.log(`🗑️ Chat IA: Removido ${acao.produtoNome} do carrinho`);
        }
        break;

      case 'LIMPAR_CARRINHO':
        this.carrinho.limparCarrinho();
        console.log(`🗑️ Chat IA: Carrinho limpo`);
        break;

      case 'VER_CARRINHO': {
        // Gera resumo do carrinho e adiciona como mensagem da IA
        const resumo = this.gerarResumoCarrinho();
        this.chatIA.adicionarMensagemLocal(resumo);
        console.log(`👀 Chat IA: Exibindo carrinho`);
        break;
      }

      default:
        console.log(`ℹ️ Chat IA: Ação não processada: ${acao.tipo}`);
    }
  }

  /**
   * Gera um resumo do carrinho para exibir no chat.
   */
  private gerarResumoCarrinho(): string {
    const itens = this.carrinho.itens();

    if (itens.length === 0) {
      return "Seu carrinho está vazio! 🛒\n\nQue tal dar uma olhada no cardápio? Posso te ajudar a escolher! 😊";
    }

    let resumo = "**Seu carrinho:** 🛒\n\n";

    itens.forEach((item, index) => {
      resumo += `${index + 1}. **${item.produto.nome}** x${item.quantidade} - R$ ${(item.produto.preco * item.quantidade).toFixed(2)}`;
      if (item.observacao) {
        resumo += `\n   📝 _${item.observacao}_`;
      }
      resumo += '\n';
    });

    resumo += `\n**Total: R$ ${this.carrinho.totalValor().toFixed(2)}** 💰`;
    resumo += `\n\nDeseja finalizar o pedido ou adicionar mais alguma coisa? 😊`;

    return resumo;
  }

  async salvarSenha(): Promise<void> {
    this.erroSenha.set(null);

    // Validações
    if (!this.novaSenha || this.novaSenha.length < 6) {
      this.erroSenha.set('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.erroSenha.set('As senhas não conferem');
      return;
    }

    const cliente = this.identificacao.clienteIdentificado();
    if (!cliente) return;

    if (cliente.temSenha && !this.senhaAtual) {
      this.erroSenha.set('Digite sua senha atual');
      return;
    }

    this.salvandoSenha.set(true);

    try {
      await firstValueFrom(
        this.pedidoMesaService.salvarSenhaCliente(
          cliente.id,
          this.novaSenha,
          cliente.temSenha ? this.senhaAtual : undefined
        )
      );

      // Sucesso - atualizar estado do cliente
      this.identificacao.atualizarTemSenha(true);

      // Limpar campos e voltar
      this.senhaAtual = '';
      this.novaSenha = '';
      this.confirmarSenha = '';
      this.secaoPerfil.set('principal');

      alert('Senha salva com sucesso!');
    } catch (err: unknown) {
      const httpError = err as { error?: { message?: string } };
      this.erroSenha.set(httpError.error?.message || 'Erro ao salvar senha');
    } finally {
      this.salvandoSenha.set(false);
    }
  }

  // ========== Envio do Pedido ==========
  enviarPedido(): void {
    const mesa = this.mesa();
    const cliente = this.identificacao.clienteIdentificado();
    if (!mesa || !cliente || !this.podeEnviarPedido() || !this.pagamento.pagamentoValido()) return;

    this.enviando.set(true);

    const itens: ItemPedidoMesaRequest[] = this.carrinho.itens().map(item => ({
      produtoId: item.produto.id,
      quantidade: item.quantidade,
      observacoes: item.observacao || undefined,
      adicionais: item.adicionais && item.adicionais.length > 0
        ? item.adicionais.map(ad => ({ adicionalId: ad.adicional.id, quantidade: ad.quantidade }))
        : undefined
    }));

    const meiosPagamento = this.pagamento.meiosSelecionados().map(m => ({
      meioPagamento: m.tipo,
      valor: m.valor
    }));

    const request: CriarPedidoMesaRequest = {
      mesaToken: mesa.qrCodeToken,
      clienteId: cliente.id,
      nomeCliente: cliente.nome,
      itens,
      meiosPagamento
    };

    this.pedidoMesaService.criarPedido(request).subscribe({
      next: (response) => {
        this.enviando.set(false);
        this.etapaAtual.set('sucesso');
        this.carrinho.limparCarrinho();
        this.pagamento.limparPagamentos();
        this.carrinho.fecharCarrinho();

        // Inicia acompanhamento do status do pedido
        if (response.id) {
          this.sucesso.iniciarAcompanhamento(response.id);
        }
      },
      error: () => {
        this.enviando.set(false);
        this.erro.set('Erro ao enviar o pedido. Tente novamente.');
      }
    });
  }

  novoPedido(): void {
    this.etapaAtual.set('cardapio');
    this.carrinho.limparCarrinho();
    this.sucesso.limpar();
    this.erro.set(null);
  }

  // ========== Formatação ==========
  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  /**
   * Calcula e formata o preço total de um item do carrinho, incluindo adicionais.
   */
  formatarPrecoItemCarrinho(item: import('./composables').ItemCarrinho): string {
    let total = item.produto.preco * item.quantidade;
    if (item.adicionais && item.adicionais.length > 0) {
      const totalAdicionais = item.adicionais.reduce(
        (acc, ad) => acc + (ad.adicional.preco * ad.quantidade * item.quantidade),
        0
      );
      total += totalAdicionais;
    }
    return this.formatarPreco(total);
  }

  formatarTelefone(telefone: string): string {
    return this.identificacao.formatarTelefone(telefone);
  }

  /**
   * Obtém a URL da foto do cliente com proxy (para evitar 429 do Google)
   */
  getFotoUrlComProxy(fotoUrl: string | null | undefined): string | null {
    return ImageProxyUtil.getProxyUrl(fotoUrl);
  }

  // ========== Chat IA - Integração com Carrinho ==========
  /**
   * Adiciona um produto do chat ao carrinho abrindo o modal de detalhes.
   * O modal abre por cima do chat, permitindo continuar a conversa.
   */
  adicionarProdutoChatAoCarrinho(produtoDestacado: { id: string; nome: string; descricao: string; categoria: string; preco: number; imagemUrl: string; disponivel: boolean }): void {
    console.log('🛒 Adicionando produto do chat:', produtoDestacado);

    // Busca o produto completo no cardápio
    const produtoCompleto = this.cardapio.produtos().find(p => p.id === produtoDestacado.id);
    console.log('📦 Produto completo encontrado:', produtoCompleto);

    if (produtoCompleto) {
      // Usa o produto completo do cardápio
      this.carrinho.abrirDetalhes(produtoCompleto);
    } else {
      // Fallback: cria um objeto Produto mínimo
      console.log('⚠️ Produto não encontrado no cardápio, usando fallback');
      const produtoMinimo: Produto = {
        id: produtoDestacado.id,
        nome: produtoDestacado.nome,
        descricao: produtoDestacado.descricao || '',
        preco: produtoDestacado.preco,
        categoria: produtoDestacado.categoria,
        disponivel: produtoDestacado.disponivel,
        foto: produtoDestacado.imagemUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.carrinho.abrirDetalhes(produtoMinimo);
    }

    // Dispara animação do carrinho no header do chat
    this.dispararAnimacaoCarrinhoChat();
  }

  /**
   * Abre a tela de carrinho escondendo temporariamente o chat.
   * Ao fechar o carrinho, volta para o chat automaticamente.
   */
  abrirCarrinhoNoChat(): void {
    console.log('🛒 Abrindo carrinho via chat');
    // Marca que o carrinho foi aberto pelo chat (para voltar depois)
    this.carrinhoAbertoPeloChat.set(true);
    // Abre o modal do carrinho (o chat fica escondido por baixo)
    this.carrinho.mostrarCarrinho.set(true);
  }

  /**
   * Dispara a animação bounce no ícone do carrinho no header do chat.
   */
  private dispararAnimacaoCarrinhoChat(): void {
    this.animarCarrinhoChat.set(true);
    setTimeout(() => this.animarCarrinhoChat.set(false), 600);
  }

  // ========== Utilitários ==========
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.style.display = 'none';
  }
}
