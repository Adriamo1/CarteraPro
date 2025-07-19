// js/widgets/valor-total.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Widget: KPI de patrimonio total (activos + bienes + cuentas - deudas)
export async function render(container, privacy = false) {
  let valorTotal = 0;
  const activos = await db.activos.toArray();
  valorTotal += activos.reduce((s, a) => s + (+a.valorActual || 0), 0);
  const cuentas = await db.cuentas.toArray();
  valorTotal += cuentas.reduce((s, c) => s + (+c.saldo || 0), 0);
  const bienes = await db.bienes.toArray();
  valorTotal += bienes.reduce((s, b) => s + (+b.valorActual || 0), 0);
  const prestamos = await db.prestamos.toArray();
  valorTotal -= prestamos.reduce((s, p) => s + (+p.saldoPendiente || 0), 0);

  container.innerHTML = `
    <div class="kpi-valor-total card">
      <h2>Valor total de la cartera</h2>
      <div class="kpi">${privacy ? "•••" : formatCurrency(valorTotal)}</div>
      <div class="kpi-ayuda"><span class="mini-explica">Activos, bienes y cuentas menos deudas.</span></div>
    </div>`;
}
