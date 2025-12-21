export interface PaginacaoResult<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

export function paginar<T>(itens: T[], itensPorPagina: number, pagina: number): PaginacaoResult<T> {
  const inicio = (pagina - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const itensPaginados = itens.slice(inicio, fim);
  const totalPaginas = Math.ceil(itens.length / itensPorPagina);

  return {
    itens: itensPaginados,
    paginaAtual: pagina,
    totalPaginas,
    totalItens: itens.length
  };
}

