/**
 * Utilitários para validação.
 * Funções puras e reutilizáveis seguindo DRY.
 */
export class ValidacaoUtil {
  /**
   * Valida se uma string não está vazia após trim.
   */
  static naoVazio(valor: string | null | undefined): boolean {
    return valor != null && valor.trim().length > 0;
  }

  /**
   * Valida se um número é positivo.
   */
  static numeroPositivo(valor: number | null | undefined): boolean {
    return valor != null && !isNaN(valor) && valor > 0;
  }

  /**
   * Valida preço (maior que zero).
   */
  static precoValido(valor: number | string | null | undefined): boolean {
    if (valor == null) return false;
    
    const num = typeof valor === 'string' ? parseFloat(valor) : valor;
    return !isNaN(num) && num > 0;
  }

  /**
   * Valida email básico.
   */
  static emailValido(email: string | null | undefined): boolean {
    if (!email) return false;
    
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Retorna mensagem de erro padronizada.
   */
  static mensagemErro(campo: string, erro: string): string {
    return `${campo}: ${erro}`;
  }
}

