// js/vistas/gastos.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Vista: lista y gestión básica de gastos
export async function renderGastos(container) {
  const gastos = await db.gastos.toArray();
  container.innerHTML = `
    <div class="panel-vista">
      <h2>Gastos</h2>
      <button class="btn" id="btn-nuevo-gasto">+ Añadir gasto</button>
      <table class="tabla-gastos">
        <thead>
          <tr><th>Fecha</th><th>Importe</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Cuenta</th><th>Bien</th></tr>
        </thead>
        <tbody>
          ${gastos.map(g =>
            `<tr data-id="${g.id}" class="fila-gasto">
              <td>${formatDate(g.fecha)}</td>
              <td>${formatCurrency(g.importe)}</td>
              <td>${g.tipo || '-'}</td>
              <td>${g.categoria || '-'}</td>
              <td>${g.descripcion || '-'}</td>
              <td>${g.cuentaId || '-'}</td>
              <td>${g.bienId || '-'}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.fila-gasto').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      location.hash = `#ficha-gasto/${id}`;
    });
  });

  container.querySelector("#btn-nuevo-gasto").addEventListener("click", () => {
    location.hash = "#nuevo-gasto";
  });
}
