import { Component, inject, signal, computed, ChangeDetectionStrategy, ChangeDetectorRef, input, output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteAuth, ClienteAuthService, AtualizarEnderecoRequest } from '../../services/cliente-auth.service';
import { CepService } from '../../services/cep.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { firstValueFrom } from 'rxjs';

interface FormEdicaoPerfil {
    nome: string;
    telefone: string;
    email: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    pontoReferencia: string;
    latitude?: number;
    longitude?: number;
}

@Component({
    selector: 'app-menu-perfil',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './menu-perfil.component.html',
    styleUrls: ['./menu-perfil.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuPerfilComponent {
    private readonly clienteAuthService = inject(ClienteAuthService);
    private readonly cepService = inject(CepService);
    private readonly googleMapsService = inject(GoogleMapsService);
    private readonly cdr = inject(ChangeDetectorRef);

    @ViewChild('mapContainer') mapContainer?: ElementRef;
    map: any;
    marker: any;
    errorMessageMap = '';

    // Inputs
    readonly cliente = input.required<ClienteAuth>();
    readonly visivel = input(false);

    // Outputs
    readonly fechar = output<void>();
    readonly clienteAtualizado = output<ClienteAuth>();

    // Estado interno
    readonly editando = signal(false);
    readonly salvando = signal(false);
    readonly buscandoCep = signal(false);
    readonly cepEncontrado = signal<boolean | null>(null);
    readonly erro = signal<string | null>(null);

    readonly formEdicao = signal<FormEdicaoPerfil>({
        nome: '',
        telefone: '',
        email: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: '',
        pontoReferencia: ''
    });

    // Computed
    readonly telefoneFormatado = computed(() => {
        const tel = this.cliente().telefone;
        if (!tel || tel.length < 10) return tel;
        return `(${tel.slice(0, 2)}) ${tel.slice(2, 7)}-${tel.slice(7)}`;
    });

    readonly dadosValidos = computed(() => {
        const form = this.formEdicao();
        const tel = form.telefone.replace(/\D/g, '');
        const cep = form.cep.replace(/\D/g, '');
        return (
            form.nome.trim().length >= 2 &&
            tel.length >= 10 &&
            form.logradouro.trim().length >= 3 &&
            form.numero.trim().length >= 1 &&
            form.bairro.trim().length >= 2 &&
            form.cidade.trim().length >= 2 &&
            form.estado.length === 2 &&
            cep.length === 8
        );
    });

    // Métodos
    iniciarEdicao(): void {
        const c = this.cliente();
        console.log('[MenuPerfil] Iniciando edição com dados:', c);
        this.formEdicao.set({
            nome: c.nome || '',
            telefone: this.formatarTelefone(c.telefone || ''),
            email: c.email || '',
            logradouro: c.logradouro || '',
            numero: c.numero || '',
            complemento: c.complemento || '',
            bairro: c.bairro || '',
            cidade: c.cidade || '',
            estado: c.estado || '',
            cep: this.formatarCep(c.cep || ''),
            pontoReferencia: c.pontoReferencia || '',
            latitude: c.latitude,
            longitude: c.longitude
        });
        this.editando.set(true);
        this.erro.set(null);
        console.log('[MenuPerfil] Form preenchido:', this.formEdicao());
        // Se tiver coordenadas, carrega o mapa
        if (c.latitude && c.longitude) {
            setTimeout(() => this.inicializarOuAtualizarMapa(c.latitude!, c.longitude!), 200);
        } else if (c.logradouro) {
            // Se tiver endereço mas não coords, tenta geocodificar agora?
            // Melhor esperar, ou chamar método
            setTimeout(() => this.atualizarMapaComEndereco(), 200);
        }
        this.cdr.detectChanges();
    }

    cancelarEdicao(): void {
        this.editando.set(false);
        this.cepEncontrado.set(null);
    }

    fecharModal(): void {
        this.editando.set(false);
        this.cepEncontrado.set(null);
        this.fechar.emit();
    }

    atualizarForm<K extends keyof FormEdicaoPerfil>(campo: K, valor: FormEdicaoPerfil[K]): void {
        this.formEdicao.update(form => ({ ...form, [campo]: valor }));
    }

    formatarTelefone(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 2) return numeros;
        if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
        if (numeros.length <= 11) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }

    formatarCep(valor: string): string {
        const numeros = valor.replace(/\D/g, '');
        if (numeros.length <= 5) return numeros;
        return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
    }

    onTelefoneChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarTelefone(input.value);
        this.atualizarForm('telefone', formatted);
    }

    onCepChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const formatted = this.formatarCep(input.value);
        this.atualizarForm('cep', formatted);
        this.cepEncontrado.set(null);

        const cep = formatted.replace(/\D/g, '');
        if (cep.length === 8) {
            this.buscarCep(cep);
        }
    }

    private buscarCep(cep: string): void {
        this.buscandoCep.set(true);
        this.cepEncontrado.set(null);

        this.cepService.buscarPorCep(cep).subscribe({
            next: (endereco) => {
                if (endereco) {
                    this.atualizarForm('logradouro', endereco.logradouro);
                    this.atualizarForm('bairro', endereco.bairro);
                    this.atualizarForm('cidade', endereco.cidade);
                    this.atualizarForm('estado', endereco.estado);
                    this.cepEncontrado.set(true);
                    this.atualizarMapaComEndereco();
                } else {
                    this.cepEncontrado.set(false);
                }
                this.buscandoCep.set(false);
            },
            error: () => {
                this.cepEncontrado.set(false);
                this.buscandoCep.set(false);
            }
        });
    }

    async salvar(): Promise<void> {
        if (!this.dadosValidos()) return;

        this.salvando.set(true);
        this.erro.set(null);

        const form = this.formEdicao();

        try {
            const enderecoRequest: AtualizarEnderecoRequest = {
                logradouro: form.logradouro.trim(),
                numero: form.numero.trim(),
                complemento: form.complemento.trim() || undefined,
                bairro: form.bairro.trim(),
                cidade: form.cidade.trim(),
                estado: form.estado.toUpperCase(),
                cep: form.cep.replace(/\D/g, ''),
                pontoReferencia: form.pontoReferencia.trim() || undefined,
                latitude: form.latitude,
                longitude: form.longitude
            };

            const clienteAtualizado = await firstValueFrom(
                this.clienteAuthService.atualizarEndereco(enderecoRequest)
            );

            this.clienteAtualizado.emit(clienteAtualizado);
            this.editando.set(false);
        } catch (e: any) {
            console.error('Erro ao salvar perfil:', e);
            this.erro.set(e?.error?.message || 'Erro ao salvar. Tente novamente.');
        } finally {
            this.salvando.set(false);
        }
    }

    atualizarMapaComEndereco() {
        const form = this.formEdicao();
        const endereco = `${form.logradouro}, ${form.numero}, ${form.cidade} - ${form.estado}`;
        if (endereco.length < 10) return;

        this.googleMapsService.geocodeAddress(endereco).then(coords => {
            if (coords) {
                this.atualizarForm('latitude', coords.lat);
                this.atualizarForm('longitude', coords.lng);
                this.errorMessageMap = '';
                this.inicializarOuAtualizarMapa(coords.lat, coords.lng);
            } else {
                this.errorMessageMap = 'Endereço não encontrado no mapa.';
            }
        });
    }

    inicializarOuAtualizarMapa(lat: number, lng: number) {
        this.googleMapsService.getGoogleMaps().then(maps => {
            if (!this.mapContainer) return;

            const position = { lat, lng };
            if (!this.map) {
                this.map = new maps.Map(this.mapContainer.nativeElement, {
                    center: position,
                    zoom: 15
                });
                this.marker = new maps.Marker({
                    position: position,
                    map: this.map,
                    draggable: true,
                    title: "Local de Entrega"
                });

                this.marker.addListener('dragend', () => {
                    const pos = this.marker.getPosition();
                    this.atualizarForm('latitude', pos.lat());
                    this.atualizarForm('longitude', pos.lng());
                });
            } else {
                this.map.setCenter(position);
                this.marker.setPosition(position);
            }
        }).catch(() => {
            this.errorMessageMap = '';
        });
    }
}
