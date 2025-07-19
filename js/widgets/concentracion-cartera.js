// js/widgets/concentracion-cartera.js
import { db } from '../db.js';
import { formatPercent } from '../core.js';

// Widget: concentración por activo, sector, país, broker
export async function render(container, privacy = false, { modo = "activo", topN = 5 } = {}) {
  const activos = (await db.activos.toArray()).filter(a => +a.valorActual > 0);
  let campo = "nombre", titulo = "Activos";
  if (modo === "sector") { campo = "sector"; titulo = "Sectores"; }
  if (modo === "pais") { campo = "pais"; titulo = "Países"; }
  if (modo === "broker") { campo = "broker"; titulo = "Brokers"; }

  const agrupados = {}, total = activos.reduce((s,a)=>s+(+a.valorActual||0),0);
  activos.forEach(a => {
    const key = a[campo] || "Sin especificar";
    agrupados[key] = (agrupados[key] || 0) + (+a.valorActual || 0);
  });
  const top = Object.entries(agrupados).sort((a, b) => b[1] - a[1]).slice(0, topN);
  const sumaTop = top.reduce((s, e) => s + e[1], 0);
  const otros = total - sumaTop;
  let html = `<h2>Concentración — Top ${topN} ${titulo}</h2>
    <table class="tabla-concentracion"><thead>
      <tr><th>${titulo.slice(0,-1)}</th><th>% de cartera</th></tr>
    </thead><tbody>
      ${top.map(([nombre, valor]) => `<tr><td>${nombre}</td><td>${privacy ? "•••" : formatPercent(valor / total * 100, 1)}</td></tr>`).join("")}
      <tr><td><i>Otros</i></td><td>${privacy ? "•••" : formatPercent(otros / total * 100, 1)}</td></tr>
    </tbody></table>
    <div class="mini-explica">Verifica que ningún activo, sector o país supera el 30-40%.</div>`;
  container.innerHTML = `<div class="widget-concentracion-cartera card">${html}</div>`;
}
