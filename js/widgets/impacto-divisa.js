// js/widgets/impacto-divisa.js
import { db } from '../db.js';
import { formatPercent } from '../core.js';

// Widget: Impacto de los cambios de divisa en tu rentabilidad
export async function render(container, privacy = false) {
  const activos = await db.activos.toArray();
  let impactoTotal = 0;
  let html = `<h2>Impacto de divisa</h2>`;
  const activosDivisa = activos.filter(a => a.moneda && a.moneda !== "EUR");

  if (activosDivisa.length === 0) {
    html += `<div>No hay activos afectados por divisa.</div>`;
    container.innerHTML = `<div class="widget-impacto-divisa card">${html}</div>`;
    return;
  }

  html += `<table class="tabla-impacto-divisa"><thead>
      <tr><th>Activo</th><th>Divisa</th><th>Rent. sin divisa</th><th>Rent. real (€)</th><th>Impacto divisa</th></tr>
    </thead><tbody>`;

  for (const act of activosDivisa) {
    const trans = await db.transacciones.where("activoId").equals(act.id).toArray();
    const compras = trans.filter(t => t.tipo === "compra");
    const cantidadComprada = compras.reduce((s, t) => s + (+t.cantidad || 0), 0);
    const precioMedioCompra = compras.length ? compras.reduce((s, t) => s + (+t.precio || 0), 0) / compras.length : 0;
    const tipoCambioCompra = compras.length ? compras.reduce((s, t) => s + (+t.cambio || 1), 0) / compras.length : 1;
    const valorActual = +act.valorActual || 0;
    const rentabilidadSinDivisa = (valorActual - (precioMedioCompra * cantidadComprada)) / (precioMedioCompra * cantidadComprada || 1) * 100;
    const cambioActual = act.cambioActual || 1;
    const valorActualEUR = valorActual * cambioActual;
    const compraEUR = precioMedioCompra * cantidadComprada * tipoCambioCompra;
    const rentabilidadReal = (valorActualEUR - compraEUR) / (compraEUR || 1) * 100;
    const impactoDivisa = rentabilidadReal - rentabilidadSinDivisa;
    impactoTotal += impactoDivisa;

    html += `<tr>
      <td>${act.nombre} (${act.ticker})</td>
      <td>${act.moneda}</td>
      <td>${privacy ? "•••" : formatPercent(rentabilidadSinDivisa)}</td>
      <td>${privacy ? "•••" : formatPercent(rentabilidadReal)}</td>
      <td>${privacy ? "•••" : formatPercent(impactoDivisa, 2)}</td>
    </tr>`;
  }

  html += `</tbody></table>
    <div class="kpi-ayuda" style="margin-top:12px;">
      <b>Impacto total de divisa:</b> ${privacy ? "•••" : formatPercent(impactoTotal,2)}
      <span class="mini-explica">Diferencia entre la rentabilidad pura y la real debida solo al efecto de los tipos de cambio.</span>
    </div>`;

  container.innerHTML = `<div class="widget-impacto-divisa card">${html}</div>`;
}
