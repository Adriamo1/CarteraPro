// js/widgets/widget-ingresos.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Widget: KPIs y tabla de ingresos (globales o por bien/activo/tipo/periodo)
export async function render(container, privacy = false, { bienId = null, activoId = null, tipo = null, desde = null, hasta = null } = {}) {
  let ingresos = await db.ingresos.toArray();
  if (bienId) ingresos = ingresos.filter(i => i.bienId === bienId);
  if (activoId) ingresos = ingresos.filter(i => i.activoId === activoId);
  if (tipo) ingresos = ingresos.filter(i => i.tipo === tipo);
  if (desde) ingresos = ingresos.filter(i => new Date(i.fecha) >= new Date(desde));
  if (hasta) ingresos = ingresos.filter(i => new Date(i.fecha) <= new Date(hasta));

  const ingresoTotal = ingresos.reduce((s, i) => s + (+i.importe || 0), 0);
  const ingresoMedio = ingresos.length ? ingresoTotal / ingresos.length : 0;
  const ingresoMayor = ingresos.length ? Math.max(...ingresos.map(i => +i.importe || 0)) : 0;

  let html = `<h2>Ingresos ${bienId ? "del bien" : activoId ? "del activo" : "globales"}</h2>
    <div class="ingresos-kpis">
      <span><b>Total:</b> ${privacy ? "•••" : formatCurrency(ingresoTotal)}</span>
      <span><b>Media:</b> ${privacy ? "•••" : formatCurrency(ingresoMedio)}</span>
      <span><b>Máximo:</b> ${privacy ? "•••" : formatCurrency(ingresoMayor)}</span>
      <span><b>Nº ingresos:</b> ${ingresos.length}</span>
    </div>
    <table class="tabla-ingresos">
      <thead>
        <tr>
          <th>Fecha</th><th>Importe</th><th>Tipo</th><th>Origen</th>
          <th>Cuenta</th><th>Bien</th><th>Activo</th>
        </tr>
      </thead>
      <tbody>
        ${ingresos.slice(-20).reverse().map(i => `
          <tr>
            <td>${formatDate(i.fecha)}</td>
            <td>${privacy ? "•••" : formatCurrency(i.importe)}</td>
            <td>${i.tipo||"-"}</td>
            <td>${i.origen||"-"}</td>
            <td>${i.cuentaId||"-"}</td>
            <td>${i.bienId||"-"}</td>
            <td>${i.activoId||"-"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="mini-explica">Mostrando los últimos 20 ingresos. Usa los filtros para análisis avanzado.</div>
  `;

  container.innerHTML = `<div class="widget-ingresos card">${html}</div>`;
}
