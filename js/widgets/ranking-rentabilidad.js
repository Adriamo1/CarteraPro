// js/widgets/ranking-rentabilidad.js
import { db } from '../db.js';
import { formatPercent } from '../core.js';

// Widget: Ranking de rentabilidad por activo
export async function render(container, privacy = false, { topN = 5 } = {}) {
  const activos = await db.activos.toArray();

  // Filtra y calcula rentabilidad aproximada para activos con datos
  const ranking = activos
    .filter(a => +a.valorActual > 0 && +a.precioCompra > 0)
    .map(a => ({
      ...a,
      rent: ((a.valorActual - a.precioCompra) / a.precioCompra) * 100
    }))
    .sort((a, b) => b.rent - a.rent)
    .slice(0, topN);

  let html = `<h2>Ranking de rentabilidad</h2>
    <table class="tabla-ranking-rentabilidad">
      <thead>
        <tr><th>Activo</th><th>Ticker</th><th>Rentabilidad</th></tr>
      </thead>
      <tbody>
        ${ranking.map(a =>
          `<tr>
            <td>${a.nombre}</td>
            <td>${a.ticker}</td>
            <td>${privacy ? "•••" : formatPercent(a.rent, 2)}</td>
          </tr>`
        ).join("")}
      </tbody>
    </table>
    <div class="mini-explica">Top ${topN} activos por rentabilidad acumulada.</div>
  `;

  container.innerHTML = `<div class="widget-ranking-rentabilidad card">${html}</div>`;
}
