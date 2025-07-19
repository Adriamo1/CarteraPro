// js/widgets/ficha-cuenta-tarjeta.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Widget: ficha visual de cuenta bancaria y tarjetas asociadas
export async function render(container, privacy = false, cuentaId = null) {
  if (!cuentaId) {
    container.innerHTML = `<div class="card">Selecciona una cuenta para ver detalles.</div>`;
    return;
  }
  const cuenta = await db.cuentas.get(cuentaId);
  if (!cuenta) {
    container.innerHTML = `<div class="card">Cuenta no encontrada.</div>`;
    return;
  }
  const tarjetas = await db.tarjetas.where("cuentaId").equals(cuentaId).toArray();

  let html = `<div class="ficha-cuenta card">
    <h2>${cuenta.alias || cuenta.banco}</h2>
    <div><b>Saldo:</b> ${privacy ? "•••" : formatCurrency(cuenta.saldo)}</div>
    <div><b>IBAN:</b> ${cuenta.iban || "-"}</div>
    <div><b>Tipo:</b> ${cuenta.tipo || "-"}</div>
    <div><b>Tarjetas asociadas:</b></div>
    <ul>
      ${tarjetas.length
        ? tarjetas.map(t => `<li>${t.tipo || "-"} •••${(t.numero || "").slice(-4)} — Límite: ${privacy ? "•••" : (t.limite || "-")}</li>`).join("")
        : "<li>Sin tarjetas asociadas</li>"}
    </ul>
  </div>`;

  container.innerHTML = html;
}
