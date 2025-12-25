import { signal, computed } from '@angular/core';

export type MeioPagamentoTipo = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'VALE_REFEICAO' | 'DINHEIRO';

export interface MeioPagamentoSelecionado {
    tipo: MeioPagamentoTipo;
    valor: number;
}

export type EtapaCarrinho = 'itens' | 'pagamento' | 'confirmacao';

const NOMES_PAGAMENTO: Record<MeioPagamentoTipo, string> = {
    'PIX': 'PIX',
    'CARTAO_CREDITO': 'Cartão de Crédito',
    'CARTAO_DEBITO': 'Cartão de Débito',
    'VALE_REFEICAO': 'Voucher',
    'DINHEIRO': 'Dinheiro'
};

const ICONES_PAGAMENTO: Record<MeioPagamentoTipo, string> = {
    'PIX': '📱',
    'CARTAO_CREDITO': '💳',
    'CARTAO_DEBITO': '💳',
    'VALE_REFEICAO': '🎫',
    'DINHEIRO': '💵'
};

/**
 * Composable para gerenciar a seleção de meios de pagamento.
 * Responsabilidade única: controlar meios de pagamento e validação.
 */
export function usePagamento(totalCarrinho: () => number) {
    // Estado
    const etapa = signal<EtapaCarrinho>('itens');
    const meiosSelecionados = signal<MeioPagamentoSelecionado[]>([]);
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

    // Ações de navegação
    function avancarParaPagamento(): void {
        etapa.set('pagamento');
    }

    function voltarParaItens(): void {
        etapa.set('itens');
    }

    function irParaConfirmacao(): void {
        if (pagamentoValido()) {
            etapa.set('confirmacao');
        }
    }

    function voltarParaPagamento(): void {
        etapa.set('pagamento');
    }

    function resetarEtapa(): void {
        etapa.set('itens');
    }

    // Ações de pagamento
    function toggleDividido(): void {
        dividido.update(v => !v);
        if (!dividido()) {
            meiosSelecionados.set([]);
        }
    }

    function selecionarMeio(tipo: MeioPagamentoTipo): void {
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

    function atualizarValorMeio(tipo: MeioPagamentoTipo, valor: number | null | undefined): void {
        const meios = [...meiosSelecionados()];
        const index = meios.findIndex(m => m.tipo === tipo);
        if (index >= 0) {
            // Permite valor vazio/null durante a digitação, mas converte para 0 apenas quando necessário
            const valorFinal = (valor === null || valor === undefined || isNaN(valor)) ? 0 : valor;
            meios[index].valor = valorFinal;
            meiosSelecionados.set(meios);
        }
    }

    function meioPagamentoSelecionado(tipo: string): boolean {
        return meiosSelecionados().some(m => m.tipo === tipo);
    }

    function getValorMeio(tipo: string): number {
        const meio = meiosSelecionados().find(m => m.tipo === tipo);
        return meio?.valor ?? 0;
    }

    function limparPagamentos(): void {
        meiosSelecionados.set([]);
        dividido.set(false);
        etapa.set('itens');
    }

    // Utilitários
    function getNomeMeio(tipo: string): string {
        return NOMES_PAGAMENTO[tipo as MeioPagamentoTipo] || tipo;
    }

    function getIconeMeio(tipo: string): string {
        return ICONES_PAGAMENTO[tipo as MeioPagamentoTipo] || '💰';
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

        // Navegação
        avancarParaPagamento,
        voltarParaItens,
        irParaConfirmacao,
        voltarParaPagamento,
        resetarEtapa,

        // Ações de pagamento
        toggleDividido,
        selecionarMeio,
        atualizarValorMeio,
        meioPagamentoSelecionado,
        getValorMeio,
        limparPagamentos,

        // Utilitários
        getNomeMeio,
        getIconeMeio
    };
}
