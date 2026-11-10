import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { animate } from 'motion';
import { LOCALE } from '../../core/i18n/idioma';

/**
 * Número que "cuenta" desde 0 hasta su valor al aparecer (con Motion).
 *   <span [appContador]="ind.prediosActivos"></span>
 *   <span [appContador]="porcentaje" [decimales]="1" sufijo=" %"></span>
 * Si el sistema pide reducir el movimiento, muestra el valor final de inmediato.
 */
@Directive({ selector: '[appContador]' })
export class Contador {
  readonly appContador = input.required<number | null | undefined>();
  readonly decimales = input(0);
  readonly sufijo = input('');
  readonly prefijo = input('');

  private readonly elemento = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;
  private detener?: () => void;
  private anterior = 0;

  constructor() {
    effect(() => {
      const destino = Number(this.appContador() ?? 0);
      const formato = new Intl.NumberFormat(LOCALE, {
        minimumFractionDigits: this.decimales(), maximumFractionDigits: this.decimales(),
      });
      const escribir = (v: number) => (this.elemento.textContent = `${this.prefijo()}${formato.format(v)}${this.sufijo()}`);
      this.detener?.();
      if (matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        escribir(destino);
        return;
      }
      const control = animate(this.anterior, destino, {
        duration: 1.1,
        ease: [0.23, 1, 0.32, 1],
        onUpdate: (v: number) => escribir(v),
      });
      this.anterior = destino;
      this.detener = () => control.stop();
    });
    inject(DestroyRef).onDestroy(() => this.detener?.());
  }
}
