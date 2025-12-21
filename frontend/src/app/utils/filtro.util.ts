export interface FiltroTexto {
  texto: string;
  campos: string[];
}

export function filtrarPorTexto<T extends Record<string, any>>(
  itens: T[],
  filtro: FiltroTexto
): T[] {
  if (!filtro.texto || filtro.texto.trim() === '') {
    return itens;
  }

  const textoLower = filtro.texto.toLowerCase().trim();

  return itens.filter(item =>
    filtro.campos.some(campo => {
      const valor = item[campo];
      return valor && String(valor).toLowerCase().includes(textoLower);
    })
  );
}

