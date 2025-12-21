import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'cliente-auth-token';
const CLIENTE_KEY = 'cliente-auth-data';

/**
 * Interceptor que adiciona automaticamente o token JWT e o X-Cliente-Id
 * em todas as requisições para /api/cliente/
 *
 * Isso garante que todas as ações do cliente (favoritos, avaliações, telefone, etc.)
 * sejam autenticadas corretamente.
 */
export const clienteAuthInterceptor: HttpInterceptorFn = (req, next) => {
    // Só intercepta requisições para /api/cliente/
    if (!req.url.includes('/api/cliente/')) {
        return next(req);
    }

    // Sempre anexa os headers (inclusive em localhost e durante testes)
    // para garantir chamadas autenticadas do cliente.

    // Tenta obter dados do sessionStorage
    let token: string | null = null;
    let clienteId: string | null = null;

    if (typeof sessionStorage !== 'undefined') {
        token = sessionStorage.getItem(TOKEN_KEY);
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

    // Se não tiver token ou clienteId, deixa passar (vai falhar no backend)
    if (!token || !clienteId) {
        console.warn('Cliente não autenticado para:', req.url);
        return next(req);
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
