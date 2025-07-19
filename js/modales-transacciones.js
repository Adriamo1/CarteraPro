// js/modales-transacciones.js
import { db } from './db.js';
import { abrirModal, cerrarModal } from './modales.js';
import { notify, uuid } from './core.js';

export async function modalTransaccion({ id = null } = {}) {
  let trans = null;
  if (id) trans = await db.transacciones.get(Number(id));

  const html = `
    <h3>${id ? 'Editar' : 'Nueva'} transacción</h3>
    <form id="form-transaccion">
      <label>Fecha: <input name="fecha" type="date" required value="${trans ? trans.fecha?.slice(0,10) : new Date().toISOString().slice(0,10)}"></label>
      <label>Tipo: 
        <select name="tipo" required>
          <option value="">Selecciona</option>
          <option value="compra" ${trans && trans.tipo === 'compra' ? 'selected' : ''}>Compra</option>
          <option value="venta" ${trans && trans.tipo === 'venta' ? 'selected' : ''}>Venta</option>
        </select>
      </label>
      <label>Activo ID: <input name="activoId" type="number" value="${trans ? trans.activoId || '' : ''}"></label>
      <label>Cantidad: <input name="cantidad" type="number" step="0.0001" value="${trans ? trans.cantidad || 0 : 0}"></label>
      <label>Precio: <input name="precio" type="number" step="0.01" value="${trans ? trans.precio || 0 : 0}"></label>
      <label>Comisión: <input name="comision" type="number" step="0.01" value="${trans ? trans.comision || 0 : 0}"></label>
      <label>Broker: <input name="broker" type="text" value="${trans ? trans.broker || '' : ''}"></label>
      <label>Cambio EUR: <input name="cambio" type="number" step="0.0001" value="${trans ? trans.cambio || 1 : 1}"></label>
      <label>Notas: <textarea name="notas">${trans ? trans.notas || '' : ''}</textarea></label>
      <div style="margin-top:10px;">
        <button type="submit" class="btn">${id ? 'Guardar cambios' : 'Añadir transacción'}</button>
        <button type="button" id="btn-cancelar" class="btn btn-outline">Cancelar</button>
      </div>
    </form>
  `;

  abrirModal(html);

  const modal = document.getElementById("modal-bg");
  const form = modal.querySelector("#form-transaccion");
  const btnCancelar = modal.querySelector("#btn-cancelar");

  btnCancelar.onclick = () => cerrarModal();

  form.onsubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const nuevaTrans = {
      id: id ? Number(id) : uuid(),
      fecha: formData.get("fecha"),
      tipo: formData.get("tipo"),
      activoId: formData.get("activoId") ? Number(formData.get("activoId")) : null,
      cantidad: parseFloat(formData.get("cantidad")) || 0,
      precio: parseFloat(formData.get("precio")) || 0,
      comision: parseFloat(formData.get("comision")) || 0,
      broker: formData.get("broker").trim(),
      cambio: parseFloat(formData.get("cambio")) || 1,
      notas: formData.get("notas").trim()
    };

    if (!nuevaTrans.fecha || !nuevaTrans.tipo) {
      notify("Por favor rellena los campos obligatorios.", "error");
      return;
    }

    try {
      await db.transacciones.put(nuevaTrans);
      notify(id ? "Transacción actualizada." : "Transacción añadida.", "success");
      cerrarModal();
      location.hash = "#transacciones";
    } catch (err) {
      notify("Error al guardar transacción: " + err.message, "error");
    }
  };
}
