import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { mensajeError } from '../../../core/interceptors/auth.interceptor';
import { Rentabilidad } from '../../../core/models/api.models';
import { PredioService } from '../../../core/services/predio.service';
import { Aviso } from '../../../shared/components/aviso';
import { Cargando } from '../../../shared/components/cargando';
import { Icono } from '../../../shared/components/icono';
import { TApiPipe, TPipe } from '../../../shared/pipes/t.pipe';

/**
 * Rentabilidad referencial del cultivo en la región del predio (US22, T102): ingreso, costo y margen por
 * hectárea con su fuente y periodo. Si no hay datos, se indica sin mostrar cifras.
 */
@Component({
  selector: 'app-tarjeta-rentabilidad',
  imports: [CurrencyPipe, DecimalPipe, Aviso, Cargando, Icono, TPipe, TApiPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rentabilidad">
      <p class="titulo"><app-icono nombre="moneda" [tamano]="18" /> {{ 'Rentabilidad referencial por hectárea' | t }}</p>
      @if (error()) {
        <app-aviso tipo="advertencia">{{ error() }}</app-aviso>
      } @else if (!datos()) {
        <app-cargando [texto]="'Consultando datos económicos…' | t" [lineas]="2" />
      } @else if (!datos()!.disponible) {
        <app-aviso tipo="info">{{ datos()!.mensaje | tApi }}</app-aviso>
      } @else {
        @if (datos(); as d) {
          <div class="cifras">
            <div class="cifra"><span class="dato-etiqueta">{{ 'Ingreso' | t }}</span>
              <span class="dato-valor">{{ d.ingresoHa | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span></div>
            <span class="operador" aria-hidden="true">−</span>
            <div class="cifra"><span class="dato-etiqueta">{{ 'Costo' | t }}</span>
              <span class="dato-valor">{{ d.costoHa | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span></div>
            <span class="operador" aria-hidden="true">=</span>
            <div class="cifra margen" [class.negativo]="(d.margenHa ?? 0) < 0"><span class="dato-etiqueta">{{ 'Margen' | t }}</span>
              <span class="dato-valor">{{ d.margenHa | currency: 'PEN' : 'symbol-narrow' : '1.0-0' }}</span></div>
          </div>
          <p class="nota">
            {{ 'Precio en chacra' | t }} {{ d.precioChacraKg | currency: 'PEN' : 'symbol-narrow' : '1.2-2' }}/kg ·
            {{ 'rendimiento' | t }} {{ d.rendimientoKgHa | number: '1.0-0' }} kg/ha · {{ d.region }} · {{ 'periodo' | t }} {{ d.periodo }}<br>
            {{ 'Fuente' | t }}: {{ d.fuente }}. {{ d.aviso | tApi }}
          </p>
        }
      }
    </div>
  `,
  styles: `
    .rentabilidad { border-top: 1px solid var(--color-borde); padding-top: 14px; margin-top: 16px; }
    .titulo { display: flex; align-items: center; gap: 6px; font-weight: 700; margin-bottom: 10px; color: var(--color-acento); }
    .cifras { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; }
    .cifra { display: grid; padding: 10px 14px; border-radius: 10px; background: var(--color-superficie-2); border: 1px solid var(--color-borde); }
    .margen { background: var(--nivel-bajo-fondo); color: var(--nivel-bajo-texto); border-color: transparent; }
    .margen.negativo { background: var(--nivel-muy-alto-fondo); color: var(--nivel-muy-alto-texto); }
    .margen .dato-etiqueta { color: inherit; }
    .operador { font-size: 1.4rem; font-weight: 700; color: var(--color-texto-suave); }
    .nota { font-size: 0.8rem; color: var(--color-texto-suave); margin: 10px 0 0; }
  `,
})
export class TarjetaRentabilidad implements OnInit {
  private readonly predios = inject(PredioService);
  readonly predioId = input.required<number>();
  readonly cultivoId = input.required<number>();

  protected readonly datos = signal<Rentabilidad | null>(null);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.predios.rentabilidad(this.predioId(), this.cultivoId()).subscribe({
      next: (r) => this.datos.set(r),
      error: (e) => this.error.set(mensajeError(e)),
    });
  }
}
