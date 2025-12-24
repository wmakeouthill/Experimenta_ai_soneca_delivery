import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

declare var google: any;

@Injectable({
    providedIn: 'root'
})
export class GoogleMapsService {
    private scriptLoaded = false;
    private loadPromise: Promise<void> | null = null;
    // Acessa a chave de forma segura, usando any caso a tipagem do environment não tenha sido atualizada globalmente
    private apiKey = (environment as any).googleMapsApiKey;

    constructor() { }

    /**
     * Carrega o script da API do Google Maps dinamicamente.
     */
    loadScript(): Promise<void> {
        if (this.scriptLoaded) return Promise.resolve();
        if (this.loadPromise) return this.loadPromise;

        if (!this.apiKey) {
            console.warn('Google Maps API Key não encontrada em environment.ts. O mapa não será carregado.');
            return Promise.reject('API Key missing'); // Rejeita para que quem chame saiba que não vai rolar
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Verifica se já existe script (caso tenha sido injetado por outro meio)
            if (document.querySelector('script[src*="maps.googleapis.com"]')) {
                this.scriptLoaded = true;
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,directions&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                this.scriptLoaded = true;
                resolve();
            };
            script.onerror = (error) => reject(error);
            document.head.appendChild(script);
        });

        return this.loadPromise;
    }

    /**
     * Geocodifica um endereço (String -> Lat/Lng).
     */
    geocodeAddress(address: string): Promise<{ lat: number, lng: number } | null> {
        return this.loadScript().then(() => {
            return new Promise<{ lat: number, lng: number } | null>((resolve, reject) => {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ 'address': address }, (results: any[], status: any) => {
                    if (status === 'OK' && results[0]) {
                        const location = results[0].geometry.location;
                        resolve({ lat: location.lat(), lng: location.lng() });
                    } else {
                        console.warn('Geocode falhou: ' + status);
                        resolve(null);
                    }
                });
            });
        }).catch(err => {
            console.error('Erro ao carregar Maps para Geocode:', err);
            return null;
        });
    }

    /**
     * Retorna a API do Google Maps carregada.
     */
    getGoogleMaps(): Promise<any> {
        return this.loadScript().then(() => google.maps);
    }

    /**
     * Abre o Google Maps com uma rota otimizada entre dois pontos.
     * @param origemLat Latitude do ponto de origem
     * @param origemLng Longitude do ponto de origem
     * @param destinoLat Latitude do ponto de destino
     * @param destinoLng Longitude do ponto de destino
     */
    abrirRotaNoMaps(origemLat: number, origemLng: number, destinoLat: number, destinoLng: number): void {
        // URL do Google Maps com direções
        // Usa o modo de direções (directions) que calcula a rota mais rápida
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origemLat},${origemLng}&destination=${destinoLat},${destinoLng}&travelmode=driving`;
        window.open(url, '_blank');
    }

    /**
     * Abre o Google Maps com uma rota otimizada usando a localização atual do usuário.
     * Solicita permissão de geolocalização do navegador.
     * @param destinoLat Latitude do ponto de destino
     * @param destinoLng Longitude do ponto de destino
     */
    abrirRotaComLocalizacaoAtual(destinoLat: number, destinoLng: number): void {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const origemLat = position.coords.latitude;
                    const origemLng = position.coords.longitude;
                    this.abrirRotaNoMaps(origemLat, origemLng, destinoLat, destinoLng);
                },
                (error) => {
                    console.error('Erro ao obter localização:', error);
                    // Se não conseguir obter localização, abre apenas o destino
                    const url = `https://www.google.com/maps/search/?api=1&query=${destinoLat},${destinoLng}`;
                    window.open(url, '_blank');
                }
            );
        } else {
            // Navegador não suporta geolocalização, abre apenas o destino
            const url = `https://www.google.com/maps/search/?api=1&query=${destinoLat},${destinoLng}`;
            window.open(url, '_blank');
        }
    }
}
