// js/modales-gastos.js
import { db } from './db.js';
import { abrirModal, cerrarModal } from './modales.js';
import { notify, uuid } from './core.js';

export async function modalGasto({ id = null } = {}) {
  let gasto = null;
  if (id) gasto = await db.gastos.get(Number(id));

  const html = `
    <h3>${id ? 'Editar' : 'Nuevo'} gasto</h3>
    <form id="form-gasto">
      <label>Fecha: <input name="fecha" type="date" required value="${gasto ? gasto.fecha?.slice(0,10) : new Date().toISOString().slice(0,10)}"></label>
      <label>Importe: <input name="importe" type="number" step="0.01" required value="${gasto ? gasto.importe || 0 : 0}"></label>
      <label>Tipo: <input name="tipo" type="text" value="${gasto ? gasto.tipo || '' : ''}"></label>
      <label>Categoría: <input name="categoria" type="text" value="${gasto ? gasto.categoria || '' : ''}"></label>
      <label>Descripción: <input name="descripcion" type="text" value="${gasto ? gasto.descripcion || '' : ''}"></label>
      <label>Cuenta ID: <input name="cuentaId" type="number" value="${gasto ? gasto.cuentaId || '' : ''}"></label>
      <label>Bien ID: <input name="bienId" type="number" value="${gasto ? gasto.bienId || '' : ''}"></label>
      <div style="margin-top:10px;">
        <button type="submit" class="btn">${id ? 'Guardar cambios' : 'Añadir gasto'}</button>
        <button type="button" id="btn-cancelar" class="btn btn-outline">Cancelar</button>
      </div>
    </form>
  `;

  abrirModal(html);

  const modal = document.getElementById("modal-bg");
  const form = modal.querySelector("#form-gasto");
  const btnCancelar = modal.querySelector("#btn-cancelar");

  btnCancelar.onclick = () => cerrarModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nuevoGasto = {
      id: id ? Number(id) : uuid(),
      fecha: formData.get("fecha"),
      importe: parseFloat(formData.get("importe")) || 0,
      tipo: formData.get("tipo").trim(),
      categoria: formData.get("categoria").trim(),
      descripcion: formData.get("descripcion").trim(),
      cuentaId: formData.get("cuentaId") ? Number(formData.get("cuentaId")) : null,
      bienId: formData.get("bienId") ? Number(formData.get("bienId")) : null
    };

    if (!nuevoGasto.fecha || !nuevoGasto.importe) {
      notify("Por favor rellena los campos obligatorios.", "error");
      return;
    }

    try {
      await db.gastos.put(nuevoGasto);
      notify(id ? "Gasto actualizado." : "Gasto añadido.", "success");
      cerrarModal();
      location.hash = "#gastos";
    } catch (err) {
      notify("Error al guardar gasto: " + err.message, "error");
    }
  };
}
