import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, HostListener, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { cambiarIdioma, IDIOMA } from '../core/i18n/idioma';
import { Rol } from '../core/models/api.models';
import { AlertaService } from '../core/services/alerta.service';
import { AuthService } from '../core/services/auth.service';
import { TemaService } from '../core/services/tema.service';
import { Icono, NombreIcono } from '../shared/components/icono';
import { EtiquetaPipe } from '../shared/pipes/etiqueta.pipe';
import { TPipe } from '../shared/pipes/t.pipe';

interface EnlaceMenu {
  ruta: string;
  texto: string;
  icono: NombreIcono;
  alertas?: boolean;
}

const MENU_POR_ROL: Record<Rol, EnlaceMenu[]> = {
  PRODUCTOR: [
    { ruta: '/predios', texto: 'Mis predios', icono: 'hoja' },
    { ruta: '/mapa', texto: 'Mapa de riesgo', icono: 'mapa' },
    { ruta: '/alertas', texto: 'Alertas', icono: 'campana', alertas: true },
  ],
  ASESOR: [
    { ruta: '/dashboard', texto: 'Dashboard por zona', icono: 'grafico' },
  ],
  ADMIN: [
    { ruta: '/dashboard', texto: 'Dashboard', icono: 'grafico' },
    { ruta: '/admin/usuarios', texto: 'Usuarios', icono: 'usuarios' },
    { ruta: '/admin/cultivos', texto: 'Cultivos', icono: 'brote' },
    { ruta: '/admin/datos-economicos', texto: 'Datos económicos', icono: 'moneda' },
  ],
};

/**
 * Cabecera fija (T60): marca, menú según el rol, indicador de alertas sin leer (T88), "Mi cuenta",
 * y los botones de modo oscuro e idioma. En pantallas de 768 px o menos el menú se oculta tras el
 * botón ☰ (aria-expanded / aria-controls) y se cierra solo al elegir una opción.
 */
@Component({
  selector: 'app-cabecera',
  imports: [RouterLink, RouterLinkActive, EtiquetaPipe, TPipe, Icono],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.scss',
})
export class Cabecera {
  protected readonly auth = inject(AuthService);
  protected readonly alertas = inject(AlertaService);
  protected readonly tema = inject(TemaService);
  private readonly elemento = inject(ElementRef<HTMLElement>);

  protected readonly idioma = IDIOMA;
  protected readonly menuAbierto = signal(false);
  protected readonly cuentaAbierta = signal(false);
  protected readonly conSombra = signal(false);
  protected readonly enlaces = computed(() => {
    const rol = this.auth.rol();
    return rol ? MENU_POR_ROL[rol] : [];
  });
  protected readonly iniciales = computed(() => {
    const u = this.auth.usuario();
    return u ? `${u.nombres.charAt(0)}${u.apellidos.charAt(0)}`.toUpperCase() : '';
  });

  constructor() {
    const router = inject(Router);
    // Cierra los menús al navegar y actualiza el contador de alertas del productor.
    router.events.pipe(filter((e) => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => {
        this.menuAbierto.set(false);
        this.cuentaAbierta.set(false);
        if (this.auth.rol() === 'PRODUCTOR') {
          this.alertas.refrescarContador();
        }
      });
    effect(() => {
      if (this.auth.rol() !== 'PRODUCTOR') {
        this.alertas.noLeidas.set(0);
      }
    });
  }

  protected cambiarIdioma(): void {
    cambiarIdioma(this.idioma === 'es' ? 'en' : 'es');
  }

  protected cerrarSesion(): void {
    this.auth.cerrarSesion();
  }

  @HostListener('window:scroll')
  protected alDesplazar(): void {
    this.conSombra.set(window.scrollY > 8);
  }

  @HostListener('document:click', ['$event'])
  protected clicFuera(evento: MouseEvent): void {
    if (this.cuentaAbierta() && !this.elemento.nativeElement.querySelector('.cuenta')?.contains(evento.target as Node)) {
      this.cuentaAbierta.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected escape(): void {
    this.cuentaAbierta.set(false);
    this.menuAbierto.set(false);
  }
}
