// js/modales.js
// ===========================
// Gestión de modales genéricos para formularios de creación/edición
// ===========================

export function abrirModal(contenidoHtml) {
  // Crea fondo modal si no existe
  let modalBg = document.getElementById("modal-bg");
  if (!modalBg) {
    modalBg = document.createElement("div");
    modalBg.id = "modal-bg";
    modalBg.className = "modal-bg";
    document.body.appendChild(modalBg);
  }
  modalBg.innerHTML = `
    <div class="modal">
      <button id="cerrar-modal" style="float:right;font-size:1.2em;">&times;</button>
      <div class="modal-contenido">${contenidoHtml}</div>
    </div>
  `;

  modalBg.style.display = "flex";
  modalBg.querySelector("#cerrar-modal").onclick = () => cerrarModal();
  modalBg.onclick = e => {
    if (e.target === modalBg) cerrarModal();
  };
}

export function cerrarModal() {
  const modalBg = document.getElementById("modal-bg");
  if (modalBg) modalBg.style.display = "none";
}
