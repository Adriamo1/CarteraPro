// js/vistas/suscripciones.js
import { db } from '../db.js';
import { formatCurrency, formatDate } from '../core.js';

// Vista: lista y gestión básica de suscripciones
export async function renderSuscripciones(container) {
  const suscripciones = await db.suscripciones.toArray();
  container.innerHTML = `
    <div class="panel-vista">
      <h2>Suscripciones</h2>
      <button class="btn" id="btn-nueva-suscripcion">+ Añadir suscripción</button>
      <table class="tabla-suscripciones">
        <thead>
          <tr><th>Nombre</th><th>Importe</th><th>Periodicidad</th><th>Próximo pago</th><th>Cuenta/Tarjeta</th><th>Bien/Activo</th></tr>
        </thead>
        <tbody>
          ${suscripciones.map(s =>
            `<tr data-id="${s.id}" class="fila-suscripcion">
              <td>${s.nombre || '-'}</td>
              <td>${formatCurrency(s.importe)}</td>
              <td>${s.periodicidad || '-'}</td>
              <td>${formatDate(s.proximoPago) || '-'}</td>
              <td>${s.cuentaId || s.tarjetaId || '-'}</td>
              <td>${s.bienId || s.activoId || '-'}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;

  container.querySelectorAll('.fila-suscripcion').forEach(row => {
    row.addEventListener('click', () => {
      const id = row.getAttribute('data-id');
      location.hash = `#ficha-suscripcion/${id}`;
    });
  });

  container.querySelector("#btn-nueva-suscripcion").addEventListener("click", () => {
    location.hash = "#nueva-suscripcion";
  });
}
