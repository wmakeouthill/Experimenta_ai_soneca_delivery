/**
 * Composables do componente de auto atendimento (totem).
 * Reutiliza composables existentes e adiciona lógica específica do totem.
 */

export { useAutoAtendimentoCardapio } from './use-autoatendimento-cardapio';
export { useAutoAtendimentoCarrinho, type ItemCarrinhoTotem, type ItemAdicionalTotem } from './use-autoatendimento-carrinho';
export { useAutoAtendimentoPagamento, type MeioPagamentoTotem, type EtapaTotem } from './use-autoatendimento-pagamento';
export { useAutoAtendimentoCliente } from './use-autoatendimento-cliente';
