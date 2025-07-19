// js/widgets/proyeccion-jubilacion.js
import { db } from '../db.js';
import { formatCurrency } from '../core.js';

// Proyección simple de capital a futuro con aportaciones y rentabilidad media anual
export async function render(container, privacy = false, { años = 30, rentabilidad = 5, aportacionAnual = 3000 } = {}) {
  // Capital inicial = suma de activos + cuentas
  let total = 0;
  const activos = await db.activos.toArray();
  total += activos.reduce((s, a) => s + (+a.valorActual || 0), 0);
  const cuentas = await db.cuentas.toArray();
  total += cuentas.reduce((s, c) => s + (+c.saldo || 0), 0);

  let historial = [total];
  for (let i = 1; i <= años; ++i) {
    total = (total + aportacionAnual) * (1 + rentabilidad / 100);
    historial.push(total);
  }

  let html = `<h2>Proyección de capital a ${años} años</h2>
    <div><b>Rentabilidad media anual:</b> ${rentabilidad}%</div>
    <div><b>Aportación anual:</b> ${privacy ? "•••" : formatCurrency(aportacionAnual)}</div>
    <div><b>Capital estimado final:</b> ${privacy ? "•••" : formatCurrency(total)}</div>
    <canvas id="graficoProyeccion" height="80"></canvas>
    <div class="mini-explica">Proyección basada en capital actual, aportaciones fijas y rentabilidad constante.</div>
  `;
  container.innerHTML = `<div class="widget-proyeccion-jubilacion card">${html}</div>`;

  // Gráfico con Chart.js
  const ctx = document.getElementById("graficoProyeccion").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: Array.from({ length: años + 1 }, (_, i) => i),
      datasets: [{
        label: "Capital acumulado",
        data: privacy ? historial.map(() => null) : historial,
        borderColor: "#27ae60",
        backgroundColor: "rgba(39,174,96,0.10)",
        tension: 0.16
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}
