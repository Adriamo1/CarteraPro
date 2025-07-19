// js/widgets/loan-summary.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Widget: Tabla de resumen de préstamos/hipotecas
export async function render(container, privacy = false, { bienId = null } = {}) {
  let prestamos = bienId
    ? await db.prestamos.where("bienId").equals(bienId).toArray()
    : await db.prestamos.toArray();

  if (!prestamos.length) {
    container.innerHTML = `<div class="widget-loan-summary card"><h2>Préstamos / Hipotecas</h2><div>No hay préstamos registrados.</div></div>`;
    return;
  }

  let html = `<h2>Préstamos / Hipotecas</h2>
    <table class="tabla-prestamos"><thead>
      <tr><th>Bien</th><th>Tipo</th><th>Importe inicial</th><th>Saldo pendiente</th>
      <th>Interés</th><th>Plazo</th><th>Cuota</th><th>Pagado</th><th>Notas</th></tr>
    </thead><tbody>`;

  for (const p of prestamos) {
    const pagado = (+p.principal || 0) - (+p.saldoPendiente || 0);
    let bien = null;
    if (p.bienId) bien = await db.bienes.get(p.bienId);
    html += `<tr>
      <td>${bien ? (bien.descripcion || bien.tipo) : "-"}</td>
      <td>${p.tipo || "-"}</td>
      <td>${privacy ? "•••" : formatCurrency(p.principal)}</td>
      <td>${privacy ? "•••" : formatCurrency(p.saldoPendiente)}</td>
      <td>${p.tae || p.tin || "-"}</td>
      <td>${p.plazoMeses || "-"} meses</td>
      <td>${privacy ? "•••" : formatCurrency(p.cuota)}</td>
      <td>${privacy ? "•••" : formatCurrency(pagado)}</td>
      <td>${p.notas || ""}</td>
    </tr>`;
  }
  html += `</tbody></table>`;
  html += `<div class="kpi-ayuda" style="margin-top:10px;"><span class="mini-explica">Haz click en cada préstamo para simular amortizaciones o ver calendario de pagos.</span></div>`;
  container.innerHTML = `<div class="widget-loan-summary card">${html}</div>`;
}
