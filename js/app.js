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

// Versión de la aplicación y URL remota con la versión más reciente
const APP_VERSION = "1.0.0";
const REMOTE_VERSION_URL =
  "https://raw.githubusercontent.com/usuario/CarteraPro/main/version.json"; // cambia a tu repo

async function checkForUpdates() {
  try {
    const resp = await fetch(REMOTE_VERSION_URL, { cache: "no-store" });
    if (!resp.ok) return;
    const data = await resp.json();
    const last = localStorage.getItem("carteraPRO_version");
    if (data.version && data.version !== APP_VERSION) {
      if (last && last !== data.version) {
        alert("Nueva versión disponible. Actualizando...");
        if (navigator.serviceWorker) {
          const regs = await navigator.serviceWorker.getRegistrations();
          regs.forEach(r => r.update());
        }
        localStorage.setItem("carteraPRO_version", data.version);
        location.reload();
      } else {
        localStorage.setItem("carteraPRO_version", data.version);
      }
    }
  } catch (err) {
    console.warn("No se pudo comprobar actualizaciones", err);
  }
}

const vistas = {
  "#inicio": renderResumen,
  "#dashboard": renderDashboard,
  "#activos": renderActivos,
  "#transacciones": renderTransacciones,
  "#cuentas": renderCuentas,
  "#tiposcambio": renderTiposCambio,
  "#analisisvalue": renderAnalisisValue,
  "#resumen": renderResumen,
  "#ajustes": renderAjustes
};

// Datos de ejemplo para análisis fundamental offline
const datosValue = {
  "MSFT": {
    ticker: "MSFT",
    empresa: "Microsoft Corp.",
    sector: "Tecnología",
    descripcion: "Líder mundial en software y servicios cloud",
    precio: 330.22,
    per: 35.4,
    peg: 2.1,
    pb: 12.5,
    roe: 38.5,
    roic: 31.2,
    margen: 34.1,
    fcf: 64900,
    fcfYield: 2.8,
    deudaPatrimonio: 0.5,
    cashSh: 17.6,
    payout: 27,
    crecimiento5a: 14,
    moat: "Elevado",
    valorIntrinseco: 280,
    margenSeguridad: -18,
    opinion: "Precio por encima de valor intrínseco",
    conclusion: "Buffett diría que es una gran empresa pero cara"
  },
  "AAPL": {
    ticker: "AAPL",
    empresa: "Apple Inc.",
    sector: "Tecnología",
    descripcion: "Fabricante de iPhone, iPad y servicios",
    precio: 190.15,
    per: 29.1,
    peg: 2.5,
    pb: 47.2,
    roe: 175,
    roic: 55,
    margen: 25.3,
    fcf: 98800,
    fcfYield: 3.1,
    deudaPatrimonio: 1.7,
    cashSh: 3.9,
    payout: 15,
    crecimiento5a: 11,
    moat: "Marca y ecosistema",
    valorIntrinseco: 150,
    margenSeguridad: -27,
    opinion: "Cotizando muy por encima de valor razonable",
    conclusion: "Buffett mantiene, pero no compraría ahora"
  }
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
      <button id="btn-export-json" class="btn">Exportar JSON</button>
      <button id="btn-import-json" class="btn">Importar JSON</button>
      <input type="file" id="file-json" accept="application/json" style="display:none" />
    </div>`;

  document.getElementById('btn-export-json').onclick = async () => {
    const todas = {};
    for (const tabla of Object.keys(db.tablesByName)) {
      todas[tabla] = await db[tabla].toArray();
    }
    const blob = new Blob([JSON.stringify(todas, null, 2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `cartera-pro-datos-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  document.getElementById('btn-import-json').onclick = () => document.getElementById('file-json').click();
  document.getElementById('file-json').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      await db.delete();
      await db.open();
      for (const t of Object.keys(data)) {
        if (db[t]) await db[t].bulkPut(data[t]);
      }
      alert('Datos importados');
      location.hash = '#dashboard';
    } catch(err) {
      alert('Error al importar');
    }
  };
}

function renderCuentas() {
  db.cuentas.toArray().then(cuentas => {
    app.innerHTML = `
    <div class="card">
      <h2>Cuentas</h2>
      <form id="form-cuenta">
        <input name="nombre" placeholder="Nombre" required />
        <input name="banco" placeholder="Banco" required />
        <input name="tipo" placeholder="Tipo" value="Broker" required />
        <input name="saldo" type="number" step="0.01" placeholder="Saldo" value="0" required />
        <button class="btn">Guardar</button>
      </form>
      <ul>
        ${cuentas.map(c => `<li>${c.nombre} - ${c.saldo}€</li>`).join('')}
      </ul>
    </div>`;

    document.getElementById('form-cuenta').onsubmit = e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.saldo = parseFloat(data.saldo) || 0;
      db.cuentas.add(data).then(renderCuentas);
    };
  });
}

function renderTiposCambio() {
  db.tiposCambio.toArray().then(lista => {
    app.innerHTML = `
    <div class="card">
      <h2>Tipos de cambio</h2>
      <form id="form-cambio">
        <input name="moneda" placeholder="Moneda (ej. USD)" required />
        <input name="tasa" type="number" step="0.0001" placeholder="Tasa EUR" required />
        <button class="btn">Guardar</button>
      </form>
      <ul>
        ${lista.map(c => `<li>${c.moneda}: ${c.tasa}</li>`).join('')}
      </ul>
    </div>`;

    document.getElementById('form-cambio').onsubmit = e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      data.tasa = parseFloat(data.tasa) || 0;
      db.tiposCambio.put({moneda: data.moneda.toUpperCase(), tasa: data.tasa, fecha: new Date().toISOString().slice(0,10)}).then(renderTiposCambio);
    };
  });
}

function renderAnalisisValue() {
  app.innerHTML = `
  <div class="card">
    <h2>Análisis Value</h2>
    <p class="mini-explica">Datos locales de muestra, no se actualizan automáticamente.</p>
    <form id="form-value">
      <input name="ticker" placeholder="Ticker (ej. MSFT)" required />
      <button class="btn">Analizar</button>
    </form>
    <div id="resultado-value"></div>
    <div id="value-controls" style="display:none;margin-top:var(--gap-sm);">
      <button id="btn-copy-value" class="btn btn-secondary">Copiar Markdown</button>
      <button id="btn-export-value" class="btn btn-secondary">Exportar CSV</button>
    </div>
  </div>`;

  const form = document.getElementById('form-value');
  form.onsubmit = e => {
    e.preventDefault();
    const ticker = new FormData(form).get('ticker').toUpperCase().trim();
    const datos = datosValue[ticker];
    const cont = document.getElementById('resultado-value');
    if (!datos) {
      cont.innerHTML = `<p>No hay datos locales para "${ticker}".</p>`;
      document.getElementById('value-controls').style.display = 'none';
      return;
    }
    cont.innerHTML = generarTablaValue(datos);
    document.getElementById('value-controls').style.display = 'block';
  };

  document.getElementById('btn-copy-value').onclick = copiarMarkdownValue;
  document.getElementById('btn-export-value').onclick = () => {
    const tabla = document.querySelector('#resultado-value table');
    if (!tabla) return;
    const filas = [...tabla.querySelectorAll('tr')].map(r =>
      [...r.children].map(c => c.textContent.trim())
    );
    const encabezados = filas.shift();
    const data = filas.map(cols => Object.fromEntries(encabezados.map((h,i)=>[h,cols[i]])));
    exportarCSV(data, 'analisis-value.csv');
  };
}

function generarTablaValue(d) {
  return `
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Ticker</td><td>${d.ticker}</td></tr>
    <tr><td>Empresa</td><td>${d.empresa}</td></tr>
    <tr><td>Sector</td><td>${d.sector}</td></tr>
    <tr><td>Descripción</td><td>${d.descripcion}</td></tr>
    <tr><td>Precio actual</td><td>${d.precio}</td></tr>
    <tr><td>PER</td><td>${d.per}</td></tr>
    <tr><td>PEG</td><td>${d.peg}</td></tr>
    <tr><td>P/B</td><td>${d.pb}</td></tr>
    <tr><td>ROE</td><td>${d.roe}%</td></tr>
    <tr><td>ROIC</td><td>${d.roic}%</td></tr>
    <tr><td>Margen Neto</td><td>${d.margen}%</td></tr>
    <tr><td>FCF</td><td>${d.fcf}</td></tr>
    <tr><td>FCF Yield</td><td>${d.fcfYield}%</td></tr>
    <tr><td>Deuda / Patrimonio</td><td>${d.deudaPatrimonio}</td></tr>
    <tr><td>Cash/sh</td><td>${d.cashSh}</td></tr>
    <tr><td>Payout</td><td>${d.payout}%</td></tr>
    <tr><td>Crecimiento ingresos 5 años</td><td>${d.crecimiento5a}%</td></tr>
    <tr><td>Moat</td><td>${d.moat}</td></tr>
    <tr><td>Valor Intrínseco</td><td>${d.valorIntrinseco}</td></tr>
    <tr><td>Margen de seguridad</td><td>${d.margenSeguridad}%</td></tr>
    <tr><td>¿Interesante como value?</td><td>${d.opinion}</td></tr>
    <tr><td>Conclusión personal</td><td>${d.conclusion}</td></tr>
  </table>`;
}

function copiarMarkdownValue() {
  const tabla = document.querySelector('#resultado-value table');
  if (!tabla) return;
  const filas = [...tabla.querySelectorAll('tr')];
  const filasTexto = filas.map((tr, i) => {
    const celdas = [...tr.children].map(td => td.textContent.trim());
    let linea = `| ${celdas.join(' | ')} |`;
    if (i === 0) {
      const sep = `| ${celdas.map(() => '---').join(' | ')} |`;
      linea += `\n${sep}`;
    }
    return linea;
  }).join('\n');
  navigator.clipboard.writeText(filasTexto).then(() => alert('Copiado al portapapeles'));
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
  checkForUpdates();
});
