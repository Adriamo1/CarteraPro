// js/widgets/diario-inversor.js
import { db } from '../db.js';
import { formatDate, uuid } from '../core.js';

// Widget: Diario inversor, para anotar reflexiones y motivos de inversión
export async function render(container) {
  let diario = await db.logs.where("entidad").equals("diario").reverse().sortBy("fecha");
  if (!diario) diario = [];

  let html = `<h2>Diario inversor</h2>
    <form id="form-diario-inversor" style="margin-bottom:13px;">
      <textarea id="diario-input" rows="3" style="width:98%;" placeholder="Nueva reflexión o motivo de inversión..."></textarea>
      <button type="submit" class="btn" style="margin-top:5px;">Añadir entrada</button>
    </form>
    <ul class="lista-diario-inversor">
      ${diario.slice(0, 15).map(entry => `
        <li>
          <b>${formatDate(entry.fecha)}:</b>
          <span>${entry.descripcion}</span>
        </li>
      `).join("") || "<li>No hay entradas todavía.</li>"}
    </ul>
    <div class="mini-explica">Registra aquí el porqué de tus movimientos, reflexiones de mercado o decisiones para revisar en el futuro.</div>
  `;

  container.innerHTML = `<div class="widget-diario-inversor card">${html}</div>`;

  // Maneja envío de nueva entrada
  container.querySelector("#form-diario-inversor").addEventListener("submit", async (e) => {
    e.preventDefault();
    const txt = container.querySelector("#diario-input").value.trim();
    if (txt) {
      await db.logs.put({
        id: uuid(),
        fecha: new Date().toISOString(),
        entidad: "diario",
        descripcion: txt
      });
      container.querySelector("#diario-input").value = "";
      render(container); // recarga el widget
    }
  });
}
