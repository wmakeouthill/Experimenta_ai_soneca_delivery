import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UploadUtil } from '../../../../utils/upload.util';

export interface ConfigAnimacao {
  animacaoAtivada: boolean;
  intervaloAnimacao: number;
  duracaoAnimacao: number;
  video1Url?: string | null;
  video2Url?: string | null;
}

@Component({
  selector: 'app-config-animacao-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './config-animacao-modal.component.html',
  styleUrl: './config-animacao-modal.component.css'
})
export class ConfigAnimacaoModalComponent {
  readonly aberto = input<boolean>(false);
  readonly configInicial = input<ConfigAnimacao>({
    animacaoAtivada: true,
    intervaloAnimacao: 30,
    duracaoAnimacao: 6
  });

  readonly onSalvar = output<ConfigAnimacao>();
  readonly onFechar = output<void>();

  readonly animacaoAtivada = signal<boolean>(true);
  readonly intervaloAnimacao = signal<number>(30);
  readonly duracaoAnimacao = signal<number>(6);
  readonly video1Url = signal<string | null>(null);
  readonly video2Url = signal<string | null>(null);
  
  readonly carregandoVideo1 = signal<boolean>(false);
  readonly carregandoVideo2 = signal<boolean>(false);

  readonly configAtual = computed(() => ({
    animacaoAtivada: this.animacaoAtivada(),
    intervaloAnimacao: this.intervaloAnimacao(),
    duracaoAnimacao: this.duracaoAnimacao(),
    video1Url: this.video1Url(),
    video2Url: this.video2Url()
  }));

  constructor() {
    // Sincronizar com configInicial quando mudar
    effect(() => {
      const config = this.configInicial();
      this.animacaoAtivada.set(config.animacaoAtivada);
      this.intervaloAnimacao.set(config.intervaloAnimacao);
      this.duracaoAnimacao.set(config.duracaoAnimacao);
      this.video1Url.set(config.video1Url || null);
      this.video2Url.set(config.video2Url || null);
    }, { allowSignalWrites: true });
  }

  onVideo1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      alert('Vídeo muito grande. Tamanho máximo: 100MB');
      return;
    }

    this.carregandoVideo1.set(true);
    UploadUtil.fileParaBase64(file)
      .then((base64) => {
        this.video1Url.set(base64);
        this.carregandoVideo1.set(false);
      })
      .catch((error) => {
        alert('Erro ao processar vídeo: ' + error.message);
        this.carregandoVideo1.set(false);
      });
  }

  onVideo2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Por favor, selecione um arquivo de vídeo válido');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      alert('Vídeo muito grande. Tamanho máximo: 100MB');
      return;
    }

    this.carregandoVideo2.set(true);
    UploadUtil.fileParaBase64(file)
      .then((base64) => {
        this.video2Url.set(base64);
        this.carregandoVideo2.set(false);
      })
      .catch((error) => {
        alert('Erro ao processar vídeo: ' + error.message);
        this.carregandoVideo2.set(false);
      });
  }

  removerVideo1(): void {
    this.video1Url.set(null);
  }

  removerVideo2(): void {
    this.video2Url.set(null);
  }

  salvar(): void {
    this.onSalvar.emit(this.configAtual());
  }

  fechar(): void {
    this.onFechar.emit();
  }

  fecharOverlay(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.fechar();
    }
  }
}

