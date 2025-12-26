import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MotoboyAuthService } from '../services/motoboy-auth.service';

const TOKEN_KEY = 'motoboy-auth-token';
const MOTOBOY_KEY = 'motoboy-auth-data';

/**
 * Interceptor que adiciona automaticamente o token JWT e o X-Motoboy-Id
 * em todas as requisições para /api/motoboy/ e /api/motoboys/
 *
 * Prioriza o token do serviço (BehaviorSubject) que é atualizado sincronamente
 * após o login, garantindo que requisições imediatas funcionem.
 * Usa sessionStorage apenas como fallback.
 */
export const motoboyAuthInterceptor: HttpInterceptorFn = (req, next) => {
    // Intercepta requisições para /api/motoboy/ e /api/motoboys/ (mas não /api/motoboys-kanban)
    const isMotoboyEndpoint = req.url.includes('/api/motoboy/') || req.url.includes('/api/motoboys/');
    const isExcecao = req.url.includes('/api/motoboys-kanban');

    if (!isMotoboyEndpoint || isExcecao) {
        return next(req);
    }

    // Obtém token e motoboyId preferencialmente do serviço (BehaviorSubject - síncrono)
    const authService = inject(MotoboyAuthService);

    let token: string | null = authService.token;
    let motoboyId: string | null = authService.motoboyLogado?.id ?? null;
    let tokenSource = 'service';

    // Debug: Log inicial do estado do serviço
    console.debug('[MotoboyAuth Interceptor] Estado inicial:', {
        url: req.url,
        tokenFromService: !!token,
        motoboyIdFromService: !!motoboyId,
        serviceEstaLogado: authService.estaLogado
    });

    // Fallback: tenta obter do sessionStorage se o serviço não tiver
    if ((!token || !motoboyId) && typeof sessionStorage !== 'undefined') {
        try {
            if (!token) {
                token = sessionStorage.getItem(TOKEN_KEY);
                if (token) tokenSource = 'sessionStorage';
            }
            if (!motoboyId) {
                const motoboyStr = sessionStorage.getItem(MOTOBOY_KEY);
                if (motoboyStr) {
                    try {
                        const motoboy = JSON.parse(motoboyStr);
                        motoboyId = motoboy?.id || null;
                    } catch {
                        // Ignora erro de parse
                    }
                }
            }

            // Debug: Log após fallback
            if (tokenSource === 'sessionStorage') {
                console.debug('[MotoboyAuth Interceptor] Usando fallback sessionStorage:', {
                    url: req.url,
                    hasToken: !!token,
                    hasMotoboyId: !!motoboyId
                });
            }
        } catch (e) {
            console.warn('⚠️ Erro ao acessar sessionStorage:', e);
        }
    }

    // Se não tiver token ou motoboyId, deixa passar (vai falhar no backend)
    if (!token || !motoboyId) {
        console.warn('[MotoboyAuth Interceptor] ⚠️ Motoboy não autenticado para:', req.url, {
            tokenFromService: !!authService.token,
            motoboyIdFromService: !!authService.motoboyLogado?.id,
            tokenFromSessionStorage: typeof sessionStorage !== 'undefined' ? !!sessionStorage.getItem(TOKEN_KEY) : 'N/A'
        });
        return next(req);
    }

    // Log de debug com fonte do token
    console.debug('[MotoboyAuth Interceptor] ✅ Autenticando requisição:', {
        url: req.url,
        tokenSource,
        motoboyId: motoboyId.substring(0, 8) + '...',
        tokenLength: token.length
    });

    // Clona a requisição adicionando os headers
    const clonedReq = req.clone({
        setHeaders: {
            'Authorization': `Bearer ${token}`,
            'X-Motoboy-Id': motoboyId
        }
    });

    // Verifica se há discrepância entre motoboyId na URL e no storage
    const urlMotoboyIdMatch = req.url.match(/\/motoboys\/([a-f0-9-]+)/);
    if (urlMotoboyIdMatch) {
        const urlMotoboyId = urlMotoboyIdMatch[1];
        if (urlMotoboyId !== motoboyId) {
            console.error('❌ DISCREPÂNCIA DE MOTOBOY ID!', {
                urlMotoboyId,
                storedMotoboyId: motoboyId,
                url: req.url
            });
        }
    }

    return next(clonedReq);
};

