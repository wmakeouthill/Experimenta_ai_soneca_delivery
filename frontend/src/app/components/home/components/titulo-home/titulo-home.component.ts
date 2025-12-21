import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-titulo-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './titulo-home.component.html',
  styleUrl: './titulo-home.component.css'
})
export class TituloHomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('textoElement', { static: false }) textoElement!: ElementRef<HTMLElement>;
  @ViewChild('containerElement', { static: false }) containerElement!: ElementRef<HTMLElement>;

  private resizeObserver?: ResizeObserver;

  constructor(private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    // Aguarda as imagens carregarem
    setTimeout(() => {
      this.ajustarTamanhoFonte();

      // Observa mudanças de tamanho do container
      if (this.containerElement && window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.ajustarTamanhoFonte();
        });
        this.resizeObserver.observe(this.containerElement.nativeElement);
      }

      // Também observa mudanças de tamanho da janela
      window.addEventListener('resize', () => this.ajustarTamanhoFonte());
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    window.removeEventListener('resize', () => this.ajustarTamanhoFonte());
  }

  private ajustarTamanhoFonte(): void {
    if (!this.textoElement || !this.containerElement) return;

    const textoEl = this.textoElement.nativeElement;
    const containerEl = this.containerElement.nativeElement;

    // Obtém as imagens para calcular o espaço disponível
    const imagens = containerEl.querySelectorAll('.titulo-imagem');
    const larguraImagens = Array.from(imagens).reduce((total, img) => {
      return total + (img as HTMLElement).offsetWidth;
    }, 0);

    // Calcula o espaço disponível (largura do container - imagens - gaps)
    const gap = 0.5 * 16; // 0.5rem em pixels (assumindo 16px base)
    const larguraContainer = containerEl.offsetWidth;
    const larguraDisponivel = larguraContainer - larguraImagens - (gap * 2);

    if (larguraDisponivel <= 0) return;

    // Texto a ser medido
    const texto = textoEl.textContent || '';

    // Tamanho mínimo e máximo
    const tamanhoMinimo = 19.2; // 1.2rem em pixels
    const tamanhoMaximo = 999 * 16; // 999rem em pixels

    // Usa busca binária para encontrar o tamanho ideal
    let min = tamanhoMinimo;
    let max = tamanhoMaximo;
    let tamanhoAtual = tamanhoMinimo;

    // Testa diferentes tamanhos até encontrar o que cabe
    while (max - min > 1) {
      tamanhoAtual = (min + max) / 2;
      textoEl.style.fontSize = `${tamanhoAtual}px`;

      if (textoEl.scrollWidth <= larguraDisponivel) {
        min = tamanhoAtual;
      } else {
        max = tamanhoAtual;
      }
    }

    // Aplica o tamanho final
    textoEl.style.fontSize = `${min}px`;
    this.cdr.markForCheck();
  }
}

