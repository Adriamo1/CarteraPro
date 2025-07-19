// js/widgets/widget-gastos.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Widget: KPIs y tabla de gastos (globales o por bien/categoría/periodo)
export async function render(container, privacy = false, { bienId = null, categoria = null, desde = null, hasta = null } = {}) {
  let gastos = await db.gastos.toArray();
  if (bienId) gastos = gastos.filter(g => g.bienId === bienId);
  if (categoria) gastos = gastos.filter(g => g.categoria === categoria);
  if (desde) gastos = gastos.filter(g => new Date(g.fecha) >= new Date(desde));
  if (hasta) gastos = gastos.filter(g => new Date(g.fecha) <= new Date(hasta));

  const gastoTotal = gastos.reduce((s, g) => s + (+g.importe || 0), 0);
  const gastoMedio = gastos.length ? gastoTotal / gastos.length : 0;
  const gastoMayor = gastos.length ? Math.max(...gastos.map(g => +g.importe || 0)) : 0;

  let html = `<h2>Gastos ${bienId ? "del bien" : "globales"}</h2>
    <div class="gastos-kpis">
      <span><b>Total:</b> ${privacy ? "•••" : formatCurrency(gastoTotal)}</span>
      <span><b>Media:</b> ${privacy ? "•••" : formatCurrency(gastoMedio)}</span>
      <span><b>Máximo:</b> ${privacy ? "•••" : formatCurrency(gastoMayor)}</span>
      <span><b>Nº gastos:</b> ${gastos.length}</span>
    </div>
    <table class="tabla-gastos">
      <thead>
        <tr><th>Fecha</th><th>Importe</th><th>Tipo</th><th>Categoría</th>
        <th>Descripción</th><th>Cuenta</th><th>Bien</th></tr>
      </thead>
      <tbody>
        ${gastos.slice(-20).reverse().map(g => `
          <tr>
            <td>${formatDate(g.fecha)}</td>
            <td>${privacy ? "•••" : formatCurrency(g.importe)}</td>
            <td>${g.tipo||"-"}</td>
            <td>${g.categoria||"-"}</td>
            <td>${g.descripcion||"-"}</td>
            <td>${g.cuentaId||"-"}</td>
            <td>${g.bienId||"-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="mini-explica">Últimos 20 gastos. Usa filtros para análisis avanzado.</div>`;
  container.innerHTML = `<div class="widget-gastos card">${html}</div>`;
}
