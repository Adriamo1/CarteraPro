// js/widgets/ficha-bien-relaciones.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Widget: Ficha visual completa de un bien/inmueble con relaciones (hipotecas, seguros, gastos, ingresos, documentos)
export async function render(container, privacy = false, bienId) {
  if (!bienId) {
    container.innerHTML = `<div class="card">No se ha seleccionado ningún bien.</div>`;
    return;
  }

  const bien = await db.bienes.get(bienId);
  if (!bien) {
    container.innerHTML = `<div class="card">Bien no encontrado.</div>`;
    return;
  }

  const hipotecas = await db.prestamos.where("bienId").equals(bienId).toArray();
  const seguros = await db.seguros.where("bienId").equals(bienId).toArray();
  const gastos = await db.gastos.where("bienId").equals(bienId).toArray();
  const ingresos = await db.ingresos.where("bienId").equals(bienId).toArray();
  const docs = await db.documentos.where("[entidad+entidadId]").equals(["bien", bienId]).toArray();

  const gastoTotal = gastos.reduce((s, g) => s + (+g.importe || 0), 0);
  const ingresoTotal = ingresos.reduce((s, i) => s + (+i.importe || 0), 0);

  container.innerHTML = `
    <div class="ficha-bien-relaciones card">
      <h2>${bien.descripcion || bien.tipo} <span class="etiqueta">${bien.tipo}</span></h2>
      <div><b>Valor compra:</b> ${privacy ? "•••" : formatCurrency(bien.valorCompra)}</div>
      <div><b>Valor actual:</b> ${privacy ? "•••" : formatCurrency(bien.valorActual)}</div>
      <div><b>Dirección:</b> ${bien.direccion || "-"}</div>
      <div><b>Propietario:</b> ${bien.propietario || "-"}</div>
      <div><b>Hipoteca/s:</b> ${hipotecas.length ? hipotecas.map(h =>
        `<span class="ficha-link" onclick="window.goToPrestamo && window.goToPrestamo('${h.id}')">
          ${privacy ? "•••" : formatCurrency(h.saldoPendiente)} (${h.tae||h.tin||"-"}%)
        </span>`).join(", ") : "-"}
      </div>
      <div><b>Seguro/s:</b> ${seguros.length ? seguros.map(s =>
        `<span class="ficha-link" onclick="window.goToSeguro && window.goToSeguro('${s.id}')">
          ${s.tipo} (${privacy ? "•••" : formatCurrency(s.prima)})
        </span>`).join(", ") : "-"}
      </div>
      <div><b>Gasto anual:</b> ${privacy ? "•••" : formatCurrency(gastoTotal)}</div>
      <div><b>Ingresos anuales (alquiler):</b> ${privacy ? "•••" : formatCurrency(ingresoTotal)}</div>
      <div><b>Rentabilidad neta estimada:</b> ${privacy ? "•••" : 
        (gastoTotal || ingresoTotal ? ((ingresoTotal - gastoTotal) / (bien.valorCompra||1) * 100).toFixed(2)+"%" : "-")}
      </div>
      <div><b>Documentos:</b> ${docs.length} archivo(s)</div>
    </div>
    <div class="relaciones-subseccion">
      <h3>Gastos recientes</h3>
      <ul>${gastos.slice(-5).reverse().map(g =>
        `<li>${formatDate(g.fecha)} — ${privacy ? "•••" : formatCurrency(g.importe)} (${g.categoria||"-"})</li>`
      ).join("") || "<li>Sin gastos registrados</li>"}</ul>
      <h3>Ingresos recientes</h3>
      <ul>${ingresos.slice(-5).reverse().map(i =>
        `<li>${formatDate(i.fecha)} — ${privacy ? "•••" : formatCurrency(i.importe)} (${i.tipo||"-"})</li>`
      ).join("") || "<li>Sin ingresos registrados</li>"}</ul>
    </div>
  `;
}
