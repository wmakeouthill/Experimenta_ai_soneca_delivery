import { inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { DeliveryService } from '../../../services/delivery.service';

/**
 * Interface para item do pedido (simplificada)
 * Aceita tanto 'produtoId' quanto 'produtoNome' para compatibilidade
 */
interface ItemPedido {
    produtoId?: string;
    produtoNome: string;
}

/**
 * Interface para pedido selecionado
 * Flexível para aceitar diferentes formatos de itens
 */
interface PedidoSelecionado {
    id: string;
    itens?: Array<{ produtoId?: string; produtoNome: string; quantidade?: number }>;
}

/**
 * Composable para gerenciar avaliações de produtos em pedidos de delivery.
 * Encapsula toda a lógica de avaliação com estrelas e comentários.
 *
 * @param getClienteId - Função que retorna o ID do cliente atual
 * @param getPedidoSelecionado - Função que retorna o pedido selecionado
 * @param onAvaliacaoEnviada - Callback opcional chamado quando avaliação é enviada com sucesso
 */
export function useAvaliacao(
    getClienteId: () => string | undefined,
    getPedidoSelecionado: () => PedidoSelecionado | null,
    onAvaliacaoEnviada?: (pedidoId: string) => void
) {
    const deliveryService = inject(DeliveryService);

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

        const mapAvaliacoes = avaliacoes();

        for (const item of pedido.itens) {
            // Verifica se tem avaliação salva pelo ID
            if (item.produtoId) {
                const keyId = getAvaliacaoKey(pedido.id, item.produtoId);
                if ((mapAvaliacoes.get(keyId) || 0) > 0) return true;
            }

            // Verifica se tem avaliação salva pelo Nome (usado no template atual)
            if (item.produtoNome) {
                const keyNome = getAvaliacaoKey(pedido.id, item.produtoNome);
                if ((mapAvaliacoes.get(keyNome) || 0) > 0) return true;
            }
        }
        return false;
    }

    function getMediaAvaliacaoPedido(): number {
        const pedido = getPedidoSelecionado();
        if (!pedido || !pedido.itens || pedido.itens.length === 0) return 0;

        const mapAvaliacoes = avaliacoes();
        let soma = 0;
        let count = 0;

        for (const item of pedido.itens) {
            let nota = 0;

            // Tenta pegar por Nome (prioridade do template)
            if (item.produtoNome) {
                const keyNome = getAvaliacaoKey(pedido.id, item.produtoNome);
                nota = mapAvaliacoes.get(keyNome) || 0;
            }

            // Se não achou, tenta por ID
            if (nota === 0 && item.produtoId) {
                const keyId = getAvaliacaoKey(pedido.id, item.produtoId);
                nota = mapAvaliacoes.get(keyId) || 0;
            }

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
    }

    async function enviarAvaliacao(): Promise<void> {
        const clienteId = getClienteId();
        const pedido = getPedidoSelecionado();
        if (!clienteId || !pedido) return;

        const comentario = comentariosPedido().get(pedido.id) || '';
        const itens = pedido.itens || [];
        if (itens.length === 0) return;

        salvando.set(true);

        try {
            // Coleta todas as avaliações para enviar
            const avaliacoesParaEnviar: { produtoId: string; nota: number }[] = [];

            for (const item of itens) {
                let nota = 0;

                // Tenta encontrar a nota armazenada (pode ter sido salva por ID ou Nome)
                // O template atual usa Nome, então priorizamos verificar isso
                if (item.produtoNome) {
                    const keyNome = getAvaliacaoKey(pedido.id, item.produtoNome);
                    const n = avaliacoes().get(keyNome);
                    if (n && n > 0) nota = n;
                }

                // Se não achou por nome, tenta por ID
                if (nota === 0 && item.produtoId) {
                    const keyId = getAvaliacaoKey(pedido.id, item.produtoId);
                    const n = avaliacoes().get(keyId);
                    if (n && n > 0) nota = n;
                }

                if (nota > 0) {
                    // Para o backend, DEVEMOS usar o ID se disponível
                    const idParaBackend = item.produtoId || item.produtoNome;
                    avaliacoesParaEnviar.push({ produtoId: idParaBackend, nota });
                }
            }

            if (avaliacoesParaEnviar.length === 0) {
                salvando.set(false);
                return;
            }

            // Envia cada avaliação para o backend
            let primeiraAvaliacao = true;
            for (const av of avaliacoesParaEnviar) {
                // Só envia comentário na primeira avaliação
                const comentarioParaEnviar = primeiraAvaliacao ? comentario : undefined;

                await firstValueFrom(
                    deliveryService.avaliarProduto(
                        av.produtoId,
                        pedido.id,
                        av.nota,
                        comentarioParaEnviar
                    )
                );
                primeiraAvaliacao = false;
            }

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

            // Notifica callback se definido
            if (onAvaliacaoEnviada) {
                onAvaliacaoEnviada(pedido.id);
            }

        } catch (error) {
            console.error('Erro ao enviar avaliação:', error);
        } finally {
            salvando.set(false);
        }
    }

    function carregarAvaliacoesCliente(): void {
        const clienteId = getClienteId();
        if (!clienteId) return;

        deliveryService.buscarAvaliacoesCliente().subscribe({
            next: (listaAvaliacoes) => {
                if (!listaAvaliacoes || listaAvaliacoes.length === 0) return;

                const novosAvaliacoes = new Map(avaliacoes());
                const novosComentarios = new Map(comentariosPedido());
                const novosSubmetidos = new Map(avaliacaoSubmetida());

                listaAvaliacoes.forEach(av => {
                    // Armazena a nota usando ID e também Nome (se possível de resolver, mas por ID é o padrão do backend)
                    // Como aqui só temos ID do backend, armazenamos pela chave ID
                    const keyId = getAvaliacaoKey(av.pedidoId, av.produtoId);
                    novosAvaliacoes.set(keyId, av.nota);

                    // Marca pedido como avaliado/submetido
                    novosSubmetidos.set(av.pedidoId, true);

                    // Se tiver comentário, armazena
                    if (av.comentario) {
                        novosComentarios.set(av.pedidoId, av.comentario);
                    }
                });

                avaliacoes.set(novosAvaliacoes);
                comentariosPedido.set(novosComentarios);
                avaliacaoSubmetida.set(novosSubmetidos);
            },
            error: (err) => console.error('Erro ao carregar avaliações:', err)
        });
    }

    /**
     * Gera array de estrelas para renderização.
     * @param nota Nota atual (1-5)
     * @returns Array de 5 elementos indicando se cada estrela está preenchida
     */
    function getEstrelas(nota: number): boolean[] {
        return [1, 2, 3, 4, 5].map(i => i <= nota);
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
        getEstrelas,

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
