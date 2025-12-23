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
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
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
}
