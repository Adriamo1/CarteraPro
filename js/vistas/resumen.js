// vistas/resumen.js
export async function render(container, db) {
  const totalActivos = await db.activos.count();
  const totalTransacciones = await db.transacciones.count();

  container.innerHTML = `
    <div class="card">
      <h2>Resumen general</h2>
      <div class="kpi-valor-total">
        <div class="kpi">🔹 Activos registrados: ${totalActivos}</div>
        <div class="kpi">📈 Transacciones: ${totalTransacciones}</div>
      </div>
      <p class="mini-explica">Aquí verás un resumen de tu cartera, evolución y KPIs clave.</p>
    </div>
  `;
}
