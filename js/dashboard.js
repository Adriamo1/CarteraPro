// js/dashboard.js
// ===========================
// Integración de widgets en el dashboard principal de Cartera PRO
// ===========================

// Importa los widgets principales del dashboard (puedes añadir/quitar según prefieras)
import * as valorTotal from './widgets/valor-total.js';
import * as evolucion from './widgets/evolucion-cartera.js';
import * as distribucion from './widgets/distribucion.js';
import * as impactoDivisa from './widgets/impacto-divisa.js';
import * as loanSummary from './widgets/loan-summary.js';
import * as gastos from './widgets/widget-gastos.js';
import * as ingresos from './widgets/widget-ingresos.js';
import * as suscripciones from './widgets/widget-suscripciones.js';
import * as resumenFiscal from './widgets/widget-resumen-fiscal-anual.js';
import * as concentracion from './widgets/concentracion-cartera.js';
import * as checklist from './widgets/check-diversificacion.js';
import * as benchmarking from './widgets/benchmarking.js';
import * as revisiones from './widgets/lista-revisiones-clave.js';
import * as diario from './widgets/diario-inversor.js';
import * as ranking from './widgets/ranking-rentabilidad.js';
import * as saveback from './widgets/widget-saveback.js';
import * as proyeccion from './widgets/proyeccion-jubilacion.js';
import * as liquidez from './widgets/liquidez-colchon.js';
import * as alertas from './widgets/alertas-avisos.js';
import * as tip from './widgets/tip-diario.js';

// Lista de widgets y su orden. Puedes añadir, quitar o reordenar fácilmente.
const widgets = [
  { modulo: valorTotal, params: {} },
  { modulo: evolucion, params: {} },
  { modulo: distribucion, params: { modo: "tipo" } },
  { modulo: ranking, params: { topN: 5 } },
  { modulo: impactoDivisa, params: {} },
  { modulo: loanSummary, params: {} },
  { modulo: gastos, params: {} },
  { modulo: ingresos, params: {} },
  { modulo: suscripciones, params: {} },
  { modulo: resumenFiscal, params: {} },
  { modulo: concentracion, params: { modo: "activo" } },
  { modulo: checklist, params: {} },
  { modulo: benchmarking, params: {} },
  { modulo: revisiones, params: {} },
  { modulo: diario, params: {} },
  { modulo: saveback, params: {} },
  { modulo: proyeccion, params: {} },
  { modulo: liquidez, params: {} },
  { modulo: alertas, params: {} },
  { modulo: tip, params: {} }
];

// Estado global: modo privacidad
let modoPrivacidad = false;

// Inicializar el dashboard
export function initDashboard(containerId = "main") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Botón de modo privacidad
  const btnPrivacidad = document.createElement("button");
  btnPrivacidad.className = "btn btn-privacidad";
  btnPrivacidad.innerHTML = modoPrivacidad ? "👁️ Mostrar cifras" : "👁️ Ocultar cifras";
  btnPrivacidad.onclick = () => {
    modoPrivacidad = !modoPrivacidad;
    initDashboard(containerId);
  };
  container.appendChild(btnPrivacidad);

  // Grid de widgets
  const layout = document.createElement("div");
  layout.className = "dashboard-grid";
  container.appendChild(layout);

  // Renderiza cada widget en su columna
  widgets.forEach(async (w, idx) => {
    const div = document.createElement("div");
    div.className = "widget-card";
    layout.appendChild(div);
    try {
      await w.modulo.render(div, modoPrivacidad, w.params || {});
    } catch (e) {
      div.innerHTML = `<div class="card">Error al cargar widget ${idx+1}: ${e.message}</div>`;
    }
  });
}
