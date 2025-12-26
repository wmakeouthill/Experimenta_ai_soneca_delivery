import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ClienteAuthService } from '../services/cliente-auth.service';

const TOKEN_KEY = 'cliente-auth-token';
const CLIENTE_KEY = 'cliente-auth-data';

/**
 * Interceptor que adiciona automaticamente o token JWT e o X-Cliente-Id
 * em todas as requisições para /api/cliente/
 *
 * Prioriza o token do serviço (BehaviorSubject) que é atualizado sincronamente
 * após o login, garantindo que requisições imediatas funcionem.
 * Usa sessionStorage apenas como fallback.
 */
export const clienteAuthInterceptor: HttpInterceptorFn = (req, next) => {
    // Só intercepta requisições para /api/cliente/
    if (!req.url.includes('/api/cliente/')) {
        return next(req);
    }

    // Obtém token e clienteId preferencialmente do serviço
    const authService = inject(ClienteAuthService);

    let token: string | null = authService.token;
    let clienteId: string | null = authService.clienteLogado?.id ?? null;

    // Fallback: tenta obter do sessionStorage se o serviço não tiver
    if ((!token || !clienteId) && typeof sessionStorage !== 'undefined') {
        if (!token) {
            token = sessionStorage.getItem(TOKEN_KEY);
        }
        if (!clienteId) {
            const clienteStr = sessionStorage.getItem(CLIENTE_KEY);
            if (clienteStr) {
                try {
                    const cliente = JSON.parse(clienteStr);
                    clienteId = cliente?.id || null;
                } catch {
                    // Ignora erro de parse
                }
            }
        }
    }

    // Se não tiver token ou clienteId, deixa passar (vai falhar no backend)
    if (!token || !clienteId) {
        console.warn('Cliente não autenticado para:', req.url);
        return next(req);
    }

    // Log de debug em desenvolvimento
    if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
        console.debug('[ClienteAuth] Interceptando requisição:', req.url, { hasToken: !!token, clienteId });
    }

    // Clona a requisição adicionando os headers
    const clonedReq = req.clone({
        setHeaders: {
            'Authorization': `Bearer ${token}`,
            'X-Cliente-Id': clienteId
        }
    });

    return next(clonedReq);
};
