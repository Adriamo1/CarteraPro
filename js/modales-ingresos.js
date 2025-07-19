// js/modales-ingresos.js
import { db } from './db.js';
import { abrirModal, cerrarModal } from './modales.js';
import { notify, uuid } from './core.js';

export async function modalIngreso({ id = null } = {}) {
  let ingreso = null;
  if (id) ingreso = await db.ingresos.get(Number(id));

  const html = `
    <h3>${id ? 'Editar' : 'Nuevo'} ingreso</h3>
    <form id="form-ingreso">
      <label>Fecha: <input name="fecha" type="date" required value="${ingreso ? ingreso.fecha?.slice(0,10) : new Date().toISOString().slice(0,10)}"></label>
      <label>Importe: <input name="importe" type="number" step="0.01" required value="${ingreso ? ingreso.importe || 0 : 0}"></label>
      <label>Tipo: <input name="tipo" type="text" value="${ingreso ? ingreso.tipo || '' : ''}"></label>
      <label>Origen: <input name="origen" type="text" value="${ingreso ? ingreso.origen || '' : ''}"></label>
      <label>Cuenta ID: <input name="cuentaId" type="number" value="${ingreso ? ingreso.cuentaId || '' : ''}"></label>
      <label>Bien ID: <input name="bienId" type="number" value="${ingreso ? ingreso.bienId || '' : ''}"></label>
      <label>Activo ID: <input name="activoId" type="number" value="${ingreso ? ingreso.activoId || '' : ''}"></label>
      <div style="margin-top:10px;">
        <button type="submit" class="btn">${id ? 'Guardar cambios' : 'Añadir ingreso'}</button>
        <button type="button" id="btn-cancelar" class="btn btn-outline">Cancelar</button>
      </div>
    </form>
  `;

  abrirModal(html);

  const modal = document.getElementById("modal-bg");
  const form = modal.querySelector("#form-ingreso");
  const btnCancelar = modal.querySelector("#btn-cancelar");

  btnCancelar.onclick = () => cerrarModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nuevoIngreso = {
      id: id ? Number(id) : uuid(),
      fecha: formData.get("fecha"),
      importe: parseFloat(formData.get("importe")) || 0,
      tipo: formData.get("tipo").trim(),
      origen: formData.get("origen").trim(),
      cuentaId: formData.get("cuentaId") ? Number(formData.get("cuentaId")) : null,
      bienId: formData.get("bienId") ? Number(formData.get("bienId")) : null,
      activoId: formData.get("activoId") ? Number(formData.get("activoId")) : null
    };

    if (!nuevoIngreso.fecha || !nuevoIngreso.importe) {
      notify("Por favor rellena los campos obligatorios.", "error");
      return;
    }

    try {
      await db.ingresos.put(nuevoIngreso);
      notify(id ? "Ingreso actualizado." : "Ingreso añadido.", "success");
      cerrarModal();
      location.hash = "#ingresos";
    } catch (err) {
      notify("Error al guardar ingreso: " + err.message, "error");
    }
  };
}
