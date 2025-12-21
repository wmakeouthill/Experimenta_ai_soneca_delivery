/**
 * Composables do componente de pedido de cliente via mesa (QR Code).
 * Cada composable tem responsabilidade única seguindo princípio SOLID.
 */

export { useIdentificacaoCliente, type ClienteIdentificado } from './use-identificacao-cliente';
export { useCarrinho, type ItemCarrinho, type ItemAdicionalCarrinho } from './use-carrinho';
export { usePagamento, type MeioPagamentoSelecionado, type MeioPagamentoTipo, type EtapaCarrinho } from './use-pagamento';
export { useCardapio, type GrupoCategoria } from './use-cardapio';
export { useFavoritos } from './use-favoritos';
export { useClienteAuth } from './use-cliente-auth';
export { useGoogleAuth } from './use-google-auth';
export { useInicio, type ProdutoPopular } from './use-inicio';
export { useSucessoPedido } from './use-sucesso-pedido';
export { useMeusPedidos } from './use-meus-pedidos';
export { useAvaliacao } from './use-avaliacao';
export { useChatIA, type MensagemChat, type ChatIAComposable, type ProdutoDestacado } from './use-chat-ia';
