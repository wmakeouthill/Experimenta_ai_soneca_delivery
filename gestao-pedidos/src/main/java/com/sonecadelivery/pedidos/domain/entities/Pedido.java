package com.sonecadelivery.pedidos.domain.entities;

import com.sonecadelivery.cardapio.domain.valueobjects.Preco;
import com.sonecadelivery.kernel.domain.entities.BaseEntity;
import com.sonecadelivery.kernel.domain.exceptions.ValidationException;
import com.sonecadelivery.pedidos.domain.valueobjects.NumeroPedido;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
public class Pedido extends BaseEntity {
    private NumeroPedido numeroPedido;
    private String clienteId;
    private String clienteNome;
    private StatusPedido status;
    private List<ItemPedido> itens;
    private Preco valorTotal;
    private String observacoes;
    private List<MeioPagamentoPedido> meiosPagamento;
    private String usuarioId; // Para futuro login
    private String sessaoId; // ID da sessão de trabalho
    private String mesaId; // ID da mesa (para pedidos via QR code)
    private Integer numeroMesa; // Número da mesa (para exibição)
    private String nomeClienteMesa; // Nome do cliente informado na mesa
    private LocalDateTime dataPedido;
    private LocalDateTime dataFinalizacao; // Data definitiva de finalização (imutável após definida)
    private Long version; // Para Optimistic Locking - preservado entre conversões domain/entity

    // ========== Campos de Delivery ==========
    private TipoPedido tipoPedido; // BALCAO, MESA, DELIVERY, RETIRADA
    private String enderecoEntrega; // Endereço de entrega (JSON ou texto)
    private String motoboyId; // ID do motoboy atribuído
    private Preco taxaEntrega; // Taxa de entrega
    private LocalDateTime previsaoEntrega; // Previsão de entrega

    private Pedido() {
        super();
        this.itens = new ArrayList<>();
        this.meiosPagamento = new ArrayList<>();
        this.status = StatusPedido.PENDENTE;
        this.dataPedido = LocalDateTime.now();
        this.dataFinalizacao = null; // Inicialmente nulo, será definido apenas quando finalizado
        this.tipoPedido = TipoPedido.BALCAO; // Padrão é balcão
        this.taxaEntrega = Preco.zero();
    }

    public static Pedido criar(NumeroPedido numeroPedido, String clienteId, String clienteNome, String usuarioId) {
        validarDados(numeroPedido, clienteId, clienteNome, usuarioId);

        Pedido pedido = new Pedido();
        pedido.numeroPedido = numeroPedido;
        pedido.clienteId = clienteId;
        pedido.clienteNome = clienteNome;
        pedido.usuarioId = usuarioId;
        pedido.valorTotal = Preco.zero();
        pedido.touch();
        return pedido;
    }

    /**
     * Cria um pedido via auto-atendimento (totem).
     * Este tipo de pedido não tem cliente cadastrado, apenas um nome para chamar.
     * O clienteId é null pois não há cliente cadastrado.
     */
    public static Pedido criarPedidoAutoAtendimento(NumeroPedido numeroPedido, String nomeCliente, String usuarioId) {
        validarDadosAutoAtendimento(numeroPedido, nomeCliente, usuarioId);

        Pedido pedido = new Pedido();
        pedido.numeroPedido = numeroPedido;
        pedido.clienteId = null; // Auto-atendimento não tem cliente cadastrado
        pedido.clienteNome = nomeCliente; // Nome para chamar na tela de espera
        pedido.usuarioId = usuarioId;
        pedido.valorTotal = Preco.zero();
        pedido.touch();
        return pedido;
    }

    /**
     * Cria um pedido via mesa (QR code) sem usuário operador.
     * Este tipo de pedido é feito diretamente pelo cliente.
     */
    public static Pedido criarPedidoMesa(NumeroPedido numeroPedido, String clienteId, String clienteNome) {
        validarDadosPedidoMesa(numeroPedido, clienteId, clienteNome);

        Pedido pedido = new Pedido();
        pedido.numeroPedido = numeroPedido;
        pedido.clienteId = clienteId;
        pedido.clienteNome = clienteNome;
        pedido.usuarioId = null; // Pedido de mesa não tem usuário operador
        pedido.valorTotal = Preco.zero();
        pedido.touch();
        return pedido;
    }

    /**
     * Restaura um pedido do banco de dados SEM validações.
     * Usado pelo mapper para reconstruir pedidos existentes.
     * Este método não valida os dados pois eles já foram validados na criação
     * original.
     */
    public static Pedido restaurarPedidoDoBanco(
            NumeroPedido numeroPedido,
            String clienteId,
            String clienteNome,
            String usuarioId) {
        Pedido pedido = new Pedido();
        pedido.numeroPedido = numeroPedido;
        pedido.clienteId = clienteId; // Pode ser null (auto-atendimento)
        pedido.clienteNome = clienteNome;
        pedido.usuarioId = usuarioId; // Pode ser null (pedido mesa)
        pedido.valorTotal = Preco.zero();
        return pedido;
    }

    public void adicionarItem(ItemPedido item) {
        if (item == null) {
            throw new ValidationException("Item não pode ser nulo");
        }
        if (status == StatusPedido.FINALIZADO || status == StatusPedido.CANCELADO) {
            throw new ValidationException("Não é possível adicionar itens a um pedido finalizado ou cancelado");
        }

        itens.add(item);
        recalcularValorTotal();
        touch();
    }

    public void removerItem(int indice) {
        if (indice < 0 || indice >= itens.size()) {
            throw new ValidationException("Índice do item inválido");
        }
        if (status == StatusPedido.FINALIZADO || status == StatusPedido.CANCELADO) {
            throw new ValidationException("Não é possível remover itens de um pedido finalizado ou cancelado");
        }

        itens.remove(indice);
        recalcularValorTotal();
        touch();
    }

    public void atualizarStatus(StatusPedido novoStatus) {
        if (novoStatus == null) {
            throw new ValidationException("Status não pode ser nulo");
        }
        if (!status.podeSerAtualizadoPara(novoStatus)) {
            throw new ValidationException("Não é possível atualizar o status de " + status.getDescricao() + " para "
                    + novoStatus.getDescricao());
        }

        // Define data de finalização apenas quando o status muda para FINALIZADO pela
        // primeira vez
        if (novoStatus == StatusPedido.FINALIZADO && this.dataFinalizacao == null) {
            this.dataFinalizacao = LocalDateTime.now();
        }

        this.status = novoStatus;
        touch();
    }

    public void atualizarObservacoes(String novasObservacoes) {
        this.observacoes = novasObservacoes != null ? novasObservacoes.trim() : null;
        touch();
    }

    public void adicionarMeioPagamento(MeioPagamentoPedido meioPagamentoPedido) {
        if (meioPagamentoPedido == null) {
            throw new ValidationException("Meio de pagamento não pode ser nulo");
        }
        if (status == StatusPedido.FINALIZADO || status == StatusPedido.CANCELADO) {
            throw new ValidationException(
                    "Não é possível adicionar meios de pagamento a um pedido finalizado ou cancelado");
        }
        this.meiosPagamento.add(meioPagamentoPedido);
        touch();
    }

    public void removerMeioPagamento(int indice) {
        if (indice < 0 || indice >= meiosPagamento.size()) {
            throw new ValidationException("Índice do meio de pagamento inválido");
        }
        if (status == StatusPedido.FINALIZADO || status == StatusPedido.CANCELADO) {
            throw new ValidationException(
                    "Não é possível remover meios de pagamento de um pedido finalizado ou cancelado");
        }
        meiosPagamento.remove(indice);
        touch();
    }

    public Preco calcularTotalMeiosPagamento() {
        Preco total = Preco.zero();
        for (MeioPagamentoPedido meioPagamento : meiosPagamento) {
            total = total.add(meioPagamento.getValor());
        }
        return total;
    }

    public void cancelar() {
        // Permite cancelar pedidos finalizados para casos especiais
        this.status = StatusPedido.CANCELADO;
        touch();
    }

    public void definirSessaoId(String sessaoId) {
        this.sessaoId = sessaoId;
    }

    /**
     * Define a mesa e o nome do cliente para pedidos via QR code.
     */
    public void definirMesa(String mesaId, Integer numeroMesa, String nomeClienteMesa) {
        if (mesaId != null && !mesaId.trim().isEmpty()) {
            this.mesaId = mesaId.trim();
        }
        this.numeroMesa = numeroMesa;
        if (nomeClienteMesa != null && !nomeClienteMesa.trim().isEmpty()) {
            this.nomeClienteMesa = nomeClienteMesa.trim();
        }
    }

    /**
     * Restaura os dados da mesa do banco de dados (usado pelos mappers).
     */
    public void restaurarMesaDoBanco(String mesaId, Integer numeroMesa, String nomeClienteMesa) {
        this.mesaId = mesaId;
        this.numeroMesa = numeroMesa;
        this.nomeClienteMesa = nomeClienteMesa;
    }

    /**
     * Verifica se o pedido foi feito via mesa (QR code).
     */
    public boolean isPedidoMesa() {
        return mesaId != null && !mesaId.isEmpty();
    }

    /**
     * Verifica se o pedido é de delivery.
     */
    public boolean isPedidoDelivery() {
        return tipoPedido == TipoPedido.DELIVERY;
    }

    /**
     * Verifica se o pedido é de retirada.
     */
    public boolean isPedidoRetirada() {
        return tipoPedido == TipoPedido.RETIRADA;
    }

    /**
     * Define o tipo do pedido.
     */
    public void definirTipoPedido(TipoPedido tipo) {
        if (tipo == null) {
            throw new ValidationException("Tipo do pedido não pode ser nulo");
        }
        this.tipoPedido = tipo;
        touch();
    }

    /**
     * Define os dados de delivery do pedido.
     */
    public void definirDadosDelivery(String enderecoEntrega, Preco taxaEntrega, LocalDateTime previsaoEntrega) {
        this.tipoPedido = TipoPedido.DELIVERY;
        this.enderecoEntrega = enderecoEntrega;
        this.taxaEntrega = taxaEntrega != null ? taxaEntrega : Preco.zero();
        this.previsaoEntrega = previsaoEntrega;
        touch();
    }

    /**
     * Define os dados de retirada do pedido.
     */
    public void definirDadosRetirada(LocalDateTime previsaoEntrega) {
        this.tipoPedido = TipoPedido.RETIRADA;
        this.enderecoEntrega = null;
        this.taxaEntrega = Preco.zero();
        this.previsaoEntrega = previsaoEntrega;
        touch();
    }

    /**
     * Atribui um motoboy ao pedido de delivery.
     */
    public void atribuirMotoboy(String motoboyId) {
        if (tipoPedido != TipoPedido.DELIVERY) {
            throw new ValidationException("Só é possível atribuir motoboy a pedidos de delivery");
        }
        this.motoboyId = motoboyId;
        touch();
    }

    /**
     * Define a taxa de entrega.
     */
    public void definirTaxaEntrega(Preco taxa) {
        this.taxaEntrega = taxa != null ? taxa : Preco.zero();
        touch();
    }

    /**
     * Define a previsão de entrega.
     */
    public void definirPrevisaoEntrega(LocalDateTime previsao) {
        this.previsaoEntrega = previsao;
        touch();
    }

    /**
     * Restaura os dados de delivery do banco de dados (usado pelos mappers).
     */
    public void restaurarDeliveryDoBanco(TipoPedido tipoPedido, String enderecoEntrega, String motoboyId,
            Preco taxaEntrega, LocalDateTime previsaoEntrega) {
        this.tipoPedido = tipoPedido != null ? tipoPedido : TipoPedido.BALCAO;
        this.enderecoEntrega = enderecoEntrega;
        this.motoboyId = motoboyId;
        this.taxaEntrega = taxaEntrega != null ? taxaEntrega : Preco.zero();
        this.previsaoEntrega = previsaoEntrega;
    }

    /**
     * Calcula o valor total do pedido incluindo taxa de entrega.
     */
    public Preco calcularValorTotalComTaxa() {
        Preco taxa = taxaEntrega != null ? taxaEntrega : Preco.zero();
        return valorTotal.add(taxa);
    }

    public boolean estaFinalizado() {
        return status == StatusPedido.FINALIZADO;
    }

    public boolean estaCancelado() {
        return status == StatusPedido.CANCELADO;
    }

    private void recalcularValorTotal() {
        Preco total = Preco.zero();
        for (ItemPedido item : itens) {
            total = total.add(item.calcularSubtotal());
        }
        this.valorTotal = total;
    }

    /**
     * Restaura o ID e timestamps do banco de dados (usado pelos mappers).
     */
    public void restaurarDoBanco(String id, LocalDateTime createdAt, LocalDateTime updatedAt) {
        restaurarId(id);
        restaurarTimestamps(createdAt, updatedAt);
    }

    /**
     * Restaura a versão do Optimistic Locking do banco de dados (usado pelos
     * mappers).
     * Essencial para preservar a versão entre conversões domain/entity.
     */
    public void restaurarVersionDoBanco(Long version) {
        this.version = version;
    }

    /**
     * Restaura itens do banco de dados sem validações (usado pelos mappers).
     * Este método é usado quando estamos apenas restaurando dados existentes,
     * não adicionando novos itens, então não precisa validar status.
     */
    public void restaurarItensDoBanco(List<ItemPedido> itensRestaurados) {
        if (itensRestaurados == null) {
            this.itens = new ArrayList<>();
        } else {
            this.itens = new ArrayList<>(itensRestaurados);
        }
        recalcularValorTotal();
    }

    /**
     * Restaura meios de pagamento do banco de dados sem validações (usado pelos
     * mappers).
     */
    public void restaurarMeiosPagamentoDoBanco(List<MeioPagamentoPedido> meiosPagamentoRestaurados) {
        if (meiosPagamentoRestaurados == null) {
            this.meiosPagamento = new ArrayList<>();
        } else {
            this.meiosPagamento = new ArrayList<>(meiosPagamentoRestaurados);
        }
    }

    /**
     * Restaura a data do pedido do banco de dados (usado pelos mappers).
     * Este método preserva a data original de criação do pedido.
     */
    public void restaurarDataPedidoDoBanco(LocalDateTime dataPedido) {
        if (dataPedido != null) {
            this.dataPedido = dataPedido;
        }
    }

    /**
     * Restaura a data de finalização do banco de dados (usado pelos mappers).
     * Este método preserva a data original de finalização do pedido.
     * IMPORTANTE: A data de finalização é imutável após ser definida.
     * Este método é usado apenas ao restaurar do banco, então sempre restaura o
     * valor do banco.
     */
    public void restaurarDataFinalizacaoDoBanco(LocalDateTime dataFinalizacao) {
        // Sempre restaura do banco (este método é usado apenas na restauração)
        this.dataFinalizacao = dataFinalizacao;
    }

    private static void validarDados(NumeroPedido numeroPedido, String clienteId, String clienteNome,
            String usuarioId) {
        if (numeroPedido == null) {
            throw new ValidationException("Número do pedido não pode ser nulo");
        }
        if (clienteId == null || clienteId.trim().isEmpty()) {
            throw new ValidationException("ID do cliente não pode ser nulo ou vazio");
        }
        if (clienteNome == null || clienteNome.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            throw new ValidationException("ID do usuário é obrigatório");
        }
    }

    private static void validarDadosPedidoMesa(NumeroPedido numeroPedido, String clienteId, String clienteNome) {
        if (numeroPedido == null) {
            throw new ValidationException("Número do pedido não pode ser nulo");
        }
        if (clienteId == null || clienteId.trim().isEmpty()) {
            throw new ValidationException("ID do cliente não pode ser nulo ou vazio");
        }
        if (clienteNome == null || clienteNome.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
    }

    private static void validarDadosAutoAtendimento(NumeroPedido numeroPedido, String nomeCliente, String usuarioId) {
        if (numeroPedido == null) {
            throw new ValidationException("Número do pedido não pode ser nulo");
        }
        if (nomeCliente == null || nomeCliente.trim().isEmpty()) {
            throw new ValidationException("Nome do cliente não pode ser nulo ou vazio");
        }
        if (usuarioId == null || usuarioId.trim().isEmpty()) {
            throw new ValidationException("ID do usuário é obrigatório");
        }
    }
}
