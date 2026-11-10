import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject, signal, viewChild,
} from '@angular/core';
import { TPipe } from '../../../shared/pipes/t.pipe';

/** Una frase del panel y la figura que forman las partículas (trazo SVG en una caja de 100 × 100). */
interface Diapositiva { etiqueta: string; frase: string; figura: string; hueco?: boolean }

const DIAPOSITIVAS: Diapositiva[] = [
  {
    etiqueta: 'SUELO', frase: 'Conoce qué tierra tienes.',
    // Hoja con su nervadura central.
    figura: 'M50 4C78 18 92 46 82 72C74 90 58 96 50 96C42 96 26 90 18 72C8 46 22 18 50 4Z',
  },
  {
    etiqueta: 'CLIMA', frase: 'El clima real de tu zona.',
    // Sol: círculo y ocho rayos.
    figura: 'M50 30A20 20 0 1 1 49.9 30Z M47 2h6v16h-6Z M47 82h6v16h-6Z M2 47h16v6H2Z M82 47h16v6H82Z '
      + 'M14.6 18.8l4.2-4.2 11.3 11.3-4.2 4.2Z M69.9 74.1l4.2-4.2 11.3 11.3-4.2 4.2Z '
      + 'M81.2 14.6l4.2 4.2-11.3 11.3-4.2-4.2Z M25.9 69.9l4.2 4.2-11.3 11.3-4.2-4.2Z',
  },
  {
    etiqueta: 'RIESGO HÍDRICO', frase: 'Anticípate a las lluvias.',
    // Gota de agua.
    figura: 'M50 2C50 2 18 42 18 64A32 32 0 0 0 82 64C82 42 50 2 50 2Z',
  },
  {
    etiqueta: 'RECOMENDACIÓN', frase: 'El cultivo que mejor le va.',
    // Brote: tallo con dos hojas.
    figura: 'M46 40h8v58h-8Z M50 46C46 22 26 8 4 10C6 34 24 48 50 46Z M50 36C54 14 72 2 96 4C94 28 76 40 50 36Z',
  },
  {
    etiqueta: 'DATOS OFICIALES', frase: 'Con datos de MIDAGRI, ANA y Open-Meteo.',
    // Marcador de ubicación con su centro vacío.
    figura: 'M50 2C30 2 16 17 16 36C16 62 50 98 50 98C50 98 84 62 84 36C84 17 70 2 50 2Z M50 22A14 14 0 1 0 50.1 22Z', hueco: true,
  },
];

const DURACION_MS = 5000;
const COLORES = ['#CFE8D3', '#9FD3A9', '#FFFFFF', '#7FB98B', '#E3B341'];

interface Particula { x: number; y: number; vx: number; vy: number; tx: number; ty: number; fase: number; color: number }

/**
 * Panel de bienvenida del acceso: frases que se renuevan cada 5 s, con entrada desenfocada, y una nube de
 * partículas en canvas que dibuja una figura por frase y se aparta del cursor. Sin librerías: Canvas 2D,
 * señales y CSS. Con «reducir movimiento» o en celular se muestra una lista estática.
 */
@Component({
  selector: 'app-portada-acceso',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(mouseenter)': 'pausado.set(true)', '(mouseleave)': 'pausado.set(false)' },
  template: `
    <canvas #lienzo aria-hidden="true"></canvas>
    <div class="contenido">
      <p class="marca"><img src="logo.svg" alt="" width="26" height="26"> AgroCrew</p>
      <h1 class="sr-only">{{ 'Descubre qué cultivos son compatibles con tu terreno' | t }}</h1>

      <div class="texto">
        <span class="etiqueta">{{ diapositivas[actual()].etiqueta | t }}</span>
        <div class="frases" aria-live="polite">
          @for (d of diapositivas; track d.etiqueta; let i = $index) {
            <p class="frase" [class.on]="i === actual()" [class.pas]="i < actual()" [attr.aria-hidden]="i !== actual()">
              {{ d.frase | t }}
            </p>
          }
        </div>
        <div class="segmentos" role="group" [attr.aria-label]="'Mensajes' | t">
          @for (d of diapositivas; track d.etiqueta; let i = $index) {
            <button type="button" [class.on]="i === actual()" [attr.aria-label]="d.etiqueta | t"
                    [attr.aria-current]="i === actual()" (click)="ir(i)">
              <span [class.llenando]="i === actual() && !pausado()" [style.animation-duration.ms]="duracion"></span>
            </button>
          }
        </div>
      </div>

      <p class="pie-portada">{{ 'Datos oficiales de suelo, clima y riesgo, explicados en lenguaje sencillo.' | t }}</p>
    </div>
  `,
  styles: `
    :host {
      position: relative; display: block; overflow: hidden; isolation: isolate;
      min-height: 600px; border-radius: 16px; color: #FFFFFF;
      background: radial-gradient(120% 90% at 70% 30%, #1E3A27 0%, #12201A 60%, #0C1610 100%);
    }
    canvas { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
    .contenido { height: 100%; min-height: inherit; display: flex; flex-direction: column; padding: 32px; pointer-events: none; }
    .contenido button { pointer-events: auto; }
    .marca { display: inline-flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; font-size: 1.05rem; }
    .texto { margin-top: auto; }
    .etiqueta {
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; color: #9FD3A9;
    }
    .etiqueta::before { content: ''; width: 22px; height: 2px; background: currentColor; }

    .frases { position: relative; height: 7.2rem; margin-top: 14px; }
    .frase {
      position: absolute; inset: 0; margin: 0;
      font-size: clamp(1.9rem, 3.3vw, 2.75rem); font-weight: 800; line-height: 1.08; letter-spacing: -0.035em;
      opacity: 0; filter: blur(12px); transform: translateY(34px);
      transition: opacity 0.6s, filter 0.6s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .frase.on { opacity: 1; filter: none; transform: none; }
    .frase.pas { transform: translateY(-34px); }

    .segmentos { display: flex; gap: 7px; margin-top: 18px; }
    .segmentos button {
      width: 34px; height: 14px; padding: 0; border: none; background: none; cursor: pointer;
      display: grid; align-items: center;
    }
    .segmentos button span {
      display: block; height: 3px; border-radius: 2px; background: rgba(255, 255, 255, 0.18);
      background-image: linear-gradient(#9FD3A9, #9FD3A9); background-repeat: no-repeat; background-size: 0 100%;
    }
    .segmentos button.on span { background-size: 100% 100%; }
    .segmentos button.on span.llenando { animation: llenar linear both; }
    .segmentos button:focus-visible { outline: 2px solid #9FD3A9; outline-offset: 2px; border-radius: 2px; }
    @keyframes llenar { from { background-size: 0 100%; } to { background-size: 100% 100%; } }

    .pie-portada { margin: 22px 0 0; font-size: 0.9rem; color: rgba(255, 255, 255, 0.6); max-width: 34ch; }

    /* Celular o «reducir movimiento»: sin partículas ni rotación; las frases como lista. */
    @media (max-width: 768px), (prefers-reduced-motion: reduce) {
      :host { min-height: 0; }
      canvas, .segmentos, .etiqueta { display: none; }
      .contenido { padding: 24px 20px; }
      .texto { margin-top: 16px; }
      .frases { height: auto; display: grid; gap: 6px; margin: 0; }
      .frase { position: static; opacity: 1; filter: none; transform: none; font-size: 1.15rem; letter-spacing: -0.01em; }
      .pie-portada { margin-top: 14px; }
    }
  `,
})
export class PortadaAcceso {
  protected readonly diapositivas = DIAPOSITIVAS;
  protected readonly duracion = DURACION_MS;
  protected readonly actual = signal(0);
  protected readonly pausado = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');

  private particulas: Particula[] = [];
  private figuras: Array<Array<[number, number]>> = [];
  private ancho = 0;
  private alto = 0;
  private puntero = { x: -9999, y: -9999 };
  /** Centro de la figura y cuánto se inclina hacia el cursor (aunque esté fuera del panel). */
  private centro = { x: 0, y: 0 };
  private mirada = { x: 0, y: 0 };
  private transcurrido = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const estatico = matchMedia('(max-width: 768px), (prefers-reduced-motion: reduce)').matches;
      if (estatico) {
        return;
      }
      const limpiar = this.iniciar();
      destroyRef.onDestroy(limpiar);
    });
  }

  protected ir(i: number): void {
    this.actual.set(i);
    this.transcurrido = 0;
    this.asignarFigura(i);
  }

  /** Arranca el canvas, el bucle de animación y el temporizador; devuelve cómo detenerlos. */
  private iniciar(): () => void {
    const canvas = this.lienzo().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return () => {};
    }
    this.figuras = DIAPOSITIVAS.map((d) => muestrearFigura(d.figura, d.hueco));

    const redimensionar = () => {
      const r = this.host.nativeElement.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      this.ancho = r.width;
      this.alto = r.height;
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!this.particulas.length) {
        this.crearParticulas();
      }
      this.asignarFigura(this.actual(), false);
    };
    const observador = new ResizeObserver(redimensionar);
    observador.observe(this.host.nativeElement);

    const mover = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      this.puntero = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const salir = () => (this.puntero = { x: -9999, y: -9999 });
    // El cursor se sigue en toda la ventana: la figura mira hacia él aunque esté sobre el formulario.
    window.addEventListener('pointermove', mover, { passive: true });
    document.addEventListener('pointerleave', salir);

    let anterior = performance.now();
    let cuadro = 0;
    const bucle = (ahora: number) => {
      const dt = Math.min(ahora - anterior, 50);
      anterior = ahora;
      if (!this.pausado() && !document.hidden) {
        this.transcurrido += dt;
        if (this.transcurrido >= DURACION_MS) {
          this.ir((this.actual() + 1) % DIAPOSITIVAS.length);
        }
      }
      this.paso(ahora);
      this.dibujar(ctx);
      cuadro = requestAnimationFrame(bucle);
    };
    cuadro = requestAnimationFrame(bucle);

    return () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      window.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerleave', salir);
    };
  }

  private crearParticulas(): void {
    const n = Math.round(Math.min(1800, Math.max(700, (this.ancho * this.alto) / 190)));
    this.particulas = Array.from({ length: n }, () => {
      const x = Math.random() * this.ancho;
      const y = Math.random() * this.alto;
      const r = Math.random();
      return {
        x, y, vx: 0, vy: 0, tx: x, ty: y, fase: Math.random() * Math.PI * 2,
        color: r < 0.04 ? 4 : r < 0.35 ? 0 : r < 0.6 ? 1 : r < 0.8 ? 2 : 3,
      };
    });
  }

  /** Reparte las partículas sobre la figura i (zona superior del panel), con un pequeño impulso al cambiar. */
  private asignarFigura(i: number, impulso = true): void {
    const puntos = this.figuras[i];
    if (!puntos?.length || !this.particulas.length) {
      return;
    }
    // La figura ocupa el espacio libre entre la marca y el bloque de texto.
    const texto = this.host.nativeElement.querySelector<HTMLElement>('.texto');
    const arriba = 70;
    const abajo = (texto?.offsetTop ?? this.alto * 0.6) - 24;
    const lado = Math.max(120, Math.min(this.ancho * 0.6, abajo - arriba));
    const cx = this.ancho * 0.62;
    const cy = arriba + (abajo - arriba) / 2;
    this.centro = { x: cx, y: cy };
    for (const p of this.particulas) {
      const [fx, fy] = puntos[(Math.random() * puntos.length) | 0];
      p.tx = cx + (fx - 0.5) * lado;
      p.ty = cy + (fy - 0.5) * lado;
      if (impulso) {
        p.vx += (Math.random() - 0.5) * 6;
        p.vy += (Math.random() - 0.5) * 6;
      }
    }
  }

  /** Onda que sale del centro de la figura; se lanza al escribir en el formulario. */
  pulso(): void {
    const { x: cx, y: cy } = this.centro;
    for (const p of this.particulas) {
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const fuerza = 1.2 + Math.random() * 1.6;
      p.vx += (dx / d) * fuerza;
      p.vy += (dy / d) * fuerza;
    }
  }

  private paso(t: number): void {
    const { x: px, y: py } = this.puntero;
    // Inclinación suave hacia el cursor: hasta 22 px, según la distancia.
    let mx = 0;
    let my = 0;
    if (px > -9000) {
      const dx = px - this.centro.x;
      const dy = py - this.centro.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const alcance = Math.min(22, d * 0.05);
      mx = (dx / d) * alcance;
      my = (dy / d) * alcance;
    }
    this.mirada.x += (mx - this.mirada.x) * 0.06;
    this.mirada.y += (my - this.mirada.y) * 0.06;
    for (const p of this.particulas) {
      const ox = Math.sin(t / 900 + p.fase) * 1.2;
      const oy = Math.cos(t / 1100 + p.fase) * 1.2;
      p.vx += (p.tx + ox + this.mirada.x - p.x) * 0.012;
      p.vy += (p.ty + oy + this.mirada.y - p.y) * 0.012;
      const dx = p.x - px;
      const dy = p.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < 8100) {
        const d = Math.sqrt(d2) || 1;
        const fuerza = (1 - d / 90) * 2.4;
        p.vx += (dx / d) * fuerza;
        p.vy += (dy / d) * fuerza;
      }
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  private dibujar(ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, this.ancho, this.alto);
    for (let c = 0; c < COLORES.length; c++) {
      ctx.fillStyle = COLORES[c];
      ctx.globalAlpha = c === 2 ? 0.9 : 0.75;
      for (const p of this.particulas) {
        if (p.color === c) {
          ctx.fillRect(p.x, p.y, 1.8, 1.8);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
}

/** Rellena el trazo en un canvas fuera de pantalla y devuelve los píxeles ocupados, normalizados a 0–1. */
function muestrearFigura(trazo: string, hueco = false): Array<[number, number]> {
  const tam = 160;
  const c = document.createElement('canvas');
  c.width = tam;
  c.height = tam;
  const ctx = c.getContext('2d');
  if (!ctx) {
    return [];
  }
  ctx.scale(tam / 100, tam / 100);
  ctx.fill(new Path2D(trazo), hueco ? 'evenodd' : 'nonzero');
  const datos = ctx.getImageData(0, 0, tam, tam).data;
  const puntos: Array<[number, number]> = [];
  for (let y = 0; y < tam; y += 2) {
    for (let x = 0; x < tam; x += 2) {
      if (datos[(y * tam + x) * 4 + 3] > 128) {
        puntos.push([x / tam, y / tam]);
      }
    }
  }
  return puntos;
}
