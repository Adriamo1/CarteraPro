// js/widgets/lista-revisiones-clave.js

// Preguntas clave para revisión semestral/anual (personalizable)
const PREGUNTAS_CLAVE = [
  "¿He rebalanceado mi cartera según mi perfil de riesgo?",
  "¿He revisado comisiones y puedo optimizar brokers/plataformas?",
  "¿Estoy demasiado concentrado en algún activo/sector/país?",
  "¿He actualizado los valores de mis bienes y préstamos?",
  "¿He calculado el impacto fiscal de mis operaciones?",
  "¿Tengo la liquidez suficiente para afrontar imprevistos?",
  "¿He revisado vencimientos de seguros, préstamos y suscripciones?",
  "¿Mis gastos recurrentes están bajo control?",
  "¿He documentado cambios importantes y guardado backup?",
  "¿Estoy cumpliendo mis objetivos de ahorro/inversión?"
];

// Widget: Checklist de revisión semestral/anual
export function render(container) {
  let checklist = JSON.parse(localStorage.getItem("checklistRevisiones") || "{}");

  let html = `<h2>Checklist de revisión semestral</h2>
    <form id="form-checklist-revisiones">
      <ul class="checklist-revisiones">
        ${PREGUNTAS_CLAVE.map((q, i) =>
          `<li>
            <label>
              <input type="checkbox" name="chk${i}" ${checklist[i] ? "checked" : ""}>
              ${q}
            </label>
          </li>`
        ).join("")}
      </ul>
    </form>
    <div class="mini-explica">Marca cada pregunta una vez revisada. Puedes modificar o ampliar la lista en el panel de configuración.</div>
  `;

  container.innerHTML = `<div class="widget-revisiones-clave card">${html}</div>`;

  // Guarda el estado al marcar/desmarcar
  container.querySelectorAll("input[type=checkbox]").forEach((chk, idx) => {
    chk.addEventListener("change", e => {
      checklist[idx] = chk.checked;
      localStorage.setItem("checklistRevisiones", JSON.stringify(checklist));
    });
  });
}
