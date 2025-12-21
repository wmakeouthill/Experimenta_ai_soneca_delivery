/**
 * Utilitário para fazer proxy de imagens externas através do backend.
 * Resolve problemas de CORS e rate limiting (429) do Google.
 */
export class ImageProxyUtil {
  /**
   * Converte uma URL de imagem externa para usar o proxy do backend.
   *
   * @param url URL original da imagem
   * @returns URL do proxy do backend
   */
  static getProxyUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Se já é uma URL do proxy, retorna como está
    if (url.includes('/api/publico/cliente/imagem/proxy')) {
      return url;
    }

    // Se é uma URL do Google, usa o proxy
    if (url.startsWith('https://lh3.googleusercontent.com/') ||
      url.startsWith('https://www.google.com/') ||
      url.startsWith('https://googleusercontent.com/')) {
      // Codificar URL em Base64 para passar como parâmetro
      const encodedUrl = btoa(url);
      return `/api/publico/cliente/imagem/proxy?url=${encodedUrl}`;
    }

    // Para outras URLs, retorna como está (pode ser base64 ou URL local)
    return url;
  }
}
