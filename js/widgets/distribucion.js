// js/widgets/distribucion.js
import { db } from '../db.js';

// Widget: Gráfico de pastel con la distribución por tipo, sector o divisa usando Chart.js
export async function render(container, privacy = false, { modo = "tipo" } = {}) {
  const activos = await db.activos.toArray();
  if (!activos.length) {
    container.innerHTML = `<div class="card">No hay activos suficientes.</div>`;
    return;
  }

  // Agrupa por el campo 'modo' (tipo/sector/moneda/pais...)
  const agrupado = {};
  let total = 0;
  activos.forEach(a => {
    const key = (a[modo] || "Otro");
    agrupado[key] = (agrupado[key] || 0) + (+a.valorActual || 0);
    total += +a.valorActual || 0;
  });
  const labels = Object.keys(agrupado);
  const data = labels.map(l => privacy ? null : agrupado[l]);

  container.innerHTML = `<canvas id="graficoDistribucion" height="90"></canvas>`;
  const ctx = document.getElementById("graficoDistribucion").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Distribución",
        data,
        backgroundColor: [
          "#2063c2", "#26b281", "#f39c12", "#e74c3c", "#7b52c0", "#666", "#A3D6A7", "#F4E285"
        ],
        borderWidth: 1.5
      }]
    },
    options: {
      plugins: { legend: { display: true } },
      responsive: true
    }
  });
}
