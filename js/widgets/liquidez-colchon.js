// js/widgets/liquidez-colchon.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Muestra saldo en cuentas líquidas y compara con gastos medios para sugerir colchón de emergencia
export async function render(container, privacy = false, { mesesObjetivo = 6 } = {}) {
  const cuentas = await db.cuentas.toArray();
  // Liquidez: suma cuentas no remuneradas
  const liquidez = cuentas
    .filter(c => (c.tipo || "") !== "remunerada")
    .reduce((s, c) => s + (+c.saldo || 0), 0);

  const gastos = await db.gastos.toArray();
  const gastoMedioMes = gastos.length
    ? gastos.reduce((s, g) => s + (+g.importe || 0), 0) / 12
    : 0;

  const objetivo = gastoMedioMes * mesesObjetivo;

  let html = `<h2>Colchón de emergencia</h2>
    <div><b>Liquidez actual:</b> ${privacy ? "•••" : formatCurrency(liquidez)}</div>
    <div><b>Gasto medio mensual:</b> ${privacy ? "•••" : formatCurrency(gastoMedioMes)}</div>
    <div><b>Objetivo (${mesesObjetivo} meses):</b> ${privacy ? "•••" : formatCurrency(objetivo)}</div>
    <div class="mini-explica">
      Se recomienda mantener entre 6 y 12 meses de gastos fijos en cuentas líquidas.
      <br>${liquidez >= objetivo ? "<span style='color:green;'>✔️ Cumples el objetivo.</span>" : "<span style='color:orange;'>⚠️ Estás por debajo del colchón ideal.</span>"}
    </div>
  `;
  container.innerHTML = `<div class="widget-liquidez-colchon card">${html}</div>`;
}
