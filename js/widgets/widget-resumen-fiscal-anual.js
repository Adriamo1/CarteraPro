// js/widgets/widget-resumen-fiscal-anual.js
import { informeFiscal } from '../fiscalidad.js';
import { formatCurrency } from '../core.js';

// Widget: KPIs fiscales del año (plusvalías, minusvalías, dividendos, retenciones)
export async function render(container, privacy = false, year = (new Date()).getFullYear()) {
  const resumen = await informeFiscal({ year });
  if (!resumen) {
    container.innerHTML = `<div class="card">No hay datos fiscales para ${year}.</div>`;
    return;
  }
  container.innerHTML = `
    <div class="widget-resumen-fiscal card">
      <h2>Resumen fiscal ${year}</h2>
      <table class="tabla-fiscal-anual">
        <tr><th>Plusvalías</th><td>${privacy ? "•••" : formatCurrency(resumen.plusvalias.plusvalias)}</td></tr>
        <tr><th>Minusvalías</th><td>${privacy ? "•••" : formatCurrency(resumen.plusvalias.minusvalias)}</td></tr>
        <tr><th>Dividendos brutos</th><td>${privacy ? "•••" : formatCurrency(resumen.dividendos.bruto)}</td></tr>
        <tr><th>Retención local</th><td>${privacy ? "•••" : formatCurrency(resumen.dividendos.retLocal)}</td></tr>
        <tr><th>Retención extranjera</th><td>${privacy ? "•••" : formatCurrency(resumen.dividendos.retExtranj)}</td></tr>
        <tr><th>Dividendos netos</th><td>${privacy ? "•••" : formatCurrency(resumen.dividendos.neto)}</td></tr>
        <tr><th>Minusvalías pendientes</th><td>${privacy ? "•••" : formatCurrency(resumen.minusvaliasPend)}</td></tr>
      </table>
      <div class="mini-explica">KPIs para tu declaración de IRPF.</div>
    </div>
  `;
}
