// js/widgets/benchmarking.js
import { db } from '../db.js';
import { formatPercent } from '../core.js';

// Benchmarks de referencia. Puedes ampliar o actualizar valores.
const BENCHMARKS = [
  { nombre: "MSCI World", rentabilidad: 8.2 },
  { nombre: "S&P 500", rentabilidad: 10.1 },
  { nombre: "IBEX 35", rentabilidad: 5.2 }
];

// Widget: Benchmarking — comparación con índices de referencia
export async function render(container, privacy = false, { year = (new Date()).getFullYear() } = {}) {
  // Calcula la rentabilidad anual de la cartera (usa histórico)
  const his = await db.historico
    .orderBy('fecha')
    .filter(h => new Date(h.fecha).getFullYear() === year)
    .toArray();
  if (his.length < 2) {
    container.innerHTML = `<div class="card">No hay histórico suficiente para ${year}.</div>`;
    return;
  }
  const inicial = his[0].valorTotal || 0;
  const final = his[his.length - 1].valorTotal || 0;
  const rentabilidadCartera = inicial ? ((final - inicial) / inicial) * 100 : 0;

  // Tabla comparativa con benchmarks
  let html = `<h2>Benchmarking ${year}</h2>
    <table class="tabla-benchmarking">
      <thead>
        <tr><th>Índice</th><th>Rentabilidad</th><th>Diferencia vs cartera</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><b>Mi cartera</b></td>
          <td>${privacy ? "•••" : formatPercent(rentabilidadCartera,2)}</td>
          <td>-</td>
        </tr>
        ${BENCHMARKS.map(b => `
          <tr>
            <td>${b.nombre}</td>
            <td>${privacy ? "•••" : formatPercent(b.rentabilidad,2)}</td>
            <td>${privacy ? "•••" : formatPercent(rentabilidadCartera - b.rentabilidad,2)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="mini-explica">
      ¿Tu cartera bate a los principales índices? Revisa tu estrategia si llevas años por debajo.
    </div>
  `;
  container.innerHTML = `<div class="widget-benchmarking card">${html}</div>`;
}
