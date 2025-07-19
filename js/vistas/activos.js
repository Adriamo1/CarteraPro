// vistas/activos.js
export async function render(container, db) {
  const activos = await db.activos.toArray();
  let editId = null;

  container.innerHTML = `
    <div class="card">
      <h2>Activos</h2>
      <form id="form-activo" class="form">
        <input type="hidden" name="id" />
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" name="nombre" required />
        </div>
        <div class="form-group">
          <label>Ticker</label>
          <input type="text" name="ticker" required />
        </div>
        <div class="form-group">
          <label>Tipo</label>
          <select name="tipo" required>
            <option value="ETF">ETF</option>
            <option value="Acción">Acción</option>
            <option value="Criptomoneda">Criptomoneda</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div class="form-group">
          <label>Moneda</label>
          <input type="text" name="moneda" required value="EUR" />
        </div>
        <button class="btn" type="submit">Guardar activo</button>
      </form>

      <table class="tabla-activos">
        <thead>
          <tr><th>Nombre</th><th>Ticker</th><th>Tipo</th><th>Moneda</th><th>Acción</th></tr>
        </thead>
        <tbody>
          ${activos.map(a => `
            <tr>
              <td>${a.nombre}</td>
              <td>${a.ticker}</td>
              <td>${a.tipo}</td>
              <td>${a.moneda}</td>
              <td>
                <button class="btn btn-small editar" data-id="${a.id}">✏</button>
                <button class="btn btn-small borrar" data-id="${a.id}">🗑</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  const form = document.getElementById("form-activo");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.nombre || !data.ticker || !data.tipo || !data.moneda) return alert("Faltan campos obligatorios");

    if (data.id) {
      await db.activos.update(Number(data.id), data);
    } else {
      await db.activos.add(data);
    }
    location.reload();
  });

  container.querySelectorAll(".borrar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      if (confirm("¿Eliminar este activo y sus transacciones?")) {
        await db.transacciones.where("activoId").equals(id).delete();
        await db.activos.delete(id);
        location.reload();
      }
    });
  });

  container.querySelectorAll(".editar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = Number(btn.dataset.id);
      const activo = await db.activos.get(id);
      if (activo) {
        form.nombre.value = activo.nombre;
        form.ticker.value = activo.ticker;
        form.tipo.value = activo.tipo;
        form.moneda.value = activo.moneda;
        form.id.value = activo.id;
        form.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}
