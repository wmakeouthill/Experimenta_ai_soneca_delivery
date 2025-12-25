import { inject, signal, computed, effect, DestroyRef } from '@angular/core';
import { RastreamentoPedidoService, RastreamentoPedidoResponse } from '../../../services/rastreamento-pedido.service';

/**
 * Composable para gerenciar rastreamento de pedido em tempo real.
 * Usa signals reativos e SSE para atualizações imediatas.
 * Segue padrões .cursorrules-frontend (Angular 20+ Zoneless).
 * 
 * @param pedidoId Função que retorna o ID do pedido
 * @param clienteId Função que retorna o ID do cliente
 */
export function useRastreamentoPedido(
  pedidoId: () => string | null | undefined,
  clienteId: () => string | null | undefined
) {
  const rastreamentoService = inject(RastreamentoPedidoService);
  const destroyRef = inject(DestroyRef);

  // === SIGNALS LOCAIS (derivados do service) ===
  const ativo = signal(false);

  // === COMPUTEDS - Exposição reativa dos dados do service ===
  const rastreamento = computed(() => rastreamentoService.rastreamentoAtual());
  const carregando = computed(() => rastreamentoService.carregando());
  const erro = computed(() => rastreamentoService.erro());
  const conectado = computed(() => rastreamentoService.conectado());

  const podeRastrear = computed(() => {
    const r = rastreamento();
    return r?.permiteRastreamento ?? false;
  });

  const temLocalizacaoMotoboy = computed(() => {
    return rastreamentoService.temLocalizacaoMotoboy();
  });

  const localizacaoMotoboy = computed(() => {
    return rastreamento()?.localizacaoMotoboy ?? null;
  });

  const destino = computed(() => {
    const r = rastreamento();
    if (!r) return null;
    return {
      lat: r.latitudeDestino,
      lng: r.longitudeDestino,
      endereco: r.enderecoEntrega
    };
  });

  const motoboyNome = computed(() => rastreamento()?.motoboyNome ?? null);
  const statusPedido = computed(() => rastreamento()?.statusPedido ?? null);
  const ultimaAtualizacao = computed(() => rastreamento()?.ultimaAtualizacao ?? null);

  // Cleanup automático ao destruir componente
  destroyRef.onDestroy(() => {
    if (ativo()) {
      rastreamentoService.pararRastreamento();
    }
  });

  /**
   * Inicia rastreamento em tempo real com SSE.
   */
  function iniciar() {
    const id = pedidoId();
    const cliente = clienteId();

    if (!id || !cliente || ativo()) {
      console.warn('[useRastreamento] Não pode iniciar:', { id, cliente, ativo: ativo() });
      return;
    }

    console.log('[useRastreamento] Iniciando rastreamento:', { pedidoId: id, clienteId: cliente });
    ativo.set(true);
    rastreamentoService.iniciarRastreamento(id, cliente);
  }

  /**
   * Para rastreamento.
   */
  function parar() {
    console.log('[useRastreamento] Parando rastreamento');
    ativo.set(false);
    rastreamentoService.pararRastreamento();
  }

  /**
   * Carrega dados iniciais uma vez (sem SSE).
   */
  function carregar() {
    const id = pedidoId();
    const cliente = clienteId();

    if (!id || !cliente) {
      return;
    }

    rastreamentoService.obterRastreamento(id, cliente).subscribe({
      next: (dados) => {
        console.log('[useRastreamento] Dados carregados:', dados);
      },
      error: (err) => {
        console.error('[useRastreamento] Erro ao carregar:', err);
      }
    });
  }

  /**
   * Calcula tempo decorrido desde uma data.
   */
  function calcularTempoDesde(timestamp: string | null | undefined): string {
    if (!timestamp) return '';

    const agora = new Date();
    const data = new Date(timestamp);
    const diffMs = agora.getTime() - data.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'agora mesmo';
    if (diffMin === 1) return 'há 1 minuto';
    if (diffMin < 60) return `há ${diffMin} minutos`;

    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras === 1) return 'há 1 hora';
    return `há ${diffHoras} horas`;
  }

  return {
    // Estado
    rastreamento,
    carregando,
    erro,
    ativo,
    conectado,

    // Computed
    podeRastrear,
    temLocalizacaoMotoboy,
    localizacaoMotoboy,
    destino,
    motoboyNome,
    statusPedido,
    ultimaAtualizacao,

    // Métodos
    iniciar,
    parar,
    carregar,
    calcularTempoDesde
  };
}
