/**
 * Genera y descarga un archivo CSV en el navegador (T109). Usa ";" como separador y BOM UTF-8
 * para que Excel en español lo abra con tildes y columnas correctas.
 */
export function descargarCsv(nombreArchivo: string, filas: (string | number | null | undefined)[][]): void {
  const contenido = filas
    .map((fila) => fila.map((celda) => escapar(celda)).join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

function escapar(celda: string | number | null | undefined): string {
  if (celda === null || celda === undefined) {
    return '';
  }
  const texto = typeof celda === 'number' ? String(celda).replace('.', ',') : celda;
  return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
