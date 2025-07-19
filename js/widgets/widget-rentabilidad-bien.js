// js/widgets/widget-rentabilidad-bien.js
import { db } from '../db.js';
import { formatCurrency, formatPercent } from '../core.js';

// Widget: rentabilidad bruta, neta y total de un bien
export async function render(container, privacy = false, bienId = null) {
  if (!bienId) {
    container.innerHTML = `<div class="card">Selecciona un bien para calcular la rentabilidad.</div>`;
    return;
  }
  const bien = await db.bienes.get(bienId);
  if (!bien) {
    container.innerHTML = `<div class="card">Bien no encontrado.</div>`;
    return;
  }
  const gastos = await db.gastos.where("bienId").equals(bienId).toArray();
  const ingresos = await db.ingresos.where("bienId").equals(bienId).toArray();
  const prestamos = await db.prestamos.where("bienId").equals(bienId).toArray();

  const ingresoTotal = ingresos.reduce((s, i) => s + (+i.importe || 0), 0);
  const gastoTotal = gastos.reduce((s, g) => s + (+g.importe || 0), 0);
  const interesesPagados = prestamos.reduce((s, p) => s + (+p.interesesPagados || 0), 0);
  const valorCompra = +bien.valorCompra || 1;
  const valorActual = +bien.valorActual || valorCompra;
  const plusvalia = valorActual - valorCompra;

  const rentBruta = ingresoTotal / valorCompra * 100;
  const rentNeta = (ingresoTotal - gastoTotal - interesesPagados) / valorCompra * 100;
  const rentTotal = (ingresoTotal - gastoTotal - interesesPagados + plusvalia) / valorCompra * 100;

  container.innerHTML = `
    <div class="widget-rentabilidad-bien card">
      <h2>Rentabilidad del bien</h2>
      <div><b>Bien:</b> ${bien.descripcion || bien.tipo}</div>
      <div><b>Rentabilidad bruta:</b> ${privacy ? "•••" : formatPercent(rentBruta, 2)}</div>
      <div><b>Rentabilidad neta:</b> ${privacy ? "•••" : formatPercent(rentNeta, 2)}</div>
      <div><b>Rentabilidad total (con plusvalía):</b> ${privacy ? "•••" : formatPercent(rentTotal, 2)}</div>
      <div class="mini-explica">
        <b>Bruta</b> = ingresos / valor compra<br>
        <b>Neta</b> = (ingresos - gastos - intereses) / valor compra<br>
        <b>Total</b> = (ingresos - gastos - intereses + plusvalía) / valor compra<br>
        <b>Plusvalía</b> = valor actual - valor compra
      </div>
    </div>
  `;
}
