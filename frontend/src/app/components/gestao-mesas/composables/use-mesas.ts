import { inject, signal, computed } from '@angular/core';
import { MesaService, Mesa, CriarMesaRequest, AtualizarMesaRequest } from '../../../services/mesa.service';
import { NotificationService } from '../../../services/notification.service';
import { firstValueFrom } from 'rxjs';

/**
 * Composable para gerenciamento de mesas.
 * Centraliza a lógica de carregamento, criação e manipulação de mesas.
 * Segue Clean Code e Single Responsibility Principle.
 */
export function useMesas() {
    const mesaService = inject(MesaService);
    const notificationService = inject(NotificationService);

    // Estados
    const mesas = signal<Mesa[]>([]);
    const carregando = signal(false);
    const erro = signal<string | null>(null);
    const mesaSelecionada = signal<Mesa | null>(null);

    // Computeds
    const totalMesas = computed(() => mesas().length);
    const mesasAtivas = computed(() => mesas().filter(m => m.ativa));
    const mesasInativas = computed(() => mesas().filter(m => !m.ativa));

    // Métodos
    async function carregarMesas(): Promise<void> {
        carregando.set(true);
        erro.set(null);

        try {
            const resultado = await firstValueFrom(mesaService.listar());
            mesas.set(resultado);
        } catch (e: any) {
            const mensagem = e.error?.message || 'Erro ao carregar mesas';
            erro.set(mensagem);
            notificationService.erro(mensagem);
        } finally {
            carregando.set(false);
        }
    }

    async function criarMesa(request: CriarMesaRequest): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const novaMesa = await firstValueFrom(mesaService.criar(request));
            mesas.update(lista => [...lista, novaMesa].sort((a, b) => a.numero - b.numero));
            notificationService.sucesso(`Mesa ${novaMesa.numero} criada com sucesso!`);
            return true;
        } catch (e: any) {
            const mensagem = e.error?.message || 'Erro ao criar mesa';
            erro.set(mensagem);
            notificationService.erro(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    async function atualizarMesa(id: string, request: AtualizarMesaRequest): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            const mesaAtualizada = await firstValueFrom(mesaService.atualizar(id, request));
            mesas.update(lista =>
                lista.map(m => m.id === id ? mesaAtualizada : m).sort((a, b) => a.numero - b.numero)
            );
            notificationService.sucesso('Mesa atualizada com sucesso!');
            return true;
        } catch (e: any) {
            const mensagem = e.error?.message || 'Erro ao atualizar mesa';
            erro.set(mensagem);
            notificationService.erro(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    async function excluirMesa(id: string): Promise<boolean> {
        carregando.set(true);
        erro.set(null);

        try {
            await firstValueFrom(mesaService.excluir(id));
            mesas.update(lista => lista.filter(m => m.id !== id));
            notificationService.sucesso('Mesa excluída com sucesso!');
            return true;
        } catch (e: any) {
            const mensagem = e.error?.message || 'Erro ao excluir mesa';
            erro.set(mensagem);
            notificationService.erro(mensagem);
            return false;
        } finally {
            carregando.set(false);
        }
    }

    async function alternarStatus(mesa: Mesa): Promise<boolean> {
        return atualizarMesa(mesa.id, { ativa: !mesa.ativa });
    }

    function gerarUrlQrCode(mesa: Mesa): string {
        return mesaService.gerarUrlQrCode(mesa.qrCodeToken);
    }

    function selecionarMesa(mesa: Mesa | null): void {
        mesaSelecionada.set(mesa);
    }

    return {
        // Estado (readonly para consumidor)
        mesas: mesas.asReadonly(),
        carregando: carregando.asReadonly(),
        erro: erro.asReadonly(),
        mesaSelecionada: mesaSelecionada.asReadonly(),

        // Computeds
        totalMesas,
        mesasAtivas,
        mesasInativas,

        // Ações
        carregarMesas,
        criarMesa,
        atualizarMesa,
        excluirMesa,
        alternarStatus,
        gerarUrlQrCode,
        selecionarMesa
    };
}
