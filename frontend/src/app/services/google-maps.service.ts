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
        // Remove TODOS os scripts antigos do Google Maps para evitar conflitos
        const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
        existingScripts.forEach(script => {
            const src = (script as HTMLScriptElement).src;
            // Remove scripts antigos ou com callback (versões antigas)
            if (src.includes('callback=') || !src.includes('libraries=places')) {
                script.remove();
                this.scriptLoaded = false;
                this.loadPromise = null;
            }
        });

        // Verifica se já existe script com places carregado
        const existingScriptWithPlaces = document.querySelector('script[src*="maps.googleapis.com"][src*="libraries=places"]:not([src*="callback"])') as HTMLScriptElement;
        
        if (existingScriptWithPlaces) {
            // Script já existe com places, verifica se está carregado
            if (this.scriptLoaded && typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
                return Promise.resolve();
            }
            if (this.loadPromise) return this.loadPromise;
        }

        if (this.scriptLoaded && typeof google !== 'undefined' && google.maps && google.maps.DirectionsService) {
            return Promise.resolve();
        }
        if (this.loadPromise) return this.loadPromise;

        if (!this.apiKey) {
            console.warn('Google Maps API Key não encontrada em environment.ts. O mapa não será carregado.');
            return Promise.reject('API Key missing');
        }

        this.loadPromise = new Promise((resolve, reject) => {
            // Verifica se já existe script com places carregado
            const existingScriptWithPlaces = document.querySelector('script[src*="maps.googleapis.com"][src*="libraries=places"]') as HTMLScriptElement;
            
            if (existingScriptWithPlaces) {
                // Verifica se google.maps já está disponível
                if (typeof google !== 'undefined' && google.maps) {
                    this.scriptLoaded = true;
                    resolve();
                    return;
                } else {
                    // Aguarda o script carregar
                    existingScriptWithPlaces.addEventListener('load', () => {
                        this.scriptLoaded = true;
                        resolve();
                    });
                    return;
                }
            }

            const script = document.createElement('script');
            // ✅ CORRIGIDO: A biblioteca 'directions' não existe - DirectionsService/DirectionsRenderer já estão na biblioteca principal
            // Places API (New) usa apenas 'places' - DirectionsService já está incluído na biblioteca principal
            script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                // Aguarda um pouco para garantir que todas as bibliotecas estão disponíveis
                // Verifica especificamente se DirectionsService está disponível
                let tentativas = 0;
                const maxTentativas = 50; // 5 segundos
                const checkDirections = setInterval(() => {
                    tentativas++;
                    if (typeof google !== 'undefined' && 
                        google.maps && 
                        google.maps.DirectionsService && 
                        google.maps.DirectionsRenderer) {
                        clearInterval(checkDirections);
                        console.log('Biblioteca Directions carregada com sucesso');
                        this.scriptLoaded = true;
                        resolve();
                    } else if (tentativas >= maxTentativas) {
                        clearInterval(checkDirections);
                        console.warn('Biblioteca Directions não encontrada após timeout, mas continuando...');
                        if (typeof google !== 'undefined' && google.maps) {
                            this.scriptLoaded = true;
                            resolve();
                        } else {
                            reject(new Error('Google Maps não carregou após timeout'));
                        }
                    }
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
