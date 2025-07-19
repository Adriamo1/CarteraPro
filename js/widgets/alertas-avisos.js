// js/widgets/alertas-avisos.js
import { getProximosEventos } from '../calendario.js';

// Widget: Muestra eventos, vencimientos y alertas próximas
export async function render(container, privacy = false, dias = 30) {
  const eventos = await getProximosEventos(dias);
  let html = `<h2>Alertas y avisos próximos</h2>
    <ul class="lista-alertas">
      ${eventos.length ? eventos.map(e =>
        `<li><b>${e.fecha.slice(0,10)}</b>: ${e.titulo || e.tipo} — ${e.descripcion || ""}</li>`
      ).join("") : "<li>Sin alertas próximas.</li>"}
    </ul>
    <div class="mini-explica">Aquí verás vencimientos de seguros, préstamos, renovaciones y revisiones clave.</div>
  `;
  container.innerHTML = `<div class="widget-alertas-avisos card">${html}</div>`;
}

