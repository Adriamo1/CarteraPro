// vistas/dashboard.js
import { db } from "../jsdb.js";

export async function render(container) {
  const activos = await db.activos.toArray();
  const transacciones = await db.transacciones.toArray();
  const cuentas = await db.cuentas.toArray();

  const valorTotalActivos = activos.reduce((sum, a) => sum + (a.valorActual || 0), 0);
  const saldoTotal = cuentas.reduce((sum, c) => sum + (c.saldo || 0), 0);

  const porTipo = activos.reduce((acc, a) => {
    acc[a.tipo] = (acc[a.tipo] || 0) + (a.valorActual || 0);
    return acc;
  }, {});

  const labels = Object.keys(porTipo);
  const datos = Object.values(porTipo);

  container.innerHTML = `
    <div class="card">
      <h2>Panel de control</h2>
      <div class="kpi-grid">
        <div class="kpi">💰 Valor total activos: <strong>${valorTotalActivos.toFixed(2)} €</strong></div>
        <div class="kpi">🏦 Saldo total cuentas: <strong>${saldoTotal.toFixed(2)} €</strong></div>
        <div class="kpi">🔄 Transacciones registradas: <strong>${transacciones.length}</strong></div>
      </div>
      <canvas id="graficoDistribucion" style="max-width: 400px; margin: auto;"></canvas>
    </div>
  `;

  const ctx = document.getElementById("graficoDistribucion");
  if (ctx) {
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          label: "Distribución por tipo",
          data: datos,
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            position: "bottom"
          }
        }
      }
    });
  }
}
