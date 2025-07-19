// js/widgets/widget-saveback.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Widget: seguimiento y control del Saveback (ahorros acumulados por gastos)
export async function render(container, privacy = false) {
  const hoy = new Date();
  const mes = hoy.getMonth();
  const año = hoy.getFullYear();

  // Busca movimientos tipo "saveback"
  const movimientos = await db.movimientos.where("tipo").equals("saveback").toArray();

  // Saveback este mes
  const esteMes = movimientos.filter(m => {
    const f = new Date(m.fecha);
    return f.getMonth() === mes && f.getFullYear() === año;
  });

  const savebackMes = esteMes.reduce((s, m) => s + (+m.importe || 0), 0);
  const savebackTotal = movimientos.reduce((s, m) => s + (+m.importe || 0), 0);

  container.innerHTML = `
    <div class="widget-saveback card">
      <h2>Seguimiento Saveback</h2>
      <div><b>Este mes:</b> ${privacy ? "•••" : formatCurrency(savebackMes)}</div>
      <div><b>Total acumulado:</b> ${privacy ? "•••" : formatCurrency(savebackTotal)}</div>
      <div class="mini-explica">El saveback es el saldo de pequeñas devoluciones o ahorros automáticos vinculados a tus gastos.</div>
    </div>
  `;
}
