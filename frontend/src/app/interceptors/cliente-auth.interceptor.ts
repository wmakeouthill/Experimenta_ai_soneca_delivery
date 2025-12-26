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
    let tokenSource = 'service';

    // Debug: Log inicial do estado do serviço
    console.debug('[ClienteAuth Interceptor] Estado inicial:', {
        url: req.url,
        tokenFromService: !!token,
        clienteIdFromService: !!clienteId,
        serviceEstaLogado: authService.estaLogado
    });

    // Fallback: tenta obter do sessionStorage se o serviço não tiver
    if ((!token || !clienteId) && typeof sessionStorage !== 'undefined') {
        if (!token) {
            token = sessionStorage.getItem(TOKEN_KEY);
            if (token) tokenSource = 'sessionStorage';
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

        // Debug: Log após fallback
        if (tokenSource === 'sessionStorage') {
            console.debug('[ClienteAuth Interceptor] Usando fallback sessionStorage:', {
                url: req.url,
                hasToken: !!token,
                hasClienteId: !!clienteId
            });
        }
    }

    // Se não tiver token ou clienteId, deixa passar (vai falhar no backend)
    if (!token || !clienteId) {
        console.warn('[ClienteAuth Interceptor] ⚠️ Cliente não autenticado para:', req.url, {
            tokenFromService: !!authService.token,
            clienteIdFromService: !!authService.clienteLogado?.id,
            tokenFromSessionStorage: typeof sessionStorage !== 'undefined' ? !!sessionStorage.getItem(TOKEN_KEY) : 'N/A',
            clienteFromSessionStorage: typeof sessionStorage !== 'undefined' ? !!sessionStorage.getItem(CLIENTE_KEY) : 'N/A'
        });
        return next(req);
    }

    // Log de debug com fonte do token
    console.debug('[ClienteAuth Interceptor] ✅ Autenticando requisição:', {
        url: req.url,
        tokenSource,
        clienteId: clienteId.substring(0, 8) + '...',
        tokenLength: token.length
    });

    // Clona a requisição adicionando os headers
    const clonedReq = req.clone({
        setHeaders: {
            'Authorization': `Bearer ${token}`,
            'X-Cliente-Id': clienteId
        }
    });

    return next(clonedReq);
};
