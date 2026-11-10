import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { t } from './idioma';

/** Traduce el título de la pestaña del navegador (definido en las rutas) al idioma elegido. */
@Injectable({ providedIn: 'root' })
export class TituloTraducido extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(estado: RouterStateSnapshot): void {
    const titulo = this.buildTitle(estado);
    this.title.setTitle(titulo ? t(titulo) : 'AgroCrew');
  }
}
