import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TPipe } from '../shared/pipes/t.pipe';

/** Política de privacidad y términos de uso (Ley N.° 29733 de Protección de Datos Personales). */
@Component({
  selector: 'app-privacidad',
  imports: [TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="contenedor pagina angosto legal">
      <h1>{{ 'Política de privacidad' | t }}</h1>
      <p class="texto-suave">{{ 'Última actualización: noviembre de 2026' | t }}</p>

      <h2>{{ 'Qué datos recopilamos' | t }}</h2>
      <p>{{ 'Tu nombre, correo, DNI o RUC y el tipo de cuenta; y de tus predios, la ubicación, el área, la fuente de agua y el código catastral si lo indicas.' | t }}</p>

      <h2>{{ 'Para qué los usamos' | t }}</h2>
      <p>{{ 'Solo para evaluar la compatibilidad de cultivos con tu terreno, enviarte alertas de riesgo y elaborar indicadores agregados por zona, sin identificar a nadie.' | t }}</p>

      <h2>{{ 'Con quién los compartimos' | t }}</h2>
      <p>{{ 'No vendemos ni cedemos tus datos. Para consultar suelo, clima y riesgo solo enviamos coordenadas a servicios públicos (MIDAGRI, ANA y Open-Meteo).' | t }}</p>

      <h2>{{ 'Tus derechos' | t }}</h2>
      <p>{{ 'Conforme a la Ley N.° 29733, puedes acceder, rectificar o eliminar tus datos desde tu perfil o escribiéndonos al correo de contacto.' | t }}</p>

      <h2 id="terminos">{{ 'Términos de uso' | t }}</h2>
      <p>{{ 'Las recomendaciones de AgroCrew son referenciales: no reemplazan la evaluación de un ingeniero agrónomo ni garantizan el rendimiento de la cosecha.' | t }}</p>
      <p>{{ 'AgroCrew es un proyecto académico de la UPC. Al usar la plataforma aceptas que la información se usa con fines educativos y de orientación.' | t }}</p>
    </article>
  `,
  styles: `
    .legal h2 { font-size: 1.25rem; margin-top: 28px; scroll-margin-top: 90px; }
    .legal p { max-width: 68ch; }
  `,
})
export class Privacidad {}
