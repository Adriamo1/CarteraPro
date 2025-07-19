// js/widgets/panel-sostenibilidad.js
import { db } from '../db.js';

// Ejemplo simple: calcula % de activos con etiqueta ESG o ISIN verde
export async function render(container, privacy = false) {
  const activos = await db.activos.toArray();
  const total = activos.length;
  const esg = activos.filter(a =>
    (a.etiquetas || "").toLowerCase().includes("esg") ||
    (a.isin || "").toUpperCase().startsWith("ESG")
  ).length;

  let html = `<h2>Sostenibilidad</h2>
    <div><b>Activos sostenibles (ESG):</b> ${privacy ? "•••" : esg}</div>
    <div><b>% sobre el total:</b> ${privacy ? "•••" : ((esg / total * 100) || 0).toFixed(2)}%</div>
    <div class="mini-explica">Para análisis real de huella ESG conecta API de tu broker/plataforma o introduce etiquetas en tus activos.</div>
  `;
  container.innerHTML = `<div class="widget-panel-sostenibilidad card">${html}</div>`;
}
