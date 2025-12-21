import { inject, signal, computed, Signal } from '@angular/core';
import { PedidoMesaService } from '../../../services/pedido-mesa.service';

/**
 * Interface para item do pedido (simplificada)
 */
interface ItemPedido {
    produtoId: string;
    nomeProduto: string;
}

/**
 * Interface para pedido selecionado
 */
interface PedidoSelecionado {
    id: string;
    itens?: ItemPedido[];
}

/**
 * Composable para gerenciar avaliações de produtos em pedidos.
 * Encapsula toda a lógica de avaliação com estrelas e comentários.
 *
 * @param getClienteId - Função que retorna o ID do cliente atual
 * @param getPedidoSelecionado - Função que retorna o pedido selecionado
 */
export function useAvaliacao(
    getClienteId: () => string | undefined,
    getPedidoSelecionado: () => PedidoSelecionado | null
) {
    const pedidoMesaService = inject(PedidoMesaService);

    // ========== Estado Interno ==========
    // Chave: "pedidoId:produtoId" => nota (número de estrelas)
    const avaliacoes = signal<Map<string, number>>(new Map());
    // Comentário por pedido (não por produto)
    const comentariosPedido = signal<Map<string, string>>(new Map());
    // Feedback visual: pedidoId => true se comentário foi salvo
    const comentarioSalvo = signal<Map<string, boolean>>(new Map());
    // Loading state
    const salvando = signal(false);
    // Modo de edição de avaliação por pedido
    const editandoAvaliacao = signal<Map<string, boolean>>(new Map());
    // Avaliação submetida (enviada pelo botão Enviar) por pedido
    const avaliacaoSubmetida = signal<Map<string, boolean>>(new Map());

    // ========== Funções Auxiliares ==========
    function getAvaliacaoKey(pedidoId: string, produtoId: string): string {
        return `${pedidoId}:${produtoId}`;
    }

    // ========== Getters ==========
    function getAvaliacaoProduto(produtoId: string): number {
        const pedido = getPedidoSelecionado();
        if (!pedido) return 0;
        const key = getAvaliacaoKey(pedido.id, produtoId);
        return avaliacoes().get(key) || 0;
    }

    function getComentarioPedido(): string {
        const pedido = getPedidoSelecionado();
        if (!pedido) return '';
        return comentariosPedido().get(pedido.id) || '';
    }

    function isComentarioSalvo(): boolean {
        const pedido = getPedidoSelecionado();
        if (!pedido) return false;
        return comentarioSalvo().get(pedido.id) || false;
    }

    // ========== Verificações de Estado ==========
    function pedidoJaAvaliado(): boolean {
        const pedido = getPedidoSelecionado();
        if (!pedido) return false;
        return avaliacaoSubmetida().get(pedido.id) || false;
    }

    function isEditando(): boolean {
        const pedido = getPedidoSelecionado();
        if (!pedido) return false;
        return editandoAvaliacao().get(pedido.id) || false;
    }

    function temAlgumaAvaliacao(): boolean {
        const pedido = getPedidoSelecionado();
        if (!pedido || !pedido.itens) return false;

        for (const item of pedido.itens) {
            const key = getAvaliacaoKey(pedido.id, item.produtoId);
            if ((avaliacoes().get(key) || 0) > 0) {
                return true;
            }
        }
        return false;
    }

    function getMediaAvaliacaoPedido(): number {
        const pedido = getPedidoSelecionado();
        if (!pedido || !pedido.itens || pedido.itens.length === 0) return 0;

        let soma = 0;
        let count = 0;
        for (const item of pedido.itens) {
            const key = getAvaliacaoKey(pedido.id, item.produtoId);
            const nota = avaliacoes().get(key) || 0;
            if (nota > 0) {
                soma += nota;
                count++;
            }
        }
        return count > 0 ? Math.round(soma / count) : 0;
    }

    // ========== Setters ==========
    function setComentarioPedido(comentario: string): void {
        const pedido = getPedidoSelecionado();
        if (!pedido) return;

        const novosComentarios = new Map(comentariosPedido());
        novosComentarios.set(pedido.id, comentario);
        comentariosPedido.set(novosComentarios);

        // Remove o status de "salvo" quando editar
        const novoStatus = new Map(comentarioSalvo());
        novoStatus.delete(pedido.id);
        comentarioSalvo.set(novoStatus);
    }

    // ========== Ações ==========
    function entrarModoEdicao(): void {
        const pedido = getPedidoSelecionado();
        if (!pedido) return;
        const novoStatus = new Map(editandoAvaliacao());
        novoStatus.set(pedido.id, true);
        editandoAvaliacao.set(novoStatus);
    }

    function avaliarProduto(produtoId: string, nota: number): void {
        const clienteId = getClienteId();
        const pedido = getPedidoSelecionado();
        if (!clienteId || !pedido) return;

        const key = getAvaliacaoKey(pedido.id, produtoId);

        // Atualiza localmente
        const novasAvaliacoes = new Map(avaliacoes());
        novasAvaliacoes.set(key, nota);
        avaliacoes.set(novasAvaliacoes);

        // Pega o comentário atual do pedido
        const comentario = comentariosPedido().get(pedido.id);

        // Envia para o backend
        pedidoMesaService.avaliarProduto(clienteId, produtoId, pedido.id, nota, comentario || undefined).subscribe({
            next: () => {
                // Sucesso - já está atualizado localmente
            },
            error: () => {
                console.error('Erro ao salvar avaliação');
            }
        });
    }

    function enviarAvaliacao(): void {
        const clienteId = getClienteId();
        const pedido = getPedidoSelecionado();
        if (!clienteId || !pedido) return;

        const comentario = comentariosPedido().get(pedido.id) || '';
        const itens = pedido.itens || [];
        if (itens.length === 0) return;

        salvando.set(true);

        // Salva todas as avaliações com o comentário
        let salvou = false;
        for (const item of itens) {
            const key = getAvaliacaoKey(pedido.id, item.produtoId);
            const nota = avaliacoes().get(key);
            if (nota && nota > 0) {
                pedidoMesaService.avaliarProduto(
                    clienteId,
                    item.produtoId,
                    pedido.id,
                    nota,
                    salvou ? undefined : comentario // Só envia comentário na primeira
                ).subscribe({
                    next: () => {
                        salvando.set(false);

                        // Marca como salvo
                        const novoStatusSalvo = new Map(comentarioSalvo());
                        novoStatusSalvo.set(pedido.id, true);
                        comentarioSalvo.set(novoStatusSalvo);

                        // Marca como submetida
                        const novoStatusSubmetida = new Map(avaliacaoSubmetida());
                        novoStatusSubmetida.set(pedido.id, true);
                        avaliacaoSubmetida.set(novoStatusSubmetida);

                        // Sai do modo edição
                        const novoStatusEditando = new Map(editandoAvaliacao());
                        novoStatusEditando.delete(pedido.id);
                        editandoAvaliacao.set(novoStatusEditando);
                    },
                    error: () => {
                        salvando.set(false);
                        console.error('Erro ao salvar avaliação');
                    }
                });
                salvou = true;
            }
        }

        // Se não salvou nenhuma (não tinha estrelas), mostra erro
        if (!salvou) {
            salvando.set(false);
        }
    }

    function carregarAvaliacoesCliente(): void {
        const clienteId = getClienteId();
        if (!clienteId) return;

        pedidoMesaService.buscarAvaliacoesCliente(clienteId).subscribe({
            next: (avaliacoesList) => {
                const novasAvaliacoes = new Map<string, number>();
                const novosComentarios = new Map<string, string>();
                const pedidosComAvaliacao = new Set<string>();

                for (const avaliacao of avaliacoesList) {
                    if (avaliacao.pedidoId && avaliacao.produtoId) {
                        const key = getAvaliacaoKey(avaliacao.pedidoId, avaliacao.produtoId);
                        novasAvaliacoes.set(key, avaliacao.nota);
                        pedidosComAvaliacao.add(avaliacao.pedidoId);

                        // Guarda o comentário por pedido (pega o primeiro que encontrar)
                        if (avaliacao.comentario && !novosComentarios.has(avaliacao.pedidoId)) {
                            novosComentarios.set(avaliacao.pedidoId, avaliacao.comentario);
                        }
                    }
                }

                avaliacoes.set(novasAvaliacoes);
                comentariosPedido.set(novosComentarios);

                // Marca pedidos que têm avaliação do backend como submetidos
                const novoStatusSubmetida = new Map<string, boolean>();
                for (const pedidoId of pedidosComAvaliacao) {
                    novoStatusSubmetida.set(pedidoId, true);
                }
                avaliacaoSubmetida.set(novoStatusSubmetida);
            },
            error: () => {
                console.error('Erro ao carregar avaliações');
            }
        });
    }

    // ========== API Pública ==========
    return {
        // Estado (readonly)
        salvando: salvando.asReadonly(),
        comentarioSalvo: comentarioSalvo.asReadonly(),
        pedidosAvaliados: avaliacaoSubmetida.asReadonly(),

        // Getters
        getAvaliacaoProduto,
        getComentarioPedido,
        isComentarioSalvo,
        getMediaAvaliacaoPedido,

        // Verificações
        pedidoJaAvaliado,
        isEditando,
        temAlgumaAvaliacao,
        isPedidoAvaliado: (pedidoId: string) => avaliacaoSubmetida().get(pedidoId) || false,

        // Setters
        setComentarioPedido,

        // Ações
        entrarModoEdicao,
        avaliarProduto,
        enviarAvaliacao,
        carregarAvaliacoesCliente
    };
}
