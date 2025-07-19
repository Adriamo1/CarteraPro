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
  "#cuentas": renderCuentas,
  "#tiposcambio": renderTiposCambio,
  "#analisisvalue": renderAnalisisValue,
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

function renderCuentas() {
  db.cuentas.toArray().then(cuentas => {
    app.innerHTML = `
    <div class="card">
      <h2>Cuentas</h2>
      <form id="form-cuenta">
        <input name="nombre" placeholder="Nombre" required />
        <input name="banco" placeholder="Banco" required />
        <input name="tipo" placeholder="Tipo" value="corriente" required />
        <input name="saldo" placeholder="Saldo" type="number" step="any" value="0" required />
        <button class="btn">Guardar</button>
      </form>
      <ul>
        ${cuentas.map(c => `<li>${c.nombre} (${c.banco}) - ${c.saldo}€</li>`).join("")}
      </ul>
    </div>`;

    document.getElementById('form-cuenta').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.saldo = parseFloat(data.saldo);
      db.cuentas.add(data).then(renderCuentas);
    };
  });
}

function renderTiposCambio() {
  db.tiposCambio.toArray().then(tipos => {
    app.innerHTML = `
    <div class="card">
      <h2>Tipos de cambio</h2>
      <form id="form-cambio">
        <input name="moneda" placeholder="Moneda" required />
        <input name="tasa" type="number" step="any" placeholder="Tasa" required />
        <input name="fecha" type="date" required />
        <button class="btn">Guardar</button>
      </form>
      <ul>
        ${tipos.map(t => `<li>${t.moneda}: ${t.tasa} (${t.fecha})</li>`).join("")}
      </ul>
    </div>`;

    document.getElementById('form-cambio').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.tasa = parseFloat(data.tasa);
      db.tiposCambio.add(data).then(renderTiposCambio);
    };
  });
}

async function analizarEmpresa(ticker) {
  const url = `https://query1.finance.yahoo.com/v11/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData,summaryProfile,price`;
  const res = await fetch(url);
  const json = await res.json();
  const r = json.quoteSummary?.result?.[0];
  if (!r) throw new Error('Sin datos');
  const d = {
    ticker,
    empresa: r.price?.longName || ticker,
    sector: r.summaryProfile?.sector || '',
    descripcion: r.summaryProfile?.longBusinessSummary || '',
    precioActual: r.price?.regularMarketPrice?.raw || 0,
    per: r.defaultKeyStatistics?.trailingPE?.raw || 0,
    peg: r.defaultKeyStatistics?.pegRatio?.raw || 0,
    pb: r.defaultKeyStatistics?.priceToBook?.raw || 0,
    roe: r.defaultKeyStatistics?.returnOnEquity?.raw || 0,
    roic: r.financialData?.returnOnAssets?.raw || 0,
    margenNeto: r.financialData?.profitMargins?.raw || 0,
    fcf: r.financialData?.freeCashflow?.raw || 0,
    fcfYield: r.financialData?.freeCashflow?.raw && r.price?.marketCap?.raw ? (r.financialData.freeCashflow.raw / r.price.marketCap.raw) * 100 : 0,
    deudaPatrimonio: r.financialData?.debtToEquity?.raw || 0,
    cashPorAccion: r.financialData?.totalCashPerShare?.raw || 0,
    payout: r.summaryDetail?.payoutRatio?.raw ? r.summaryDetail.payoutRatio.raw * 100 : 0,
    crecimientoIngresos5a: r.defaultKeyStatistics?.revenueGrowth?.raw ? r.defaultKeyStatistics.revenueGrowth.raw * 100 : 0
  };
  return d;
}

function renderAnalisisValue() {
  app.innerHTML = `
  <div class="card">
    <h2>Análisis Value</h2>
    <form id="form-analisis">
      <input name="ticker" placeholder="Ticker (ej. AAPL)" required />
      <button class="btn">Analizar</button>
    </form>
    <div id="resultado-analisis"></div>
  </div>`;

  document.getElementById('form-analisis').onsubmit = async e => {
    e.preventDefault();
    const ticker = e.target.ticker.value.trim().toUpperCase();
    if (!ticker) return;
    const cont = document.getElementById('resultado-analisis');
    cont.innerHTML = 'Cargando...';
    try {
      const datos = await analizarEmpresa(ticker);
      const filas = Object.entries({
        Ticker: datos.ticker,
        Empresa: datos.empresa,
        Sector: datos.sector,
        Descripción: datos.descripcion,
        'Precio actual': datos.precioActual,
        PER: datos.per,
        PEG: datos.peg,
        'P/B': datos.pb,
        ROE: datos.roe,
        ROIC: datos.roic,
        'Margen Neto': datos.margenNeto,
        FCF: datos.fcf,
        'FCF Yield': datos.fcfYield,
        'Deuda / Patrimonio': datos.deudaPatrimonio,
        'Cash/sh': datos.cashPorAccion,
        Payout: datos.payout,
        'Crecimiento ingresos 5 años': datos.crecimientoIngresos5a
      }).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
      cont.innerHTML = `<table class="tabla-analisis"><tbody>${filas}</tbody></table>
        <button id="exp-analisis" class="btn">Exportar CSV</button>
        <button id="copiar-md" class="btn">Copiar Markdown</button>`;
      document.getElementById('exp-analisis').onclick = () => exportarCSV([datos], `analisis-${ticker}.csv`);
      document.getElementById('copiar-md').onclick = () => {
        const md = Object.entries(datos).map(([k,v])=>`|${k}|${v}|`).join('\n');
        navigator.clipboard.writeText(md);
        alert('Copiado en formato Markdown');
      };
    } catch(err) {
      cont.textContent = 'No se pudo obtener datos';
    }
  };
}

async function checkForUpdates() {
  try {
    const resp = await fetch('version.json', {cache: 'no-store'});
    const data = await resp.json();
    const local = localStorage.getItem('carteraPRO_version');
    if (local && local !== data.version) {
      if (confirm(`Nueva versión ${data.version} disponible. ¿Recargar?`)) {
        localStorage.setItem('carteraPRO_version', data.version);
        location.reload(true);
      }
    } else {
      localStorage.setItem('carteraPRO_version', data.version);
    }
  } catch(e) {
    console.log('Sin conexión para comprobar actualizaciones');
  }
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
  checkForUpdates();
});
