import { ApplicationConfig, APP_INITIALIZER, EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration, withNoHttpTransferCache } from '@angular/platform-browser';
import { authInterceptor } from './interceptors/auth.interceptor';
import { authErrorInterceptor } from './interceptors/auth-error.interceptor';
import { silent404Interceptor } from './interceptors/silent-404.interceptor';
import { silent500ConfigInterceptor } from './interceptors/silent-500-config.interceptor';
import { clienteAuthInterceptor } from './interceptors/cliente-auth.interceptor';
import { motoboyAuthInterceptor } from './interceptors/motoboy-auth.interceptor';
import { clienteAuthErrorInterceptor } from './interceptors/cliente-auth-error.interceptor';
import { motoboyAuthErrorInterceptor } from './interceptors/motoboy-auth-error.interceptor';
import { PwaInstallService } from './services/pwa-install.service';
import { environment } from '../environments/environment';

// Instancia o serviço de PWA o mais cedo possível para não perder o evento beforeinstallprompt.
const initPwaInstallService = (service: PwaInstallService) => () => {
  // Apenas injetar já registra o listener; nenhuma ação extra aqui.
  return void service;
};

// Hydration só em produção (quando SSR está ativo)
// Em desenvolvimento, SSR está desabilitado então hydration causa erro NG0505
const hydrationProvider: (Provider | EnvironmentProviders)[] = environment.production
  ? [provideClientHydration(withNoHttpTransferCache())]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    // Preload all modules em background após carregamento inicial (melhora navegação)
    provideRouter(routes, withPreloading(PreloadAllModules)),
    // Hydration condicional - só em produção com SSR
    ...hydrationProvider,
    provideHttpClient(
      withFetch(),
      withInterceptors([
        clienteAuthInterceptor,         // Adiciona token JWT e X-Cliente-Id para clientes
        clienteAuthErrorInterceptor,    // Limpa sessão se o cliente não existir mais
        motoboyAuthInterceptor,         // Adiciona token JWT e X-Motoboy-Id para motoboys
        motoboyAuthErrorInterceptor,    // Limpa sessão se o motoboy não existir mais
        authInterceptor,                // Adiciona token JWT nas requisições (funcionários)
        authErrorInterceptor,           // Trata erros 401/403 e redireciona para login
        silent404Interceptor,           // Trata 404 silenciosamente para sessões
        silent500ConfigInterceptor      // Trata 500 silenciosamente para config
      ])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initPwaInstallService,
      deps: [PwaInstallService],
      multi: true
    }
  ]
};
