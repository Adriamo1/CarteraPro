// js/vistas/bienes.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Vista: lista y gestión básica de bienes (inmuebles, vehículos, etc.)
export async function renderBienes(container) {
  const bienes = await db.bienes.toArray();
  container.innerHTML = `
    <div class="panel-vista">
      <h2>Bienes</h2>
      <button class="btn" id="btn-nuevo-bien">+ Añadir bien</button>
      <table class="tabla-bienes">
        <thead>
          <tr><th>Descripción</th><th>Tipo</th><th>Valor actual</th><th>Dirección</th></tr>
        </thead>
        <tbody>
          ${bienes.map(b =>
            `<tr data-id="${b.id}" class="fila-bien">
              <td>${b.descripcion}</td>
              <td>${b.tipo}</td>
              <td>${formatCurrency(b.valorActual)}</td>
              <td>${b.direccion || '-'}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  // Evento para abrir ficha/edición del bien al hacer click en fila
  container.querySelectorAll('.fila-bien').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      location.hash = `#ficha-bien/${id}`;
    });
  });

  // Botón añadir bien: redirige a creación (a implementar)
  container.querySelector("#btn-nuevo-bien").addEventListener("click", () => {
    location.hash = "#nuevo-bien";
  });
}
