/**
 * Utilitários para upload de arquivos.
 * Funções puras e reutilizáveis seguindo DRY.
 */
export class UploadUtil {
  /**
   * Converte File para base64 string.
   */
  static fileParaBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('Arquivo não fornecido'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Valida se o arquivo é uma imagem.
   */
  static eImagem(file: File): boolean {
    return file.type.startsWith('image/');
  }

  /**
   * Valida tamanho máximo do arquivo (em bytes).
   */
  static validarTamanho(file: File, tamanhoMaximoMB: number): boolean {
    const tamanhoMaximoBytes = tamanhoMaximoMB * 1024 * 1024;
    return file.size <= tamanhoMaximoBytes;
  }

  /**
   * Redimensiona imagem mantendo proporção.
   */
  static redimensionarImagem(
    file: File,
    larguraMaxima: number,
    alturaMaxima: number,
    qualidade: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let largura = img.width;
          let altura = img.height;

          // Calcular novas dimensões mantendo proporção
          if (largura > altura) {
            if (largura > larguraMaxima) {
              altura = (altura * larguraMaxima) / largura;
              largura = larguraMaxima;
            }
          } else {
            if (altura > alturaMaxima) {
              largura = (largura * alturaMaxima) / altura;
              altura = alturaMaxima;
            }
          }

          canvas.width = largura;
          canvas.height = altura;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao criar contexto do canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, largura, altura);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erro ao criar blob'));
                return;
              }
              const fileResized = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(fileResized);
            },
            file.type,
            qualidade
          );
        };
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    });
  }
}

