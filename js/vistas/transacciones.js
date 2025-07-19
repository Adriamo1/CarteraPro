// vistas/transacciones.js
export async function render(container, db) {
  const transacciones = await db.transacciones.toArray();
  const activos = await db.activos.toArray();
  const mapaActivos = Object.fromEntries(activos.map(a => [a.id, a.nombre]));
  let editId = null;

  container.innerHTML = `
    <div class="card">
      <h2>Transacciones</h2>
      <form id="form-transaccion" class="form">
        <input type="hidden" name="id" />
        <div class="form-group">
          <label>Activo</label>
          <select name="activoId" required>
            ${activos.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select name="tipo" required>
            <option value="Compra">Compra</option>
            <option value="Venta">Venta</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" name="fecha" required />
        </div>
        <div class="form-group">
          <label>Cantidad</label>
          <input type="number" step="any" name="cantidad" required />
        </div>
        <div class="form-group">
          <label>Precio</label>
          <input type="number" step="any" name="precio" required />
        </div>
        <div class="form-group">
          <label>Comisión</label>
          <input type="number" step="any" name="comision" value="0" required />
        </div>
        <div class="form-group">
          <label>Broker</label>
          <input type="text" name="broker" />
        </div>
        <button class="btn" type="submit">Guardar transacción</button>
      </form>

      <table class="tabla-transacciones">
        <thead>
          <tr><th>Activo</th><th>Tipo</th><th>Fecha</th><th>Cantidad</th><th>Precio</th><th>Comisión</th><th>Acción</th></tr>
        </thead>
        <tbody>
          ${transacciones.map(t => `
            <tr>
              <td>${mapaActivos[t.activoId] || 'Desconocido'}</td>
              <td>${t.tipo}</td>
              <td>${t.fecha}</td>
              <td>${t.cantidad}</td>
              <td>${t.precio}</td>
              <td>${t.comision}</td>
              <td>
                <button class="btn btn-small editar" data-id="${t.id}">✏</button>
                <button class="btn btn-small borrar" data-id="${t.id}">🗑</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById("form-transaccion");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.activoId = Number(data.activoId);
    data.cantidad = parseFloat(data.cantidad);
    data.precio = parseFloat(data.precio);
    data.comision = parseFloat(data.comision);

    if (data.id) {
      await db.transacciones.update(Number(data.id), data);
    } else {
      await db.transacciones.add(data);
    }
    location.reload();
  });

  container.querySelectorAll(".borrar").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("¿Eliminar esta transacción?")) {
        await db.transacciones.delete(Number(btn.dataset.id));
        location.reload();
      }
    });
  });

  container.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const t = await db.transacciones.get(id);
      if (t) {
        form.id.value = t.id;
        form.activoId.value = t.activoId;
        form.tipo.value = t.tipo;
        form.fecha.value = t.fecha;
        form.cantidad.value = t.cantidad;
        form.precio.value = t.precio;
        form.comision.value = t.comision;
        form.broker.value = t.broker;
        form.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
