import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { normalizarError } from './core/interceptors/auth.interceptor';
import { HttpErrorResponse } from '@angular/common/http';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    // jsdom no implementa matchMedia (lo usan ngx-sonner y el modo oscuro).
    window.matchMedia ??= ((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => undefined, removeListener: () => undefined,
      addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();
  });

  it('crea la aplicación con la marca AgroCrew en la cabecera', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('.marca')?.textContent).toContain('AgroCrew');
  });

  it('muestra el aviso de alcance referencial en el pie de página (US21)', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('footer')?.textContent).toContain('no reemplazan la evaluación de un ingeniero agrónomo');
  });
});

describe('normalizarError (T63)', () => {
  it('usa el mensaje del backend cuando viene en la respuesta', () => {
    const e = normalizarError(new HttpErrorResponse({
      status: 409, error: { estado: 409, mensaje: 'El correo ya está registrado' },
    }));
    expect(e.estado).toBe(409);
    expect(e.mensaje).toBe('El correo ya está registrado');
  });

  it('da un mensaje claro si el servidor no responde', () => {
    const e = normalizarError(new HttpErrorResponse({ status: 0 }));
    expect(e.mensaje).toContain('No pudimos conectarnos');
  });

  it('da un mensaje claro para un servicio externo caído (503)', () => {
    const e = normalizarError(new HttpErrorResponse({ status: 503, error: null }));
    expect(e.mensaje).toContain('no está disponible');
  });
});
