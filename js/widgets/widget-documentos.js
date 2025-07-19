// js/widgets/widget-documentos.js
import { getDocumentos } from '../documentos.js';

// Widget: lista de documentos asociados a una entidad (bien, activo, préstamo…)
export async function render(container, privacy = false, { entidad = null, entidadId = null } = {}) {
  let docs = await getDocumentos({ entidad, entidadId });
  let html = `<h2>Documentos adjuntos</h2>
    <ul class="lista-documentos">
      ${docs.length ? docs.map(d => `
        <li>
          <b>${d.tipo}</b> — <a href="${d.url}" target="_blank" rel="noopener noreferrer">${d.descripcion || d.url}</a>
          <span style="color:#888; font-size:.9em;">(${new Date(d.fecha).toLocaleDateString('es-ES')})</span>
        </li>
      `).join("") : "<li>No hay documentos.</li>"}
    </ul>
    <div class="mini-explica">Gestiona aquí facturas, pólizas, notas, contratos y más asociados a cada entidad.</div>
  `;
  container.innerHTML = `<div class="widget-documentos card">${html}</div>`;
}
