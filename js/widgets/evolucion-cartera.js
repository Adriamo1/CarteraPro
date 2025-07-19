// js/widgets/evolucion-cartera.js
import { db } from '../db.js';

// Widget: Gráfico de evolución temporal del valor total de la cartera usando Chart.js
export async function render(container, privacy = false) {
  // Obtén el histórico de evolución de la tabla 'historico'
  const historico = await db.historico.toArray();
  if (!historico.length) {
    container.innerHTML = "<div class='card'>No hay histórico suficiente.</div>";
    return;
  }

  // Ordena por fecha y prepara datos
  historico.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  const labels = historico.map(d => d.fecha.slice(0, 10));
  const data = historico.map(d => privacy ? null : d.valorTotal);

  container.innerHTML = `<canvas id="graficoEvolucion" height="90"></canvas>`;
  const ctx = document.getElementById("graficoEvolucion").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Valor total",
        data,
        borderColor: "#3498db",
        backgroundColor: "rgba(52,152,219,0.09)",
        tension: 0.19
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: { y: { beginAtZero: false } }
    }
  });
}
