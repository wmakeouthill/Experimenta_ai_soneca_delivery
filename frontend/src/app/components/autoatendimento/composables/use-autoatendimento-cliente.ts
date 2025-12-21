import { signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const CLIENTE_TOTEM_STORAGE_KEY = 'autoatendimento-cliente';

export interface ClienteTotem {
    nome: string;
    observacaoGeral?: string;
}

/**
 * Composable para gerenciar a identificação do cliente no totem.
 * Responsabilidade única: controlar nome/identificação do cliente.
 * No totem, o cliente apenas informa o nome (opcional) para chamar na entrega.
 */
export function useAutoAtendimentoCliente() {
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    // Estado
    const nome = signal<string>('');
    const observacaoGeral = signal<string>('');
    const mostrarIdentificacao = signal(false);

    // Computed
    const clienteIdentificado = computed((): ClienteTotem | null => {
        const nomeCliente = nome();
        if (!nomeCliente.trim()) return null;
        return {
            nome: nomeCliente.trim(),
            observacaoGeral: observacaoGeral().trim() || undefined
        };
    });

    const temNome = computed(() => nome().trim().length > 0);

    // Ações
    function setNome(valor: string): void {
        nome.set(valor);
    }

    function setObservacaoGeral(valor: string): void {
        observacaoGeral.set(valor);
    }

    function abrirIdentificacao(): void {
        mostrarIdentificacao.set(true);
    }

    function fecharIdentificacao(): void {
        mostrarIdentificacao.set(false);
    }

    function confirmarIdentificacao(): void {
        mostrarIdentificacao.set(false);
    }

    function limpar(): void {
        nome.set('');
        observacaoGeral.set('');
        mostrarIdentificacao.set(false);
    }

    return {
        // Estado
        nome: nome.asReadonly(),
        observacaoGeral: observacaoGeral.asReadonly(),
        mostrarIdentificacao: mostrarIdentificacao.asReadonly(),

        // Computed
        clienteIdentificado,
        temNome,

        // Ações
        setNome,
        setObservacaoGeral,
        abrirIdentificacao,
        fecharIdentificacao,
        confirmarIdentificacao,
        limpar
    };
}
