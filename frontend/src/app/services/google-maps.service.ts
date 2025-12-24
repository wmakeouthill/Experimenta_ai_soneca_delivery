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
        // Sempre verifica se precisa recarregar (pode ter mudado a biblioteca)
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement;
        
        if (existingScript && !existingScript.src.includes('directions')) {
            // Remove script antigo sem directions
            existingScript.remove();
            this.scriptLoaded = false;
            this.loadPromise = null;
        } else if (existingScript && existingScript.src.includes('directions')) {
            // Script já existe com directions, verifica se está carregado
            if (this.scriptLoaded && typeof google !== 'undefined' && google.maps) {
                return Promise.resolve();
            }
            if (this.loadPromise) return this.loadPromise;
        }

        if (this.scriptLoaded && typeof google !== 'undefined' && google.maps) {
            return Promise.resolve();
        }
        if (this.loadPromise) return this.loadPromise;

        if (!this.apiKey) {
            console.warn('Google Maps API Key não encontrada em environment.ts. O mapa não será carregado.');
            return Promise.reject('API Key missing');
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Verifica se já existe script com directions
            const existingScriptWithDirections = document.querySelector('script[src*="maps.googleapis.com"][src*="directions"]') as HTMLScriptElement;
            
            if (existingScriptWithDirections) {
                // Verifica se google.maps já está disponível
                if (typeof google !== 'undefined' && google.maps) {
                    this.scriptLoaded = true;
                    resolve();
                    return;
                } else {
                    // Aguarda o script carregar
                    existingScriptWithDirections.addEventListener('load', () => {
                        this.scriptLoaded = true;
                        resolve();
                    });
                    return;
                }
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places,directions&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // Aguarda um pouco para garantir que a API está totalmente carregada
                setTimeout(() => {
                    this.scriptLoaded = true;
                    resolve();
                }, 100);
            };
            script.onerror = (error) => {
                console.error('Erro ao carregar Google Maps script:', error);
                reject(error);
            };
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
     * Aguarda até que google.maps esteja disponível.
     */
    getGoogleMaps(): Promise<any> {
        return this.loadScript().then(() => {
            return new Promise((resolve, reject) => {
                // Verifica se google.maps já está disponível
                if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                    resolve(google.maps);
                    return;
                }

                // Se não estiver, aguarda até estar disponível
                let tentativas = 0;
                const maxTentativas = 50; // 5 segundos máximo
                const intervalo = setInterval(() => {
                    tentativas++;
                    if (typeof google !== 'undefined' && google.maps && google.maps.Map) {
                        clearInterval(intervalo);
                        resolve(google.maps);
                    } else if (tentativas >= maxTentativas) {
                        clearInterval(intervalo);
                        reject(new Error('Google Maps API não carregou após timeout'));
                    }
                }, 100);
            });
        });
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
