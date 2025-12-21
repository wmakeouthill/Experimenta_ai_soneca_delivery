import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadUtil } from '../../../../utils/upload.util';

/**
 * Componente reutilizável para upload de imagem.
 * Pequeno, focado e reutilizável.
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.css'
})
export class ImageUploadComponent {
  readonly imagemAtual = input<string | null>(null);
  readonly tamanhoMaximoMB = input<number>(5);
  readonly larguraMaxima = input<number>(800);
  readonly alturaMaxima = input<number>(800);
  readonly label = input<string>('Imagem do Produto');

  readonly onImagemSelecionada = output<string>(); // Base64 string
  readonly onErro = output<string>();

  readonly imagemPreview = signal<string | null>(null);
  readonly carregando = signal(false);

  readonly temImagem = computed(() => {
    const preview = this.imagemPreview();
    const atual = this.imagemAtual();
    return !!(preview || atual);
  });

  readonly urlPreview = computed(() => {
    return this.imagemPreview() || this.imagemAtual() || '';
  });

  private ultimaImagemAtual: string | null = null;
  private usuarioDefiniuPreview = false;

  constructor() {
    // Effect para sincronizar imagemAtual com preview
    // Usar allowSignalWrites e evitar leitura do próprio signal dentro do effect
    effect(() => {
      const imagemAtual = this.imagemAtual();
      
      // Só atualizar se a imagemAtual mudou e usuário não definiu preview
      if (imagemAtual !== this.ultimaImagemAtual) {
        this.ultimaImagemAtual = imagemAtual;
        
        if (imagemAtual && !this.usuarioDefiniuPreview) {
          // Atualizar preview apenas se usuário não definiu um próprio
          // Usar setTimeout para evitar mutação durante effect
          setTimeout(() => {
            this.imagemPreview.set(imagemAtual);
          }, 0);
        } else if (!imagemAtual && !this.usuarioDefiniuPreview) {
          // Só limpar se não houver imagem atual e usuário não definiu preview
          // Usar setTimeout para evitar mutação durante effect
          setTimeout(() => {
            // Verificar se não está carregando antes de limpar (fora do effect)
            if (!this.carregando()) {
              this.imagemPreview.set(null);
            }
          }, 0);
        }
      }
    }, { allowSignalWrites: true });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tipo
    if (!UploadUtil.eImagem(file)) {
      this.onErro.emit('Por favor, selecione uma imagem válida');
      return;
    }

    // Validar tamanho
    if (!UploadUtil.validarTamanho(file, this.tamanhoMaximoMB())) {
      this.onErro.emit(`Imagem muito grande. Tamanho máximo: ${this.tamanhoMaximoMB()}MB`);
      return;
    }

    this.carregando.set(true);

    // Redimensionar e converter para base64
    UploadUtil.redimensionarImagem(file, this.larguraMaxima(), this.alturaMaxima())
      .then((fileRedimensionado) => UploadUtil.fileParaBase64(fileRedimensionado))
      .then((base64) => {
        this.usuarioDefiniuPreview = true; // Marcar que usuário definiu preview
        this.imagemPreview.set(base64);
        this.onImagemSelecionada.emit(base64);
        this.carregando.set(false);
      })
      .catch((error) => {
        this.onErro.emit(error.message || 'Erro ao processar imagem');
        this.carregando.set(false);
      });
  }

  removerImagem(): void {
    this.usuarioDefiniuPreview = false; // Resetar flag
    this.imagemPreview.set(null);
    this.onImagemSelecionada.emit('');
    
    // Resetar input
    const input = document.getElementById('image-upload-input') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }
}

