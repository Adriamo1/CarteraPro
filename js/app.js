// app.js sin módulos, todo local
const db = new Dexie("CarteraPRODB");
db.version(1).stores({
  activos: "++id,nombre,ticker,tipo,moneda",
  transacciones: "++id,activoId,tipo,fecha,cantidad,precio,comision,broker",
  cuentas: "++id,nombre,banco,tipo,saldo",
  tiposCambio: "++id,moneda,tasa,fecha",
  ajustes: "clave,valor"
});

const app = document.getElementById("app");

const vistas = {
  "#inicio": renderResumen,
  "#dashboard": renderDashboard,
  "#activos": renderActivos,
  "#transacciones": renderTransacciones,
  "#cuentas": () => app.innerHTML = '<div class="card"><h2>Cuentas</h2><p>Pendiente...</p></div>',
  "#tiposcambio": () => app.innerHTML = '<div class="card"><h2>Tipos de cambio</h2><p>Pendiente...</p></div>',
  "#resumen": renderResumen,
  "#ajustes": renderAjustes
};

function navegar() {
  const hash = location.hash || "#dashboard";
  const render = vistas[hash];
  if (render) render();
  else app.innerHTML = `<div class="card"><h2>Error</h2><p>Ruta desconocida: ${hash}</p></div>`;
  document.querySelectorAll("aside a").forEach(a =>
    a.classList.toggle("active", a.getAttribute("href") === hash)
  );
}

// Vistas
function renderResumen() {
  Promise.all([db.activos.count(), db.transacciones.count()]).then(([a, t]) => {
    app.innerHTML = `
    <div class="card">
      <h2>Resumen general</h2>
      <div class="kpi-valor-total">
        <div class="kpi">🔹 Activos: ${a}</div>
        <div class="kpi">📈 Transacciones: ${t}</div>
      </div>
      <p class="mini-explica">Este es el resumen de tu cartera local.</p>
    </div>`;
  });
}

function renderDashboard() {
  Promise.all([
    db.activos.toArray(),
    db.transacciones.toArray(),
    db.cuentas.toArray()
  ]).then(([activos, trans, cuentas]) => {
    const valorTotal = activos.reduce((s, a) => s + (a.valorActual || 0), 0);
    const saldoTotal = cuentas.reduce((s, c) => s + (c.saldo || 0), 0);
    app.innerHTML = `
    <div class="card">
      <h2>Panel de control</h2>
      <p>💰 Valor total activos: ${valorTotal.toFixed(2)} €</p>
      <p>🏦 Saldo total cuentas: ${saldoTotal.toFixed(2)} €</p>
      <p>🔄 Transacciones: ${trans.length}</p>
    </div>`;
  });
}

function renderActivos() {
  db.activos.toArray().then(activos => {
    app.innerHTML = `
    <div class="card">
      <h2>Activos</h2>
      <form id="form-activo">
        <input name="nombre" placeholder="Nombre" required />
        <input name="ticker" placeholder="Ticker" required />
        <input name="tipo" placeholder="Tipo" required />
        <input name="moneda" placeholder="Moneda" value="EUR" required />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="exportar-activos">Exportar Activos (CSV)</button>
      </form>
      <ul>
        ${activos.map(a => `<li>${a.nombre} (${a.ticker})</li>`).join("")}
      </ul>
    </div>`;

    document.getElementById("form-activo").onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      db.activos.add(data).then(renderActivos);
    };

    document.getElementById("exportar-activos").onclick = async () => {
      const data = await db.activos.toArray();
      exportarCSV(data, "activos.csv");
    };
  });
}

function renderTransacciones() {
  Promise.all([db.transacciones.toArray(), db.activos.toArray()]).then(([trans, activos]) => {
    const mapa = Object.fromEntries(activos.map(a => [a.id, a.nombre]));
    app.innerHTML = `
    <div class="card">
      <h2>Transacciones</h2>
      <button class="btn" id="exportar-trans">Exportar Transacciones (CSV)</button>
      <ul>
        ${trans.map(t => `<li>${t.fecha} - ${t.tipo} ${t.cantidad} de ${mapa[t.activoId] || "?"} a ${t.precio}€</li>`).join("")}
      </ul>
    </div>`;

    document.getElementById("exportar-trans").onclick = async () => {
      const datos = await db.transacciones.toArray();
      exportarCSV(datos, "transacciones.csv");
    };
  });
}
function renderAjustes() {
  app.innerHTML = `
    <div class="card">
      <h2>Ajustes</h2>
      <p>Próximamente podrás cambiar configuración local, idioma, modo oscuro, etc.</p>
    </div>`;
}
// Exportar CSV
function exportarCSV(array, filename) {
  if (!array.length) return alert("No hay datos.");
  const encabezados = Object.keys(array[0]);
  const csv = [
    encabezados.join(";"),
    ...array.map(row => encabezados.map(k => JSON.stringify(row[k] ?? "")).join(";"))
  ].join("\\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

window.addEventListener("DOMContentLoaded", () => {
  navegar();
  window.addEventListener("hashchange", navegar);
});
