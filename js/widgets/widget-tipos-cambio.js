// js/widgets/widget-tipos-cambio.js
import { db } from '../db.js';

// Widget: gestión manual y automática de tipos de cambio
export async function render(container, privacy = false) {
  const tiposCambio = await db.tiposCambio.toArray();
  
  // Mostrar tabla editable de tipos de cambio
  let html = `<h2>Tipos de cambio</h2>
    <table class="tabla-tipos-cambio">
      <thead>
        <tr><th>Divisa</th><th>Cambio a EUR</th><th>Editar</th></tr>
      </thead>
      <tbody>
        ${tiposCambio.length ? tiposCambio.map(tc => `
          <tr data-id="${tc.id}">
            <td>${tc.divisa}</td>
            <td><input type="number" step="0.0001" value="${tc.cambio}" data-id="${tc.id}" class="input-cambio"></td>
            <td><button class="btn-guardar" data-id="${tc.id}">Guardar</button></td>
          </tr>
        `).join('') : `<tr><td colspan="3">No hay tipos de cambio registrados.</td></tr>`}
      </tbody>
    </table>
    <button id="btn-refrescar-cambios" class="btn">Actualizar automáticamente</button>
    <div class="mini-explica">Puedes editar manualmente o actualizar los tipos de cambio automáticamente.</div>
  `;

  container.innerHTML = `<div class="widget-tipos-cambio card">${html}</div>`;

  // Guardar cambios manuales
  container.querySelectorAll('.btn-guardar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-id'));
      const input = container.querySelector(`input[data-id="${id}"]`);
      const nuevoCambio = parseFloat(input.value);
      if (isNaN(nuevoCambio) || nuevoCambio <= 0) {
        alert("Introduce un valor válido para el tipo de cambio.");
        return;
      }
      await db.tiposCambio.update(id, { cambio: nuevoCambio });
      alert("Tipo de cambio actualizado.");
    });
  });

  // Actualizar automáticamente (ejemplo con API gratuita)
  container.querySelector('#btn-refrescar-cambios').addEventListener('click', async () => {
    // Ejemplo API: exchangerate.host (sin API key)
    try {
      const resp = await fetch('https://api.exchangerate.host/latest?base=EUR');
      const data = await resp.json();
      if (!data.rates) throw new Error('No se recibieron datos.');
      const keys = Object.keys(data.rates);
      for (const tc of tiposCambio) {
        if (keys.includes(tc.divisa)) {
          await db.tiposCambio.update(tc.id, { cambio: 1 / data.rates[tc.divisa] });
        }
      }
      alert('Tipos de cambio actualizados automáticamente.');
      render(container, privacy); // refresca el widget
    } catch (e) {
      alert('Error al actualizar tipos de cambio: ' + e.message);
    }
  });
}
