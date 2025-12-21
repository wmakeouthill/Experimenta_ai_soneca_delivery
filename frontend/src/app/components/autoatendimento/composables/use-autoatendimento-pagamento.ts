import { signal, computed } from '@angular/core';

export type MeioPagamentoTipoTotem = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

export interface MeioPagamentoTotem {
    tipo: MeioPagamentoTipoTotem;
    valor: number;
}

export type EtapaTotem = 'cardapio' | 'carrinho' | 'pagamento' | 'confirmacao' | 'sucesso';

const NOMES_PAGAMENTO: Record<MeioPagamentoTipoTotem, string> = {
    'PIX': 'PIX',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'VALE_REFEICAO': 'Voucher',
    'DINHEIRO': 'Dinheiro'
};

const ICONES_PAGAMENTO: Record<MeioPagamentoTipoTotem, string> = {
    'PIX': '📱',
    'CARTAO_CREDITO': '💳',
    'CARTAO_DEBITO': '💳',
    'VALE_REFEICAO': '🎫',
    'DINHEIRO': '💵'
};

/**
 * Composable para gerenciar a seleção de meios de pagamento no totem.
 * Responsabilidade única: controlar meios de pagamento e validação.
 */
export function useAutoAtendimentoPagamento(totalCarrinho: () => number) {
    // Estado
    const etapa = signal<EtapaTotem>('cardapio');
    const meiosSelecionados = signal<MeioPagamentoTotem[]>([]);
    const dividido = signal(false);

    // Computed
    const totalAlocado = computed(() =>
        meiosSelecionados().reduce((sum, m) => sum + m.valor, 0)
    );

    const valorRestante = computed(() =>
        totalCarrinho() - totalAlocado()
    );

    const pagamentoValido = computed(() => {
        if (meiosSelecionados().length === 0) return false;
        if (dividido()) {
            return Math.abs(totalAlocado() - totalCarrinho()) < 0.01;
        }
        return true;
    });

    // Helpers
    function getNomePagamento(tipo: MeioPagamentoTipoTotem): string {
        return NOMES_PAGAMENTO[tipo];
    }

    function getIconePagamento(tipo: MeioPagamentoTipoTotem): string {
        return ICONES_PAGAMENTO[tipo];
    }

    // Ações de navegação
    function irParaCardapio(): void {
        etapa.set('cardapio');
    }

    function irParaCarrinho(): void {
        etapa.set('carrinho');
    }

    function irParaPagamento(): void {
        etapa.set('pagamento');
    }

    function irParaConfirmacao(): void {
        if (pagamentoValido()) {
            etapa.set('confirmacao');
        }
    }

    function irParaSucesso(): void {
        etapa.set('sucesso');
    }

    function voltarEtapa(): void {
        const etapaAtual = etapa();
        switch (etapaAtual) {
            case 'carrinho':
                etapa.set('cardapio');
                break;
            case 'pagamento':
                etapa.set('carrinho');
                break;
            case 'confirmacao':
                etapa.set('pagamento');
                break;
            default:
                break;
        }
    }

    function resetar(): void {
        etapa.set('cardapio');
        meiosSelecionados.set([]);
        dividido.set(false);
    }

    // Ações de pagamento
    function toggleDividido(): void {
        dividido.update(v => !v);
        if (!dividido()) {
            meiosSelecionados.set([]);
        }
    }

    function selecionarMeio(tipo: MeioPagamentoTipoTotem): void {
        if (dividido()) {
            const meios = [...meiosSelecionados()];
            const index = meios.findIndex(m => m.tipo === tipo);
            if (index >= 0) {
                meios.splice(index, 1);
            } else {
                const totalJaAlocado = meios.reduce((sum, m) => sum + m.valor, 0);
                const restante = totalCarrinho() - totalJaAlocado;
                meios.push({ tipo, valor: restante > 0 ? restante : 0 });
            }
            meiosSelecionados.set(meios);
        } else {
            meiosSelecionados.set([{ tipo, valor: totalCarrinho() }]);
        }
    }

    function atualizarValorMeio(tipo: MeioPagamentoTipoTotem, valor: number): void {
        const meios = meiosSelecionados().map(m =>
            m.tipo === tipo ? { ...m, valor: Math.max(0, valor) } : m
        );
        meiosSelecionados.set(meios);
    }

    function removerMeio(tipo: MeioPagamentoTipoTotem): void {
        meiosSelecionados.update(meios => meios.filter(m => m.tipo !== tipo));
    }

    function isMeioSelecionado(tipo: MeioPagamentoTipoTotem): boolean {
        return meiosSelecionados().some(m => m.tipo === tipo);
    }

    function getValorMeio(tipo: MeioPagamentoTipoTotem): number {
        return meiosSelecionados().find(m => m.tipo === tipo)?.valor ?? 0;
    }

    return {
        // Estado
        etapa: etapa.asReadonly(),
        meiosSelecionados: meiosSelecionados.asReadonly(),
        dividido: dividido.asReadonly(),

        // Computed
        totalAlocado,
        valorRestante,
        pagamentoValido,

        // Helpers
        getNomePagamento,
        getIconePagamento,

        // Ações de navegação
        irParaCardapio,
        irParaCarrinho,
        irParaPagamento,
        irParaConfirmacao,
        irParaSucesso,
        voltarEtapa,
        resetar,

        // Ações de pagamento
        toggleDividido,
        selecionarMeio,
        atualizarValorMeio,
        removerMeio,
        isMeioSelecionado,
        getValorMeio
    };
}
