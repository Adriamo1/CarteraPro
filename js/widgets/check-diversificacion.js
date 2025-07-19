// js/widgets/check-diversificacion.js
import { db } from '../db.js';

// Requisitos mínimos de diversificación (puedes editar o hacer personalizable)
const REQUERIDO = {
  regiones: ["Europa", "USA", "Emergentes"],
  tipos: ["Acción", "ETF", "Cripto", "Fondo", "Bonos", "REIT"],
  monedas: ["EUR", "USD", "GBP", "CHF", "JPY"],
  sectores: ["Tecnología", "Financiero", "Consumo", "Salud", "Industria"]
};

// Widget: Checklist visual de diversificación (zonas, activos, sectores, monedas)
export async function render(container, privacy = false) {
  const activos = await db.activos.toArray();
  const regiones = new Set(activos.map(a => a.region || "Sin especificar"));
  const tipos = new Set(activos.map(a => a.tipo || "Sin especificar"));
  const monedas = new Set(activos.map(a => a.moneda || "Sin especificar"));
  const sectores = new Set(activos.map(a => a.sector || "Sin especificar"));

  let html = `<h2>Checklist de Diversificación</h2>
    <table class="tabla-checklist"><tr><th>Categoría</th><th>Cubierto</th></tr>
      ${Object.entries(REQUERIDO).map(([cat, valores]) => valores.map(val =>
        `<tr>
          <td>${cat[0].toUpperCase() + cat.slice(1)}: <b>${val}</b></td>
          <td>
            ${
              (cat === "regiones" ? regiones.has(val)
              : cat === "tipos" ? tipos.has(val)
              : cat === "monedas" ? monedas.has(val)
              : sectores.has(val))
              ? '<span class="tick">&#9989;</span>'
              : '<span class="cross">&#10060;</span>'
            }
          </td>
        </tr>`
      ).join("")).join("")}
    </table>
    <div class="mini-explica">Un &#9989; indica cobertura. Si ves &#10060; revisa tu diversificación.</div>`;
  container.innerHTML = `<div class="widget-check-diversificacion card">${html}</div>`;
}
