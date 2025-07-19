// js/widgets/simulador-retirada.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Widget: simulador rápido de retirada segura mensual según regla 4%
export async function render(container, privacy = false, { años = 20, rentabilidad = 4 } = {}) {
  let total = 0;
  const activos = await db.activos.toArray();
  total += activos.reduce((s, a) => s + (+a.valorActual || 0), 0);
  const cuentas = await db.cuentas.toArray();
  total += cuentas.reduce((s, c) => s + (+c.saldo || 0), 0);

  const retiradaAnual = total * rentabilidad / 100;
  const retiradaMensual = retiradaAnual / 12;

  let html = `<h2>Simulador de retirada</h2>
    <div><b>Capital inicial:</b> ${privacy ? "•••" : formatCurrency(total)}</div>
    <div><b>Retirada mensual “segura” (regla 4%):</b> ${privacy ? "•••" : formatCurrency(retiradaMensual)}</div>
    <div><b>Años de sostenibilidad estimados:</b> ${años} años</div>
    <div class="mini-explica">Calcula cuánto podrías retirar mensualmente sin agotar el capital, según la regla del 4% y tu saldo actual.</div>
  `;
  container.innerHTML = `<div class="widget-simulador-retirada card">${html}</div>`;
}
