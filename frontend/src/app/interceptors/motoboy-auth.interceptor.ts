import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'motoboy-auth-token';
const MOTOBOY_KEY = 'motoboy-auth-data';

/**
 * Interceptor que adiciona automaticamente o token JWT e o X-Motoboy-Id
 * em todas as requisições para /api/motoboy/
 *
 * Isso garante que todas as ações do motoboy (listar pedidos, etc.)
 * sejam autenticadas corretamente.
 */
export const motoboyAuthInterceptor: HttpInterceptorFn = (req, next) => {
    // Só intercepta requisições para /api/motoboy/
    if (!req.url.includes('/api/motoboy/')) {
        return next(req);
    }

    // Tenta obter dados do sessionStorage
    let token: string | null = null;
    let motoboyId: string | null = null;

    if (typeof sessionStorage !== 'undefined') {
        token = sessionStorage.getItem(TOKEN_KEY);
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

    // Se não tiver token ou motoboyId, deixa passar (vai falhar no backend)
    if (!token || !motoboyId) {
        console.warn('Motoboy não autenticado para:', req.url);
        return next(req);
    }

    // Clona a requisição adicionando os headers
    const clonedReq = req.clone({
        setHeaders: {
            'Authorization': `Bearer ${token}`,
            'X-Motoboy-Id': motoboyId
        }
    });

    return next(clonedReq);
};

