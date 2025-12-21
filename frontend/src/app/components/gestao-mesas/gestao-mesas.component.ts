import { Component, inject, signal, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { useMesas } from './composables/use-mesas';
import { Mesa } from '../../services/mesa.service';

@Component({
    selector: 'app-gestao-mesas',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule],
    templateUrl: './gestao-mesas.component.html',
    styleUrl: './gestao-mesas.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GestaoMesasComponent implements OnInit {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);
    private readonly fb = inject(FormBuilder);

    readonly mesasComposable = useMesas();

    readonly mesas = this.mesasComposable.mesas;
    readonly carregando = this.mesasComposable.carregando;
    readonly erro = this.mesasComposable.erro;
    readonly totalMesas = this.mesasComposable.totalMesas;

    readonly mostrarModal = signal(false);
    readonly mostrarModalQrCode = signal(false);
    readonly mesaEditando = signal<Mesa | null>(null);
    readonly mesaQrCode = signal<Mesa | null>(null);

    readonly form: FormGroup;

    constructor() {
        this.form = this.fb.group({
            numero: [null, [Validators.required, Validators.min(1)]],
            nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
        });
    }

    ngOnInit(): void {
        if (this.isBrowser) {
            this.mesasComposable.carregarMesas();
        }
    }

    abrirModalCriar(): void {
        this.mesaEditando.set(null);
        this.form.reset({
            numero: this.sugerirProximoNumero(),
            nome: ''
        });
        this.mostrarModal.set(true);
    }

    abrirModalEditar(mesa: Mesa): void {
        this.mesaEditando.set(mesa);
        this.form.patchValue({
            numero: mesa.numero,
            nome: mesa.nome
        });
        this.mostrarModal.set(true);
    }

    fecharModal(): void {
        this.mostrarModal.set(false);
        this.mesaEditando.set(null);
        this.form.reset();
    }

    async salvar(): Promise<void> {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const formValue = this.form.value;
        const mesaEditando = this.mesaEditando();

        if (mesaEditando) {
            const sucesso = await this.mesasComposable.atualizarMesa(mesaEditando.id, {
                numero: formValue.numero,
                nome: formValue.nome
            });
            if (sucesso) {
                this.fecharModal();
            }
        } else {
            const sucesso = await this.mesasComposable.criarMesa({
                numero: formValue.numero,
                nome: formValue.nome
            });
            if (sucesso) {
                this.fecharModal();
            }
        }
    }

    async excluirMesa(mesa: Mesa): Promise<void> {
        if (!confirm(`Tem certeza que deseja excluir a mesa ${mesa.numero} - ${mesa.nome}?`)) {
            return;
        }
        await this.mesasComposable.excluirMesa(mesa.id);
    }

    async alternarStatus(mesa: Mesa): Promise<void> {
        await this.mesasComposable.alternarStatus(mesa);
    }

    abrirQrCode(mesa: Mesa): void {
        this.mesaQrCode.set(mesa);
        this.mostrarModalQrCode.set(true);
    }

    fecharModalQrCode(): void {
        this.mostrarModalQrCode.set(false);
        this.mesaQrCode.set(null);
    }

    obterUrlQrCode(mesa: Mesa): string {
        return this.mesasComposable.gerarUrlQrCode(mesa);
    }

    copiarUrl(mesa: Mesa): void {
        const url = this.obterUrlQrCode(mesa);
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => {
                alert('Link copiado para a área de transferência!');
            });
        }
    }

    imprimirQrCode(mesa: Mesa): void {
        const url = this.obterUrlQrCode(mesa);
        // Abre janela de impressão com o QR code
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code Mesa ${mesa.numero}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 40px;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              padding: 30px;
              border: 3px solid #FF6B35;
              border-radius: 20px;
            }
            h1 {
              color: #FF6B35;
              font-size: 2.5em;
              margin-bottom: 10px;
            }
            h2 {
              color: #333;
              font-size: 1.5em;
              margin-bottom: 30px;
            }
            .qr-code {
              margin: 30px 0;
            }
            .qr-code img {
              width: 250px;
              height: 250px;
            }
            .instructions {
              color: #666;
              font-size: 1.2em;
              margin-top: 30px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Mesa ${mesa.numero}</h1>
            <h2>${mesa.nome}</h2>
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}" alt="QR Code">
            </div>
            <p class="instructions">📱 Escaneie o QR Code para fazer seu pedido!</p>
          </div>
          <button class="no-print" onclick="window.print();" style="margin-top:20px;padding:10px 20px;font-size:16px;">Imprimir</button>
        </body>
        </html>
      `);
            printWindow.document.close();
        }
    }

    private sugerirProximoNumero(): number {
        const mesasAtuais = this.mesas();
        if (mesasAtuais.length === 0) return 1;
        const maxNumero = Math.max(...mesasAtuais.map(m => m.numero));
        return maxNumero + 1;
    }

    isEditando(): boolean {
        return this.mesaEditando() !== null;
    }

    get numero() { return this.form.get('numero'); }
    get nome() { return this.form.get('nome'); }
}
