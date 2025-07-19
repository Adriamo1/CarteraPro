// app.js sin módulos, todo local
const db = new Dexie("CarteraPRODB");
db.version(1).stores({
  activos: "++id,nombre,ticker,tipo,moneda",
  transacciones: "++id,activoId,tipo,fecha,cantidad,precio,comision,broker",
  cuentas: "++id,nombre,banco,tipo,saldo",
  tiposCambio: "++id,moneda,tasa,fecha",
  ajustes: "clave,valor"
});

// Versión 2: movimientos de cuentas
db.version(2).stores({
  movimientos: "++id,cuentaId,fecha,importe,descripcion"
});

const app = document.getElementById("app");

function formatCurrency(num) {
  return Number(num || 0).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR'
  });
}

// --- Ajustes de usuario (tema, bancos, brokers...) ---
const SETTINGS_PREFIX = "carteraPRO_settings_";

function saveUserSetting(key, value) {
  localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
}

function getUserSetting(key) {
  const v = localStorage.getItem(SETTINGS_PREFIX + key);
  try { return v ? JSON.parse(v) : null; } catch { return null; }
}

function getBrokers() {
  return getUserSetting("brokers") || [
    "Trade Republic", "Revolut", "Binance", "DEGIRO",
    "MyInvestor", "Interactive Brokers"
  ];
}
function setBrokers(list) { saveUserSetting("brokers", list); }

function getBancos() {
  return getUserSetting("bancos") || [
    "BBVA", "CaixaBank", "Santander", "ING",
    "Openbank", "EVO", "Revolut"
  ];
}
function setBancos(list) { saveUserSetting("bancos", list); }

function setTema(tema) {
  localStorage.setItem(SETTINGS_PREFIX + "tema", tema);
  document.body.setAttribute("data-theme", tema);
}
function getTema() {
  return localStorage.getItem(SETTINGS_PREFIX + "tema") || "auto";
}

function setPrivacidad(val) {
  localStorage.setItem(SETTINGS_PREFIX + "privacidad", !!val);
}
function getPrivacidad() {
  return localStorage.getItem(SETTINGS_PREFIX + "privacidad") === "true";
}

function setIdioma(idioma) {
  localStorage.setItem(SETTINGS_PREFIX + "idioma", idioma);
}
function getIdioma() {
  return localStorage.getItem(SETTINGS_PREFIX + "idioma") || "es";
}

function setVista(seccion, modo) {
  localStorage.setItem(SETTINGS_PREFIX + "vista_" + seccion, modo);
}

function getVista(seccion) {
  return localStorage.getItem(SETTINGS_PREFIX + "vista_" + seccion) || "resumen";
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

async function calcularKpis() {
  const [activos, trans, cuentas] = await Promise.all([
    db.activos.toArray(),
    db.transacciones.toArray(),
    db.cuentas.toArray()
  ]);

  const valorActivos = activos.reduce((s, a) => s + (+a.valorActual || 0), 0);
  const saldoCuentas = cuentas.reduce((s, c) => s + (+c.saldo || 0), 0);
  const valorTotal = valorActivos + saldoCuentas;

  const compras = {}, ventas = {};
  trans.forEach(t => {
    const id = t.activoId;
    const importe = (+t.cantidad || 0) * (+t.precio || 0);
    if ((t.tipo || '').toLowerCase() === 'compra') {
      compras[id] = compras[id] || { cantidad: 0, coste: 0 };
      compras[id].cantidad += +t.cantidad || 0;
      compras[id].coste += importe + (+t.comision || 0);
    } else if ((t.tipo || '').toLowerCase() === 'venta') {
      ventas[id] = ventas[id] || { cantidad: 0, ingreso: 0 };
      ventas[id].cantidad += +t.cantidad || 0;
      ventas[id].ingreso += importe - (+t.comision || 0);
    }
  });

  let realized = 0, costeRestante = 0;
  activos.forEach(a => {
    const c = compras[a.id] || { cantidad: 0, coste: 0 };
    const v = ventas[a.id] || { cantidad: 0, ingreso: 0 };
    const avg = c.coste / (c.cantidad || 1);
    realized += v.ingreso - avg * v.cantidad;
    costeRestante += c.coste - avg * v.cantidad;
  });
  const unrealized = valorActivos - costeRestante;
  const rentTotal = realized + unrealized;

  const valorPorTipo = activos.reduce((acc, a) => {
    const val = +a.valorActual || 0;
    acc[a.tipo] = (acc[a.tipo] || 0) + val;
    return acc;
  }, {});

  return { valorTotal, rentTotal, realized, unrealized, valorPorTipo };
}

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
      <p class="mini-explica">Este es el resumen de tu cartera local. Desde aquí podrás conocer rápidamente el número de activos registrados y todas tus transacciones.</p>
    </div>`;
  });
}

async function renderDashboard() {
  const { valorTotal, rentTotal, realized, unrealized, valorPorTipo } = await calcularKpis();
  const porTipoHtml = Object.entries(valorPorTipo)
    .map(([t,v]) => `<div>${t}: ${formatCurrency(v)}</div>`).join('');
  app.innerHTML = `
    <h2>Panel de control</h2>
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div>
          <div>Valor Total</div>
          <div class="kpi-value">${formatCurrency(valorTotal)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📈</div>
        <div>
          <div>Rentabilidad Total</div>
          <div class="kpi-value ${rentTotal>=0?'kpi-positivo':'kpi-negativo'}">${formatCurrency(rentTotal)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💵</div>
        <div>
          <div>Realizada</div>
          <div class="kpi-value ${realized>=0?'kpi-positivo':'kpi-negativo'}">${formatCurrency(realized)}</div>
          <div>No realizada</div>
          <div class="kpi-value ${unrealized>=0?'kpi-positivo':'kpi-negativo'}">${formatCurrency(unrealized)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div>
          <div>Valor por tipo de activo</div>
          ${porTipoHtml}
        </div>
      </div>
    </div>
    <div class="card"><h3>P&L por activo</h3><canvas id="grafico-pnl" height="160"></canvas></div>
    <div class="card"><h3>Saveback y TIN</h3><canvas id="grafico-saveback" height="160"></canvas></div>
    <div class="card"><h3>Asignación actual vs objetivo</h3><canvas id="grafico-asignacion" height="160"></canvas></div>
    <div class="card"><h3>Distribución por divisa</h3><canvas id="grafico-divisa" height="160"></canvas></div>
    <div class="card"><h3>Distribución por sector</h3><canvas id="grafico-sector" height="160"></canvas></div>
    `;

  renderGraficosDashboard();
}

async function renderActivos() {
  const activos = await db.activos.toArray();
  const total = activos.length;
  const modo = getVista('activos');
  let html = `<div class="card">
      <h2>Activos</h2>
      <p class="mini-explica">Gestiona aquí los valores y productos en los que inviertes. Total registrados: ${total}.</p>
      <button id="toggle-activos" class="btn">${modo === 'detalle' ? 'Vista resumen' : 'Ver detalles'}</button>
      <form id="form-activo">
        <input name="nombre" placeholder="Nombre" required />
        <input name="ticker" placeholder="Ticker" required />
        <input name="tipo" placeholder="Tipo" required />
        <input name="moneda" placeholder="Moneda" value="EUR" required />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="exportar-activos">Exportar Activos (CSV)</button>
      </form>`;

  if (modo === 'resumen') {
      html += `<ul>${activos.map(a => `<li>${a.nombre} (${a.ticker})</li>`).join('')}</ul>`;
  } else {
      for (const a of activos) {
        const trans = await db.transacciones.where('activoId').equals(a.id).toArray();
        const filas = trans.map(t => `<tr>
            <td data-label="Fecha">${t.fecha}</td>
            <td data-label="Tipo" class="col-ocultar">${t.tipo}</td>
            <td data-label="Cant.">${t.cantidad}</td>
            <td data-label="Precio" class="col-ocultar">${t.precio}</td>
          </tr>`).join('');
        html += `<section class="detalle">
          <h3>${a.nombre}</h3>
          <table class="tabla-detalle responsive-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Cant.</th><th>Precio</th></tr></thead><tbody>${filas}</tbody></table>
          <canvas id="graf-act-${a.id}" height="120"></canvas>
        </section>`;
      }
  }
  html += '</div>';
  app.innerHTML = html;

  document.getElementById('toggle-activos').onclick = () => {
    setVista('activos', modo === 'detalle' ? 'resumen' : 'detalle');
    renderActivos();
  };

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

  if (modo === 'detalle') {
    for (const a of activos) {
      const trans = await db.transacciones.where('activoId').equals(a.id).toArray();
      const ctx = document.getElementById(`graf-act-${a.id}`).getContext('2d');
      const labels = trans.map(t => t.fecha);
      const datos = trans.map(t => (+t.cantidad || 0) * (+t.precio || 0) * (t.tipo.toLowerCase() === 'compra' ? -1 : 1));
      new Chart(ctx, {type:'bar', data:{labels,datasets:[{data:datos,backgroundColor:'#70c1b3'}]}, options:{plugins:{legend:{display:false}}, indexAxis:'y'}});
    }
  }
}

function renderTransacciones() {
  Promise.all([db.transacciones.toArray(), db.activos.toArray()]).then(([trans, activos]) => {
    const mapa = Object.fromEntries(activos.map(a => [a.id, a.nombre]));
    const total = trans.length;
    app.innerHTML = `
    <div class="card">
      <h2>Transacciones</h2>
      <p class="mini-explica">Aquí puedes registrar compras y ventas de tus activos. Total registradas: ${total}.</p>
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

async function renderCuentas() {
  const cuentas = await db.cuentas.toArray();
  const modo = getVista('cuentas');
  let html = `<div class="card">
      <h2>Cuentas</h2>
      <button id="toggle-cuentas" class="btn">${modo === 'detalle' ? 'Vista resumen' : 'Ver detalles'}</button>
      <form id="form-cuenta">
        <input name="nombre" placeholder="Nombre" required />
        <input name="banco" placeholder="Banco" required />
        <input name="tipo" placeholder="Tipo" value="corriente" required />
        <input name="saldo" placeholder="Saldo" type="number" step="any" value="0" required />
        <button class="btn">Guardar</button>
      </form>`;
  if (modo === 'resumen') {
      html += `<ul>${cuentas.map(c => `<li>${c.nombre} (${c.banco}) - ${c.saldo}€</li>`).join('')}</ul>`;
  } else {
      for (const c of cuentas) {
        const movs = await db.movimientos.where('cuentaId').equals(c.id).toArray();
        const filas = movs.map(m => `<tr>
            <td data-label="Fecha">${m.fecha}</td>
            <td data-label="Importe">${formatCurrency(m.importe)}</td>
            <td data-label="Concepto" class="col-ocultar">${m.descripcion||''}</td>
          </tr>`).join('');
        const interes = (c.saldo || 0) * 0.01;
        html += `<section class="detalle">
          <h3>${c.nombre}</h3>
          <table class="tabla-detalle responsive-table"><thead><tr><th>Fecha</th><th>Importe</th><th>Concepto</th></tr></thead><tbody>${filas}</tbody></table>
          <div class="mini-explica">Interés estimado: ${formatCurrency(interes)}</div>
        </section>`;
      }
  }
  html += '</div>';
  app.innerHTML = html;

  document.getElementById('toggle-cuentas').onclick = () => {
    setVista('cuentas', modo === 'detalle' ? 'resumen' : 'detalle');
    renderCuentas();
  };

  document.getElementById('form-cuenta').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.saldo = parseFloat(data.saldo);
    db.cuentas.add(data).then(renderCuentas);
  };
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
      }).map(([k,v])=>`<tr>
          <td data-label="Campo">${k}</td>
          <td data-label="Valor">${v}</td>
        </tr>`).join('');
      cont.innerHTML = `<table class="tabla-analisis responsive-table"><tbody>${filas}</tbody></table>
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
  const brokers = getBrokers();
  const bancos = getBancos();
  const tema = getTema();

  app.innerHTML = `
    <div class="card">
      <h2>Ajustes</h2>
      <p class="mini-explica">Configura la aplicación a tu gusto: idioma, tema y listados de bancos o brokers habituales.</p>

      <section>
        <h3>Brokers y Plataformas</h3>
        <textarea id="txt-brokers" rows="4" style="width:100%;">${brokers.join('\n')}</textarea>
        <button id="btn-save-brokers" class="btn">Guardar brokers</button>
      </section>

      <section>
        <h3>Bancos</h3>
        <textarea id="txt-bancos" rows="4" style="width:100%;">${bancos.join('\n')}</textarea>
        <button id="btn-save-bancos" class="btn">Guardar bancos</button>
      </section>

      <section>
        <h3>Tema de la aplicación</h3>
        <select id="sel-tema">
          <option value="auto" ${tema === 'auto' ? 'selected' : ''}>Automático (según sistema)</option>
          <option value="light" ${tema === 'light' ? 'selected' : ''}>Claro</option>
          <option value="dark" ${tema === 'dark' ? 'selected' : ''}>Oscuro</option>
        </select>
        <button id="btn-save-tema" class="btn">Guardar tema</button>
      </section>
    </div>`;

  document.getElementById('btn-save-brokers').onclick = () => {
    const nuevos = document.getElementById('txt-brokers').value.split('\n').map(s => s.trim()).filter(Boolean);
    setBrokers(nuevos);
    alert('Brokers guardados.');
  };

  document.getElementById('btn-save-bancos').onclick = () => {
    const nuevos = document.getElementById('txt-bancos').value.split('\n').map(s => s.trim()).filter(Boolean);
    setBancos(nuevos);
    alert('Bancos guardados.');
  };

  document.getElementById('btn-save-tema').onclick = () => {
    const nuevoTema = document.getElementById('sel-tema').value;
    setTema(nuevoTema);
    alert('Tema guardado. Recarga la página si no se aplica automáticamente.');
  };
}

// --------- Gráficos Dashboard ---------
async function calcularPnLPorActivo() {
  const [activos, trans] = await Promise.all([
    db.activos.toArray(),
    db.transacciones.toArray()
  ]);
  const compras = {}, ventas = {};
  trans.forEach(t => {
    const id = t.activoId;
    const imp = (+t.cantidad || 0) * (+t.precio || 0);
    if ((t.tipo || '').toLowerCase() === 'compra') {
      compras[id] = compras[id] || { c:0, coste:0 };
      compras[id].c += +t.cantidad || 0;
      compras[id].coste += imp + (+t.comision || 0);
    } else if ((t.tipo || '').toLowerCase() === 'venta') {
      ventas[id] = ventas[id] || { c:0, ing:0 };
      ventas[id].c += +t.cantidad || 0;
      ventas[id].ing += imp - (+t.comision || 0);
    }
  });
  return activos.map(a => {
    const c = compras[a.id] || { c:0, coste:0 };
    const v = ventas[a.id] || { c:0, ing:0 };
    const avg = c.coste / (c.c || 1);
    const realized = v.ing - avg * v.c;
    const restante = c.coste - avg * v.c;
    const valorActual = +a.valorActual || 0;
    const unrealized = valorActual - restante;
    return { nombre: a.nombre, pnl: realized + unrealized };
  });
}

async function datosSavebackTin() {
  const [movs, prestamos] = await Promise.all([
    db.movimientos.where('tipo').equals('saveback').toArray(),
    db.prestamos.toArray()
  ]);
  const porMes = {};
  movs.forEach(m => {
    const mes = (m.fecha || '').slice(0,7);
    porMes[mes] = (porMes[mes] || 0) + (+m.importe || 0);
  });
  const labels = Object.keys(porMes).sort();
  const saveData = labels.map(l => porMes[l]);
  const tin = prestamos[0]?.tin || 0;
  const tinData = labels.map(() => tin);
  return { labels, saveData, tinData };
}

async function distribucionPorCampo(campo) {
  const activos = await db.activos.toArray();
  const map = {};
  activos.forEach(a => {
    const key = a[campo] || 'Otro';
    map[key] = (map[key] || 0) + (+a.valorActual || 0);
  });
  const labels = Object.keys(map);
  const data = labels.map(l => map[l]);
  return { labels, data };
}

async function datosAsignacion() {
  const activos = await db.activos.toArray();
  const total = activos.reduce((s,a)=>s+(+a.valorActual||0),0);
  const porTipo = {};
  activos.forEach(a => {
    porTipo[a.tipo] = (porTipo[a.tipo] || 0) + (+a.valorActual || 0);
  });
  const labels = Object.keys(porTipo);
  const actual = labels.map(l => total ? porTipo[l]/total*100 : 0);
  const objetivoRef = { 'Acción':40, 'ETF':40, 'Cripto':20 };
  const objetivo = labels.map(l => objetivoRef[l] || 0);
  return { labels, actual, objetivo };
}

async function renderGraficosDashboard() {
  const pnl = await calcularPnLPorActivo();
  const ctxPnl = document.getElementById('grafico-pnl').getContext('2d');
  new Chart(ctxPnl, {
    type:'bar',
    data:{
      labels:pnl.map(p=>p.nombre),
      datasets:[{label:'P&L',data:pnl.map(p=>p.pnl), backgroundColor:'#26a69a'}]
    },
    options:{indexAxis:'y', plugins:{legend:{display:false}}}
  });

  const { labels:labS, saveData, tinData } = await datosSavebackTin();
  const ctxS = document.getElementById('grafico-saveback').getContext('2d');
  new Chart(ctxS, {
    type:'line',
    data:{labels:labS, datasets:[
      {label:'Saveback',data:saveData, borderColor:'#3f8edc', tension:0.2},
      {label:'TIN',data:tinData, borderColor:'#f39c12', tension:0.2}
    ]},
    options:{responsive:true}
  });

  const { labels:labA, actual, objetivo } = await datosAsignacion();
  const ctxA = document.getElementById('grafico-asignacion').getContext('2d');
  new Chart(ctxA, {
    type:'bar',
    data:{labels:labA, datasets:[
      {label:'Actual %',data:actual, backgroundColor:'#2063c2'},
      {label:'Objetivo %',data:objetivo, backgroundColor:'#e57373'}
    ]},
    options:{responsive:true}
  });

  const divisa = await distribucionPorCampo('moneda');
  const ctxD = document.getElementById('grafico-divisa').getContext('2d');
  new Chart(ctxD, {type:'doughnut', data:{labels:divisa.labels, datasets:[{data:divisa.data}]}, options:{responsive:true}});

  const sector = await distribucionPorCampo('sector');
  const ctxSec = document.getElementById('grafico-sector').getContext('2d');
  new Chart(ctxSec, {type:'doughnut', data:{labels:sector.labels, datasets:[{data:sector.data}]}, options:{responsive:true}});
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
  document.body.setAttribute('data-theme', getTema());
  navegar();
  window.addEventListener("hashchange", navegar);
  checkForUpdates();
});
