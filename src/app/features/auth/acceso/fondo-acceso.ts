import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, input, signal, untracked,
} from '@angular/core';

/** Foto de fondo (agricultores trabajando). Va en public/fondos/; si no existe, el fondo queda liso. */
export const FOTO_FONDO_ACCESO = 'fondos/agricultores.png';

/**
 * Fondo del acceso: una foto de agricultores oculta que solo se ve alrededor del cursor, como una linterna.
 * Con doble clic (o el botón de la escena) el círculo se abre desde ese punto hasta cubrir toda la
 * pantalla, con la foto enfocándose poco a poco; Esc, doble clic o «Volver» lo cierran con la transición
 * inversa; la interfaz se queda encima, sin ocultarse (los controla la pantalla de acceso). Publica el puntero en --px/--py (-1 a 1) del elemento padre para la profundidad de la escena.
 */
@Component({
  selector: 'app-fondo-acceso',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.completo]': 'completo()', '[class.sin-foto]': '!hayFoto()', '[class.quieto]': 'quieto' },
  template: `
    <div class="foto" aria-hidden="true" [style.background-image]="'url(' + foto + ')'"></div>
    <div class="velo" aria-hidden="true"></div>
  `,
  styles: `
    :host {
      position: absolute; inset: 0; z-index: -1; overflow: hidden;
      --mx: 50%; --my: 40%;
      background:
        radial-gradient(70% 60% at 85% 0%, color-mix(in srgb, var(--color-acento) 10%, transparent), transparent 70%),
        radial-gradient(60% 50% at 0% 100%, color-mix(in srgb, var(--color-acento) 8%, transparent), transparent 70%),
        var(--color-fondo);
    }
    .foto {
      position: absolute; inset: -2%;
      background-size: cover; background-position: 50% 25%;
      transform: scale(1.08); filter: blur(6px) saturate(0.85);
      --mascara: radial-gradient(circle var(--radio-foco) at var(--mx) var(--my), #000 0%, rgba(0, 0, 0, 0.55) 45%, transparent 100%);
      -webkit-mask-image: var(--mascara); mask-image: var(--mascara);
      transition: transform 1.8s cubic-bezier(0.16, 1, 0.3, 1),
                  filter 1.4s ease, opacity 0.6s ease;
      opacity: 0.9;
    }
    .velo {
      position: absolute; inset: 0; pointer-events: none; opacity: 0;
      background: linear-gradient(to top, rgba(10, 18, 12, 0.45), transparent 40%), rgba(10, 18, 12, 0.12);
      transition: opacity 1.2s ease 0.4s;
    }
    :host(.completo) .foto { transform: scale(1); filter: none; opacity: 1; }
    :host(.completo) .velo { opacity: 1; }


    :host(.sin-foto) .foto { display: none; }
    /* Táctil o «reducir movimiento»: sin linterna; el fondo completo sigue disponible (sin animación si se pide). */
    @media (prefers-reduced-motion: reduce) { .foto, .velo { transition: none; } }
  `,
})
export class FondoAcceso {
  readonly completo = input(false);

  protected readonly foto = FOTO_FONDO_ACCESO;
  readonly hayFoto = signal(false);
  protected readonly quieto = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce), (hover: none)').matches;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Radio actual de la linterna; se anima en TS porque no todos los navegadores interpolan variables CSS. */
  private radio = this.quieto ? 0 : 230;
  private animacion = 0;

  constructor() {
    effect(() => {
      const completo = this.completo();
      untracked(() => this.animarRadio(completo));
    });
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const img = new Image();
      img.onload = () => this.hayFoto.set(true);
      img.src = this.foto;
      if (!this.quieto) {
        this.seguirPuntero(destroyRef);
      }
    });
  }

  /** Abre el círculo hasta cubrir la pantalla (o lo cierra hasta la linterna) con una curva suave. */
  private animarRadio(completo: boolean): void {
    if (typeof window === 'undefined') {
      return;
    }
    const r = this.host.getBoundingClientRect();
    const destino = completo ? Math.hypot(r.width, r.height) * 1.6 : this.quieto ? 0 : 230;
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    cancelAnimationFrame(this.animacion);
    const desde = this.radio;
    const duracion = reducir ? 0 : completo ? 1600 : 1100;
    const inicio = performance.now();
    const curva = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const paso = (ahora: number) => {
      const t = duracion ? Math.min(1, (ahora - inicio) / duracion) : 1;
      this.radio = desde + (destino - desde) * curva(t);
      this.host.style.setProperty('--radio-foco', `${this.radio.toFixed(1)}px`);
      if (t < 1) {
        this.animacion = requestAnimationFrame(paso);
      }
    };
    this.animacion = requestAnimationFrame(paso);
  }

  /** Coloca el origen del círculo en el punto del doble clic. */
  origen(clientX: number, clientY: number): void {
    if (clientX < 0) {
      this.host.style.setProperty('--mx', '50%');
      this.host.style.setProperty('--my', '50%');
      return;
    }
    const r = this.host.getBoundingClientRect();
    this.host.style.setProperty('--mx', `${clientX - r.left}px`);
    this.host.style.setProperty('--my', `${clientY - r.top}px`);
  }

  private seguirPuntero(destroyRef: DestroyRef): void {
    const escena = this.host.parentElement ?? this.host;
    let cuadro = 0;
    let ultimo: PointerEvent | null = null;
    const aplicar = () => {
      cuadro = 0;
      if (!ultimo) {
        return;
      }
      const r = this.host.getBoundingClientRect();
      const x = ultimo.clientX - r.left;
      const y = ultimo.clientY - r.top;
      if (!this.completo()) {
        this.host.style.setProperty('--mx', `${x}px`);
        this.host.style.setProperty('--my', `${y}px`);
      }
      escena.style.setProperty('--px', ((x / r.width) * 2 - 1).toFixed(3));
      escena.style.setProperty('--py', ((y / r.height) * 2 - 1).toFixed(3));
    };
    const mover = (e: PointerEvent) => {
      ultimo = e;
      if (!cuadro) {
        cuadro = requestAnimationFrame(aplicar);
      }
    };
    window.addEventListener('pointermove', mover, { passive: true });
    destroyRef.onDestroy(() => {
      window.removeEventListener('pointermove', mover);
      cancelAnimationFrame(cuadro);
    });
  }
}
