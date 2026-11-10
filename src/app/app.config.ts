import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsPe from '@angular/common/locales/es-PE';
import { ApplicationConfig, LOCALE_ID, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideRouter, TitleStrategy, withComponentInputBinding, withInMemoryScrolling, withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { LOCALE } from './core/i18n/idioma';
import { TituloTraducido } from './core/i18n/titulo-traducido';
import { authInterceptor } from './core/interceptors/auth.interceptor';

// Fechas, números y montos en formato peruano (S/ 18,000.00; 07/11/2026). El inglés (en-US) viene incluido.
registerLocaleData(localeEsPe);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' }),
      // Transición suave entre pantallas (si el navegador la soporta).
      withViewTransitions({ skipInitialTransition: true })),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: LOCALE },
    { provide: TitleStrategy, useClass: TituloTraducido },
  ],
};
