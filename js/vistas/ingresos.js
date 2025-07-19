// js/vistas/ingresos.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Vista: lista y gestión básica de ingresos
export async function renderIngresos(container) {
  const ingresos = await db.ingresos.toArray();
  container.innerHTML = `
    <div class="panel-vista">
      <h2>Ingresos</h2>
      <button class="btn" id="btn-nuevo-ingreso">+ Añadir ingreso</button>
      <table class="tabla-ingresos">
        <thead>
          <tr><th>Fecha</th><th>Importe</th><th>Tipo</th><th>Origen</th><th>Cuenta</th><th>Bien</th><th>Activo</th></tr>
        </thead>
        <tbody>
          ${ingresos.map(i =>
            `<tr data-id="${i.id}" class="fila-ingreso">
              <td>${formatDate(i.fecha)}</td>
              <td>${formatCurrency(i.importe)}</td>
              <td>${i.tipo || '-'}</td>
              <td>${i.origen || '-'}</td>
              <td>${i.cuentaId || '-'}</td>
              <td>${i.bienId || '-'}</td>
              <td>${i.activoId || '-'}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.fila-ingreso').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      location.hash = `#ficha-ingreso/${id}`;
    });
  });

  container.querySelector("#btn-nuevo-ingreso").addEventListener("click", () => {
    location.hash = "#nuevo-ingreso";
  });
}
