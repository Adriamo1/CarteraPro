// js/modales-suscripciones.js
import { db } from './db.js';
import { abrirModal, cerrarModal } from './modales.js';
import { notify, uuid } from './core.js';

export async function modalSuscripcion({ id = null } = {}) {
  let suscripcion = null;
  if (id) suscripcion = await db.suscripciones.get(Number(id));

  const html = `
    <h3>${id ? 'Editar' : 'Nueva'} suscripción</h3>
    <form id="form-suscripcion">
      <label>Nombre: <input name="nombre" type="text" required value="${suscripcion ? suscripcion.nombre : ''}"></label>
      <label>Importe: <input name="importe" type="number" step="0.01" value="${suscripcion ? suscripcion.importe || 0 : 0}"></label>
      <label>Periodicidad: <input name="periodicidad" type="text" value="${suscripcion ? suscripcion.periodicidad || '' : ''}"></label>
      <label>Próximo pago: <input name="proximoPago" type="date" value="${suscripcion ? suscripcion.proximoPago?.slice(0,10) : ''}"></label>
      <label>Cuenta ID: <input name="cuentaId" type="number" value="${suscripcion ? suscripcion.cuentaId || '' : ''}"></label>
      <label>Tarjeta ID: <input name="tarjetaId" type="number" value="${suscripcion ? suscripcion.tarjetaId || '' : ''}"></label>
      <label>Bien ID: <input name="bienId" type="number" value="${suscripcion ? suscripcion.bienId || '' : ''}"></label>
      <label>Activo ID: <input name="activoId" type="number" value="${suscripcion ? suscripcion.activoId || '' : ''}"></label>
      <label>Categoría: <input name="categoria" type="text" value="${suscripcion ? suscripcion.categoria || '' : ''}"></label>
      <div style="margin-top:10px;">
        <button type="submit" class="btn">${id ? 'Guardar cambios' : 'Añadir suscripción'}</button>
        <button type="button" id="btn-cancelar" class="btn btn-outline">Cancelar</button>
      </div>
    </form>
  `;

  abrirModal(html);

  const modal = document.getElementById("modal-bg");
  const form = modal.querySelector("#form-suscripcion");
  const btnCancelar = modal.querySelector("#btn-cancelar");

  btnCancelar.onclick = () => cerrarModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nuevaSuscripcion = {
      id: id ? Number(id) : uuid(),
      nombre: formData.get("nombre").trim(),
      importe: parseFloat(formData.get("importe")) || 0,
      periodicidad: formData.get("periodicidad").trim(),
      proximoPago: formData.get("proximoPago"),
      cuentaId: formData.get("cuentaId") ? Number(formData.get("cuentaId")) : null,
      tarjetaId: formData.get("tarjetaId") ? Number(formData.get("tarjetaId")) : null,
      bienId: formData.get("bienId") ? Number(formData.get("bienId")) : null,
      activoId: formData.get("activoId") ? Number(formData.get("activoId")) : null,
      categoria: formData.get("categoria").trim()
    };

    if (!nuevaSuscripcion.nombre) {
      notify("El nombre es obligatorio.", "error");
      return;
    }

    try {
      await db.suscripciones.put(nuevaSuscripcion);
      notify(id ? "Suscripción actualizada." : "Suscripción añadida.", "success");
      cerrarModal();
      location.hash = "#suscripciones";
    } catch (err) {
      notify("Error al guardar suscripción: " + err.message, "error");
    }
  };
}
