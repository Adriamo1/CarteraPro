// js/widgets/tip-diario.js

// Muestra un consejo financiero diferente cada día
const TIPS = [
  "Revisa tus comisiones de broker al menos una vez al año.",
  "Diversifica en varios activos y sectores para reducir riesgo.",
  "Aporta a tu fondo de emergencia antes de invertir en bolsa.",
  "Usa cuentas remuneradas para el dinero que no inviertes.",
  "Ten en cuenta la fiscalidad de los dividendos extranjeros.",
  "Comprueba la correlación de tus fondos y ETFs.",
  "Vigila los gastos ocultos en suscripciones y tarjetas.",
  "Haz backup de tu cartera al menos una vez al mes.",
  "Revisa tu plan de inversión tras eventos vitales importantes.",
  "No persigas el “market timing”, céntrate en la constancia."
];

// Widget: consejo del día
export function render(container) {
  const dia = (new Date()).getDate() % TIPS.length;
  container.innerHTML = `<div class="widget-tip-diario card">
    <h2>Consejo del día</h2>
    <div style="margin:11px 0;font-size:1.08em;">${TIPS[dia]}</div>
    <div class="mini-explica">Renueva el consejo recargando la app.</div>
  </div>`;
}
