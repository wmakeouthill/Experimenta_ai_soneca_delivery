/**
 * Utilitários para formatação de valores.
 * Funções puras e reutilizáveis seguindo DRY.
 */
export class FormatoUtil {
  /**
   * Formata um valor numérico como moeda brasileira.
   */
  static moeda(valor: number | string | null | undefined): string {
    if (valor == null) return 'R$ 0,00';

    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  }

  /**
   * Remove formatação de moeda e retorna número.
   */
  static moedaParaNumero(valor: string): number {
    if (!valor) return 0;

    return parseFloat(
      valor
        .replace(/[^\d,]/g, '')
        .replace(',', '.')
    ) || 0;
  }

  /**
   * Formata número para input de moeda.
   */
  static numeroParaInputMoeda(valor: number | string | null | undefined): string {
    if (valor == null) return '';

    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(num)) return '';

    return num.toFixed(2).replace('.', ',');
  }

  /**
   * Limita o texto às primeiras N palavras.
   */
  static limitarPalavras(texto: string | null | undefined, maxPalavras: number = 3): string {
    if (!texto) return '';
    const palavras = texto.trim().split(/\s+/);
    return palavras.slice(0, maxPalavras).join(' ');
  }

  /**
   * Formata data/hora para exibição em português brasileiro.
   * Usa fuso horário de Brasília/São Paulo (America/Sao_Paulo).
   */
  static dataHora(data: string | Date | null | undefined): string {
    if (!data) return '';

    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dataObj);
  }

  /**
   * Formata apenas a data (sem hora) para exibição em português brasileiro.
   * Usa fuso horário de Brasília/São Paulo (America/Sao_Paulo).
   */
  static data(data: string | Date | null | undefined): string {
    if (!data) return '';

    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dataObj);
  }

  /**
   * Formata apenas a hora (sem data) para exibição em português brasileiro.
   * Usa fuso horário de Brasília/São Paulo (America/Sao_Paulo).
   */
  static hora(data: string | Date | null | undefined): string {
    if (!data) return '';

    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dataObj);
  }

  /**
   * Formata data e hora completa para exibição em português brasileiro.
   * Inclui segundos. Usa fuso horário de Brasília/São Paulo (America/Sao_Paulo).
   */
  static dataHoraCompleta(data: string | Date | null | undefined): string {
    if (!data) return '';

    const dataObj = typeof data === 'string' ? new Date(data) : data;
    if (isNaN(dataObj.getTime())) return '';

    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(dataObj);
  }

  /**
   * Formata nome com primeira letra maiúscula em cada palavra.
   * Palavras com 2 letras ou menos (como "de", "da", "do") permanecem minúsculas.
   * A primeira palavra sempre começa com maiúscula.
   * Exemplo: "JOAO DA SILVA" → "Joao da Silva", "maria de souza" → "Maria de Souza"
   */
  static capitalizarNome(nome: string | null | undefined): string {
    if (!nome) return '';
    
    const nomeTrimmed = nome.trim();
    if (!nomeTrimmed) return '';
    
    const palavras = nomeTrimmed.split(/\s+/);
    
    return palavras.map((palavra, index) => {
      if (!palavra) return palavra;
      
      const palavraLower = palavra.toLowerCase();
      
      // Primeira palavra sempre começa com maiúscula
      if (index === 0) {
        return palavraLower.charAt(0).toUpperCase() + palavraLower.slice(1);
      }
      
      // Palavras com mais de 2 letras: primeira maiúscula
      if (palavraLower.length > 2) {
        return palavraLower.charAt(0).toUpperCase() + palavraLower.slice(1);
      }
      
      // Palavras com 2 letras ou menos: mantém minúscula
      return palavraLower;
    }).join(' ');
  }
}

