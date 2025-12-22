import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';

export interface EnderecoViaCep {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string;
    uf: string;
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
    erro?: boolean;
}

export interface Endereco {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
}

@Injectable({
    providedIn: 'root'
})
export class CepService {
    private readonly http = inject(HttpClient);
    private readonly viaCepUrl = 'https://viacep.com.br/ws';

    /**
     * Busca endereço pelo CEP usando a API ViaCEP
     * @param cep CEP com ou sem formatação (ex: 01310-100 ou 01310100)
     * @returns Observable com o endereço ou null se não encontrado
     */
    buscarPorCep(cep: string): Observable<Endereco | null> {
        // Remove caracteres não numéricos
        const cepLimpo = cep.replace(/\D/g, '');

        // Valida se tem 8 dígitos
        if (cepLimpo.length !== 8) {
            return of(null);
        }

        return this.http.get<EnderecoViaCep>(`${this.viaCepUrl}/${cepLimpo}/json/`).pipe(
            map(response => {
                if (response.erro) {
                    return null;
                }

                return {
                    cep: response.cep,
                    logradouro: response.logradouro || '',
                    complemento: response.complemento || '',
                    bairro: response.bairro || '',
                    cidade: response.localidade || '',
                    estado: response.uf || ''
                };
            }),
            catchError(() => of(null))
        );
    }

    /**
     * Formata CEP para exibição (00000-000)
     */
    formatarCep(cep: string): string {
        const numeros = cep.replace(/\D/g, '');
        if (numeros.length <= 5) {
            return numeros;
        }
        return `${numeros.slice(0, 5)}-${numeros.slice(5, 8)}`;
    }

    /**
     * Valida se o CEP tem formato válido (8 dígitos)
     */
    validarCep(cep: string): boolean {
        const numeros = cep.replace(/\D/g, '');
        return numeros.length === 8;
    }
}
