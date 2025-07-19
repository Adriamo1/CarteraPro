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

// Versión 3: tabla de préstamos (TIN de cuentas remuneradas o hipotecas)
db.version(3).stores({
  prestamos: "++id,tin"
});

// Versión 4: historial de TIN para cuentas remuneradas
db.version(4).stores({
  interestRates: "++id,fecha,tin"
});

const app = document.getElementById("app");
const state = {
  accountMovements: [],
  interestRates: [],
  settings: { lastExchangeUpdate: null }
};

// Cola simple para peticiones API secuenciales
const apiQueue = [];
function fetchExchangeRates(url) {
  return new Promise(resolve => {
    apiQueue.push({ url, resolve });
    processApiQueue();
  });
}

function processApiQueue() {
  if (processApiQueue.running || !apiQueue.length) return;
  processApiQueue.running = true;
  const { url, resolve } = apiQueue.shift();
  fetch(url)
    .then(r => r.json())
    .then(d => resolve(d))
    .catch(() => resolve(null))
    .finally(() => {
      if (/exchangerate/i.test(url)) {
        state.settings.lastExchangeUpdate = new Date().toISOString();
      }
      processApiQueue.running = false;
      processApiQueue();
    });
}

function formatCurrency(num) {
  if (getPrivacidad()) return '•••';
  return Number(num || 0).toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR'
  });
}

// --- Ajustes de usuario (tema, bancos, brokers...) ---
const ajustesCache = {};

async function initAjustes() {
  const all = await db.ajustes.toArray();
  for (const a of all) {
    try {
      ajustesCache[a.clave] = JSON.parse(a.valor);
    } catch {
      ajustesCache[a.clave] = a.valor;
    }
  }
}

function saveUserSetting(key, value) {
  ajustesCache[key] = value;
  db.ajustes.put({ clave: key, valor: JSON.stringify(value) });
}

function getUserSetting(key) {
  return ajustesCache[key] ?? null;
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
  saveUserSetting("tema", tema);
  document.body.setAttribute("data-theme", tema);
}
function getTema() {
  return getUserSetting("tema") || "auto";
}

function setPrivacidad(val) {
  saveUserSetting("privacidad", !!val);
}
function getPrivacidad() {
  return getUserSetting("privacidad") === true;
}

function setIdioma(idioma) {
  saveUserSetting("idioma", idioma);
}
function getIdioma() {
  return getUserSetting("idioma") || "es";
}

function setVista(seccion, modo) {
  saveUserSetting("vista_" + seccion, modo);
}

function getVista(seccion) {
  return getUserSetting("vista_" + seccion) || "resumen";
}

function setObjetivoRentabilidad(v) {
  saveUserSetting("objetivo_rent", parseFloat(v) || 0);
}

function getObjetivoRentabilidad() {
  return parseFloat(getUserSetting("objetivo_rent") || 0);
}

function setSavebackRate(v) {
  saveUserSetting("saveback", parseFloat(v) || 1);
}

function getSavebackRate() {
  return parseFloat(getUserSetting("saveback") || 1);
}

function setApiKeyAv(key) {
  saveUserSetting("api_key_av", key || "");
}

function getApiKeyAv() {
  return getUserSetting("api_key_av") || "";
}

function setTipoCambio(valor) {
  saveUserSetting("tipo_cambio", parseFloat(valor) || 1);
}

function getTipoCambio() {
  return parseFloat(getUserSetting("tipo_cambio") || 1);
}

const vistas = {
  "#inicio": renderResumen,
  "#dashboard": renderDashboard,
  "#activos": renderActivos,
  "#transacciones": renderTransacciones,
  "#cuentas": renderCuentas,
  "#prestamos": renderPrestamos,
  "#tiposcambio": renderTiposCambio,
  "#analisisvalue": renderAnalisisValue,
  "#info": renderInfo,
  "#resumen": renderResumen,
  "#ajustes": renderAjustes,
  "#view-settings": renderAjustes
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

async function calcularInteresMes() {
  const cuentas = await db.cuentas.where('tipo').equals('remunerada').toArray();
  if (!cuentas.length) return 0;
  if (!state.accountMovements.length) {
    state.accountMovements = await db.movimientos.toArray();
  }
  if (!state.interestRates.length) {
    state.interestRates = await db.interestRates.toArray();
  }
  const movs = state.accountMovements.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha));
  const rates = state.interestRates.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha));

  const hoy = new Date();
  const anyo = hoy.getFullYear();
  const mes = hoy.getMonth();
  const diasMes = hoy.getDate();
  const inicioMes = `${anyo}-${String(mes+1).padStart(2,'0')}-01`;

  let total = 0;
  for (const cuenta of cuentas) {
    let saldo = (+cuenta.saldo || 0) +
      movs.filter(m=>m.cuentaId==cuenta.id && m.fecha < inicioMes)
          .reduce((s,m)=>s+(+m.importe||0),0);
    for (let d=1; d<=diasMes; d++) {
      const fechaDia = `${anyo}-${String(mes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const rate = rates.filter(r=>r.fecha<=fechaDia).pop();
      const tin = rate ? parseFloat(rate.tin) : 0;
      total += saldo * (tin/100) / 365;
      movs.filter(m=>m.cuentaId==cuenta.id && m.fecha===fechaDia)
          .forEach(mov => { saldo += (+mov.importe||0); });
    }
  }
  return total;
}

async function totalSavebackPendiente() {
  if (!state.accountMovements.length) {
    state.accountMovements = await db.movimientos.toArray();
  }
  return state.accountMovements
    .filter(m => m.tipo === 'Saveback pendiente')
    .reduce((s, m) => s + (+m.importe || 0), 0);
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
  const interesMes = await calcularInteresMes();
  const savePend = await totalSavebackPendiente();
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
        <div class="kpi-icon">💶</div>
        <div>
          <div>Interés devengado (mes)</div>
          <div class="kpi-value">${formatCurrency(interesMes)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💳</div>
        <div>
          <div>Saveback pendiente</div>
          <div class="kpi-value">${formatCurrency(savePend)}</div>
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
        <button type="button" class="btn" id="importar-activos">Importar CSV/JSON</button>
        <button type="button" class="btn" id="btn-analisis-value">📊 Analizar empresa estilo Value</button>
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

  document.getElementById('importar-activos').onclick = () => {
    mostrarModalImportar();
  };

  document.getElementById('btn-analisis-value').onclick = () => {
    mostrarModalAnalisis();
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
      <button class="btn" id="add-trans">Añadir transacción</button>
      <button class="btn" id="exportar-trans">Exportar Transacciones (CSV)</button>
      <ul>
        ${trans.map(t => `<li>${t.fecha} - ${t.tipo} ${t.cantidad} de ${mapa[t.activoId] || "?"} a ${t.precio}€</li>`).join("")}
      </ul>
    </div>`;

    document.getElementById("exportar-trans").onclick = async () => {
      const datos = await db.transacciones.toArray();
      exportarCSV(datos, "transacciones.csv");
    };

    document.getElementById('add-trans').onclick = () => {
      mostrarModalTransaccion(activos);
    };
  });
}

async function renderCuentas() {
  const cuentas = await db.cuentas.toArray();
  const modo = getVista('cuentas');
  let html = `<div class="card">
      <h2>Cuentas</h2>
      <button id="toggle-cuentas" class="btn">${modo === 'detalle' ? 'Vista resumen' : 'Ver detalles'}</button>
      <button id="add-mov" class="btn">Añadir movimiento</button>
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

  document.getElementById('add-mov').onclick = () => {
    mostrarModalMovimiento(cuentas);
  };

  document.getElementById('form-cuenta').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.saldo = parseFloat(data.saldo);
    db.cuentas.add(data).then(renderCuentas);
  };
}

async function renderPrestamos() {
  const prestamos = await db.prestamos.toArray();
  let html = `<div class="card">
      <h2>Préstamos</h2>
      <form id="form-prestamo">
        <input name="tin" type="number" step="any" placeholder="TIN %" required />
        <button class="btn">Guardar</button>
      </form>
      <ul>${prestamos.map(p => `<li>${p.tin}%</li>`).join('')}</ul>
    </div>`;
  app.innerHTML = html;
  document.getElementById('form-prestamo').onsubmit = e => {
    e.preventDefault();
    const tin = parseFloat(e.target.tin.value);
    db.prestamos.add({ tin }).then(renderPrestamos);
  };
}

function renderTiposCambio() {
  db.tiposCambio.toArray().then(tipos => {
    app.innerHTML = `
    <div class="card">
      <h2>Tipos de cambio</h2>
      <div class="mini-explica" id="last-update-tc">Última actualización: ${state.settings.lastExchangeUpdate ? new Date(state.settings.lastExchangeUpdate).toLocaleString() : 'N/A'}</div>
      <button id="refresh-tc" class="btn">Refrescar tasas</button>
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

    document.getElementById('refresh-tc').onclick = async () => {
      const data = await fetchExchangeRates('https://api.exchangerate.host/latest?base=EUR');
      if (data && data.rates) {
        const fecha = data.date || new Date().toISOString().slice(0,10);
        const registros = Object.entries(data.rates).map(([moneda, tasa]) => ({
          moneda,
          tasa: parseFloat(tasa),
          fecha
        }));
        await db.tiposCambio.bulkAdd(registros);
        alert('Tasas actualizadas');
        renderTiposCambio();
      } else {
        alert('No se pudieron obtener las tasas');
      }
    };
  });
}

function recomendacionBuffett(d) {
  let score = 0;
  if (d.per > 0 && d.per < 15) score++;
  if (d.roe > 15) score++;
  if (d.fcfYield > 5) score++;
  if (d.deudaPatrimonio < 100) score++;
  if (score >= 3) return 'Comprar';
  if (score === 2) return 'Mantener';
  return 'Vender';
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
  d.moat = (d.roe > 15 && d.roic > 10) ? 'Amplio' : 'Reducido';
  if (d.fcfYield > 0) {
    d.valorBuffett = +(d.precioActual * (10 / d.fcfYield)).toFixed(2);
    d.margenSeguridad = +((1 - d.precioActual / d.valorBuffett) * 100).toFixed(2);
  } else {
    d.valorBuffett = 0;
    d.margenSeguridad = 0;
  }
  d.recomendacion = recomendacionBuffett(d);
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
        'P/B': datos.pb,
        ROE: datos.roe,
        ROIC: datos.roic,
        FCF: datos.fcf,
        'FCF Yield': datos.fcfYield,
        Payout: datos.payout,
        'Crecimiento 5 años': datos.crecimientoIngresos5a,
        'Deuda / Patrimonio': datos.deudaPatrimonio,
        Moat: datos.moat,
        'Valoración Buffett': datos.valorBuffett,
        'Margen de seguridad (%)': datos.margenSeguridad,
        Recomendación: datos.recomendacion
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
    const remote = await fetch(
      'https://raw.githubusercontent.com/adrianmonge/CarteraPro/main/version.json',
      { cache: 'no-store' }
    ).then(r => r.json()).catch(() => null);
    if (remote) saveUserSetting('latest_version', remote);

    const resp = await fetch('version.json', { cache: 'no-store' });
    const data = await resp.json();
    saveUserSetting('version_info', data);
    saveUserSetting('version', data.version);

    if (remote && remote.version !== data.version) {
      if (confirm(`Nueva versión ${remote.version} disponible. ¿Abrir GitHub?`)) {
        window.open('https://github.com/adrianmonge/CarteraPro', '_blank');
      }
    }
  } catch(e) {
    console.log('Sin conexión para comprobar actualizaciones');
  }
}
function renderAjustes() {
  const brokers = getBrokers();
  const bancos = getBancos();
  const tema = getTema();
  const idioma = getIdioma();
  const privacidad = getPrivacidad();
  const objetivo = getObjetivoRentabilidad();
  const saveRate = getSavebackRate();
  const apiKey = getApiKeyAv();
  const tipoCambio = getTipoCambio();

  app.innerHTML = `
    <div class="card" id="view-settings">
      <h2>Ajustes</h2>
      <p class="mini-explica">Configura la aplicación: idioma, tema, objetivos y tus listas habituales.</p>

      <section>
        <h3>Idioma</h3>
        <select id="language-select">
          <option value="es" ${idioma === 'es' ? 'selected' : ''}>Español</option>
          <option value="en" ${idioma === 'en' ? 'selected' : ''}>English</option>
          <option value="fr" ${idioma === 'fr' ? 'selected' : ''}>Français</option>
          <option value="it" ${idioma === 'it' ? 'selected' : ''}>Italiano</option>
        </select>
        <button id="btn-save-idioma" class="btn">Guardar idioma</button>
      </section>

      <section>
        <h3>Tema</h3>
        <select id="theme-select">
          <option value="auto" ${tema === 'auto' ? 'selected' : ''}>Sistema</option>
          <option value="light" ${tema === 'light' ? 'selected' : ''}>Claro</option>
          <option value="dark" ${tema === 'dark' ? 'selected' : ''}>Oscuro</option>
        </select>
        <button id="btn-save-tema" class="btn">Guardar tema</button>
      </section>

      <section>
        <h3>Objetivo anual de rentabilidad (%)</h3>
        <input type="number" id="profit-goal" step="any" value="${objetivo}">
        <button id="btn-save-profit" class="btn">Guardar objetivo</button>
      </section>

      <section>
        <h3>Brokers</h3>
        <textarea id="brokers-list" rows="4" style="width:100%;">${brokers.join('\n')}</textarea>
        <button id="btn-save-brokers" class="btn">Guardar brokers</button>
      </section>

      <section>
        <h3>Bancos</h3>
        <textarea id="banks-list" rows="4" style="width:100%;">${bancos.join('\n')}</textarea>
        <button id="btn-save-bancos" class="btn">Guardar bancos</button>
      </section>

      <section>
        <h3>Saveback %</h3>
        <input type="number" id="saveback-rate" step="any" value="${saveRate}">
        <button id="btn-save-saveback" class="btn">Guardar Saveback</button>
      </section>

      <section>
        <h3>Tipo de cambio base</h3>
        <input type="number" id="tipo-cambio" step="any" value="${tipoCambio}">
        <button id="btn-save-tc" class="btn">Guardar tipo de cambio</button>
      </section>

      <section>
        <h3>API Key Alpha Vantage</h3>
        <input id="api-key-av" type="text" value="${apiKey}">
        <button id="btn-save-api" class="btn">Guardar clave</button>
      </section>

      <section>
        <h3>Modo privacidad</h3>
        <label><input type="checkbox" id="chk-privacidad" ${privacidad ? 'checked' : ''}/> Ocultar cantidades</label>
        <button id="btn-save-privacidad" class="btn">Guardar privacidad</button>
      </section>
    </div>`;

  document.getElementById('btn-save-brokers').onclick = () => {
    const nuevos = document.getElementById('brokers-list').value.split('\n').map(s => s.trim()).filter(Boolean);
    setBrokers(nuevos);
    alert('Brokers guardados.');
  };

  document.getElementById('btn-save-bancos').onclick = () => {
    const nuevos = document.getElementById('banks-list').value.split('\n').map(s => s.trim()).filter(Boolean);
    setBancos(nuevos);
    alert('Bancos guardados.');
  };

  document.getElementById('btn-save-tema').onclick = () => {
    const nuevoTema = document.getElementById('theme-select').value;
    setTema(nuevoTema);
    alert('Tema guardado. Recarga la página si no se aplica automáticamente.');
  };

  document.getElementById('btn-save-idioma').onclick = () => {
    const nuevoIdioma = document.getElementById('language-select').value;
    setIdioma(nuevoIdioma);
    alert('Idioma guardado.');
  };

  document.getElementById('btn-save-profit').onclick = () => {
    const val = document.getElementById('profit-goal').value;
    setObjetivoRentabilidad(val);
    alert('Objetivo guardado');
  };

  document.getElementById('btn-save-saveback').onclick = () => {
    const val = document.getElementById('saveback-rate').value;
    setSavebackRate(val);
    alert('Saveback guardado');
  };

  document.getElementById('btn-save-tc').onclick = () => {
    const val = document.getElementById('tipo-cambio').value;
    setTipoCambio(val);
    alert('Tipo de cambio guardado');
  };

  document.getElementById('btn-save-api').onclick = () => {
    const val = document.getElementById('api-key-av').value.trim();
    setApiKeyAv(val);
    alert('Clave guardada');
  };

  document.getElementById('btn-save-privacidad').onclick = () => {
    const activo = document.getElementById('chk-privacidad').checked;
    setPrivacidad(activo);
    alert('Preferencia de privacidad guardada.');
  };
}

function renderInfo() {
  app.innerHTML = `<div class="card"><h2>Información</h2><div id="info-cont">Cargando...</div></div>`;
  const mostrar = (local, remote) => {
    const fecha = local.date || '';
    const ultima = remote ? remote.version : (getUserSetting('latest_version')?.version || '');
    document.getElementById('info-cont').innerHTML = `
      <p>Versión actual: ${local.version}</p>
      <p>Última versión disponible: <span id="ultima-version">${ultima}</span></p>
      <p>Fecha: ${fecha}</p>
      <p>Creado por <a href="https://www.adrianmonge.es" target="_blank" rel="noopener">Adrián Monge</a></p>
      <p><a href="https://github.com/adrianmonge/CarteraPro" target="_blank" rel="noopener">Repositorio del proyecto</a></p>`;
  };

  const promRemote = fetch(
    'https://raw.githubusercontent.com/adrianmonge/CarteraPro/main/version.json',
    { cache: 'no-store' }
  ).then(r => r.json()).catch(() => null);

  const local = getUserSetting('version_info');
  if (local) {
    promRemote.then(r => { if (r) saveUserSetting('latest_version', r); mostrar(local, r); });
  } else {
    fetch('version.json', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        saveUserSetting('version_info', d);
        promRemote.then(r => { if (r) saveUserSetting('latest_version', r); mostrar(d, r); });
      })
      .catch(() => {
        document.getElementById('info-cont').textContent = 'No disponible';
      });
  }
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

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  if (!rows.length) return [];
  const headers = rows.shift().split(/[,;]\s*/).map(h => h.trim());
  return rows.filter(Boolean).map(line => {
    const cols = line.split(/[,;]\s*/);
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (cols[i] || '').trim());
    return obj;
  });
}

// ----- Modal Movimientos -----
function crearModalMovimiento() {
  if (document.getElementById('mov-modal')) return;
  const div = document.createElement('div');
  div.id = 'mov-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nuevo movimiento</h3>
      <form id="form-mov">
        <select id="sel-cuenta" name="cuentaId" required></select>
        <input type="date" name="fecha" required />
        <input type="number" step="any" name="importe" placeholder="Importe" required />
        <select name="tipo" id="sel-tipo">
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
          <option value="Gasto Tarjeta">Gasto Tarjeta</option>
        </select>
        <input name="descripcion" placeholder="Concepto" />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-mov">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

async function mostrarModalMovimiento(cuentas) {
  crearModalMovimiento();
  const modal = document.getElementById('mov-modal');
  const lista = document.getElementById('sel-cuenta');
  lista.innerHTML = cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-mov').onclick = () => {
    modal.classList.add('hidden');
  };

  modal.querySelector('#form-mov').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.cuentaId = parseInt(data.cuentaId);
    data.importe = parseFloat(data.importe);
    const cuenta = await db.cuentas.get(data.cuentaId);
    const mov = {
      cuentaId: data.cuentaId,
      fecha: data.fecha,
      importe: data.importe,
      descripcion: data.descripcion || '',
      tipo: data.tipo
    };
    const id = await db.movimientos.add(mov);
    mov.id = id;
    state.accountMovements.push(mov);
    await db.cuentas.update(data.cuentaId, { saldo: (+cuenta.saldo || 0) + data.importe });

    if (data.tipo === 'Gasto Tarjeta') {
      const porcentaje = getSavebackRate();
      const importeSave = Math.abs(data.importe) * (porcentaje / 100);
      const movSave = {
        cuentaId: data.cuentaId,
        fecha: data.fecha,
        importe: importeSave,
        descripcion: 'Saveback pendiente',
        tipo: 'Saveback pendiente'
      };
      const id2 = await db.movimientos.add(movSave);
      movSave.id = id2;
      state.accountMovements.push(movSave);
    }

    modal.classList.add('hidden');
    renderCuentas();
    if (location.hash === '#dashboard') {
      renderDashboard();
    }
  };
}

// ----- Modal Transacciones -----
function crearModalTransaccion() {
  if (document.getElementById('transaction-modal')) return;
  const div = document.createElement('div');
  div.id = 'transaction-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nueva transacción</h3>
      <form id="form-transaccion">
        <select name="activoId" id="sel-activo" required></select>
        <select name="tipo" required>
          <option value="compra">Compra</option>
          <option value="venta">Venta</option>
        </select>
        <input type="date" name="fecha" required />
        <input type="number" step="any" name="cantidad" placeholder="Cantidad" required />
        <input type="number" step="any" name="precio" id="inp-precio" placeholder="Precio" required />
        <button type="button" class="btn" id="btn-precio">📈 Obtener precio actual</button>
        <div id="currency-info" class="mini-explica"></div>
        <input type="number" step="any" name="comision" id="inp-comision" placeholder="Comisión" value="0" />
        <input name="broker" id="inp-broker" list="lista-brokers" placeholder="Broker" />
        <datalist id="lista-brokers"></datalist>
        <div id="rate-info" class="mini-explica"></div>
        <div id="total-eur" class="mini-explica"></div>
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-trans">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

async function mostrarModalTransaccion(activos) {
  crearModalTransaccion();
  const modal = document.getElementById('transaction-modal');
  const lista = document.getElementById('sel-activo');
  lista.innerHTML = activos.map(a => `<option value="${a.id}" data-ticker="${a.ticker}" data-moneda="${a.moneda}" data-tipo="${a.tipo}">${a.nombre}</option>`).join('');
  const brokers = getBrokers();
  const dl = document.getElementById('lista-brokers');
  dl.innerHTML = brokers.map(b => `<option value="${b}">`).join('');
  modal.classList.remove('hidden');

  const precioEl = document.getElementById('inp-precio');
  const cantEl = modal.querySelector('[name="cantidad"]');
  const comEl = document.getElementById('inp-comision');
  const totalEl = document.getElementById('total-eur');
  const curEl = document.getElementById('currency-info');
  const rateEl = document.getElementById('rate-info');
  const btnPrecio = document.getElementById('btn-precio');
  let currentTc = 1;

  async function actualizarPrecio() {
    const opt = lista.selectedOptions[0];
    if (!opt) return;
    const ticker = opt.dataset.ticker;
    const tipo = opt.dataset.tipo || '';
    const moneda = opt.dataset.moneda || 'EUR';
    const info = await obtenerPrecioYMoneda(ticker, tipo, moneda, parseFloat(precioEl.value));
    precioEl.value = info.precio;
    precioEl.dataset.moneda = info.moneda;
    curEl.textContent = `Divisa: ${info.moneda}`;
    currentTc = await obtenerTipoCambio(info.moneda);
    rateEl.textContent = `TC aplicado: ${currentTc}`;
    calcularTotal(currentTc);
  }

  function calcularTotal(tc) {
    const cant = parseFloat(cantEl.value) || 0;
    const precio = parseFloat(precioEl.value) || 0;
    const com = parseFloat(comEl.value) || 0;
    const total = cant * precio * (tc || 1) + com;
    totalEl.textContent = `Total EUR aprox.: ${formatCurrency(total)}`;
  }

  lista.onchange = actualizarPrecio;
  btnPrecio.onclick = actualizarPrecio;
  cantEl.oninput = () => calcularTotal(currentTc);
  precioEl.oninput = () => calcularTotal(currentTc);
  comEl.oninput = () => calcularTotal(currentTc);

  actualizarPrecio();

  modal.querySelector('#cancel-trans').onclick = () => {
    modal.classList.add('hidden');
  };

  modal.querySelector('#form-transaccion').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.cantidad = parseFloat(data.cantidad);
    data.precio = parseFloat(data.precio);
    data.comision = parseFloat(data.comision) || 0;
    db.transacciones.add(data).then(() => {
      modal.classList.add('hidden');
      renderTransacciones();
    });
  };
}

// ----- Modal Análisis Value -----
function crearModalAnalisis() {
  if (document.getElementById('analisis-modal')) return;
  const div = document.createElement('div');
  div.id = 'analisis-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Análisis Value</h3>
      <form id="form-analisis-modal">
        <input name="ticker" placeholder="Ticker o ID" required />
        <button class="btn">Analizar</button>
        <button type="button" class="btn" id="cancel-analisis">Cerrar</button>
      </form>
      <div id="analisis-res"></div>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalAnalisis() {
  crearModalAnalisis();
  const modal = document.getElementById('analisis-modal');
  const form = document.getElementById('form-analisis-modal');
  const res = document.getElementById('analisis-res');
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-analisis').onclick = () => {
    modal.classList.add('hidden');
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const ticker = form.ticker.value.trim().toUpperCase();
    if (!ticker) return;
    res.textContent = 'Cargando...';
    try {
      const datos = await analizarEmpresa(ticker);
      const filas = Object.entries({
        Ticker: datos.ticker,
        Empresa: datos.empresa,
        Sector: datos.sector,
        'Precio actual': datos.precioActual,
        PER: datos.per,
        'P/B': datos.pb,
        ROE: datos.roe,
        ROIC: datos.roic,
        FCF: datos.fcf,
        'FCF Yield': datos.fcfYield,
        Payout: datos.payout,
        'Crecimiento 5 años': datos.crecimientoIngresos5a,
        'Deuda / Patrimonio': datos.deudaPatrimonio,
        Moat: datos.moat,
        'Valoración Buffett': datos.valorBuffett,
        'Margen de seguridad (%)': datos.margenSeguridad,
        Recomendación: datos.recomendacion
      }).map(([k,v])=>`<tr><td data-label="Campo">${k}</td><td data-label="Valor">${v}</td></tr>`).join('');
      res.innerHTML = `<table class="tabla-analisis responsive-table"><tbody>${filas}</tbody></table>
        <button id="exp-analisis-modal" class="btn">Exportar CSV</button>
        <button id="copiar-md-modal" class="btn">Copiar Markdown</button>`;
      document.getElementById('exp-analisis-modal').onclick = () => exportarCSV([datos], `analisis-${ticker}.csv`);
      document.getElementById('copiar-md-modal').onclick = () => {
        const md = Object.entries(datos).map(([k,v])=>`|${k}|${v}|`).join('\n');
        navigator.clipboard.writeText(md);
        alert('Copiado en formato Markdown');
      };
    } catch {
      res.textContent = 'No se pudo obtener datos';
    }
  };
}

// ----- Modal Importación de datos -----
function crearModalImportar() {
  if (document.getElementById('import-modal')) return;
  const div = document.createElement('div');
  div.id = 'import-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Importar Datos</h3>
      <input type="file" id="file-import" accept=".csv,.json" />
      <div id="import-res" class="mini-explica"></div>
      <div id="import-list"></div>
      <button id="confirm-import" class="btn">Guardar</button>
      <button type="button" class="btn" id="cancel-import">Cancelar</button>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalImportar() {
  crearModalImportar();
  const modal = document.getElementById('import-modal');
  const inp = document.getElementById('file-import');
  const res = document.getElementById('import-res');
  const list = document.getElementById('import-list');
  let nuevosActivos = [];
  let nuevasTrans = [];
  modal.classList.remove('hidden');

  inp.onchange = async () => {
    res.textContent = '';
    list.innerHTML = '';
    nuevosActivos = [];
    nuevasTrans = [];
    const file = inp.files[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        data = parseCSV(text);
      }
    } catch {
      res.textContent = 'Archivo no válido';
      return;
    }

    let activosRaw = [], transRaw = [];
    if (Array.isArray(data)) {
      if (data[0] && (data[0].fecha || data[0].tipo === 'compra' || data[0].tipo === 'venta')) {
        transRaw = data;
      } else {
        activosRaw = data;
      }
    } else if (data && typeof data === 'object') {
      activosRaw = Array.isArray(data.activos) ? data.activos : activosRaw;
      transRaw = Array.isArray(data.transacciones) ? data.transacciones : transRaw;
    }

  const existentes = await db.activos.toArray();
  const mapaTickerId = {};
  existentes.forEach(a => mapaTickerId[(a.ticker || '').toUpperCase()] = a.id);
  const tickersUsados = new Set(Object.keys(mapaTickerId));
  const avisos = [];
  const transKeySet = new Set();

    activosRaw.forEach((row,i) => {
      const nombre = (row.nombre || '').trim();
      const tkr = (row.ticker || '').trim().toUpperCase();
      if (!nombre || !tkr) {
        avisos.push(`Línea ${i+1} de activos: campos incompletos`);
        return;
      }
      if (tickersUsados.has(tkr)) {
        avisos.push(`Línea ${i+1} de activos: duplicado ${tkr}`);
        return;
      }
      tickersUsados.add(tkr);
      nuevosActivos.push({
        nombre,
        ticker: tkr,
        tipo: row.tipo || '',
        moneda: row.moneda || 'EUR',
        sector: row.sector || 'Desconocido'
      });
    });

    transRaw.forEach((row,i) => {
      const tkr = (row.ticker || '').trim().toUpperCase();
      const id = parseInt(row.activoId);
      if (!tkr && !id) {
        avisos.push(`Línea ${i+1} de transacciones: falta activo`);
        return;
      }
      if (!row.tipo || !row.fecha) {
        avisos.push(`Línea ${i+1} de transacciones: campos incompletos`);
        return;
      }
      const clave = `${id||tkr}-${row.tipo}-${row.fecha}-${row.cantidad}`;
      if (transKeySet.has(clave)) {
        avisos.push(`Línea ${i+1} de transacciones: duplicada`);
        return;
      }
      transKeySet.add(clave);
      nuevasTrans.push({
        ticker: tkr,
        activoId: id || null,
        tipo: row.tipo,
        fecha: row.fecha,
        cantidad: parseFloat(row.cantidad || 0),
        precio: parseFloat(row.precio || 0),
        comision: parseFloat(row.comision || 0),
        broker: row.broker || ''
      });
    });

    const activosPreview = nuevosActivos.map(n => `<div>${n.nombre} (${n.ticker})</div>`).join('');
    const transPreview = nuevasTrans.slice(0,5).map(t => `<div>${t.fecha} ${t.tipo} ${t.cantidad} ${t.ticker||('#'+t.activoId)}</div>`).join('');
    list.innerHTML = activosPreview + (transPreview ? `<h4>Transacciones</h4>${transPreview}` : '');
    if (avisos.length) list.innerHTML += `<div class="mini-explica kpi-negativo">${avisos.join('<br>')}</div>`;
    res.textContent = `${nuevosActivos.length} nuevos activos - ${nuevasTrans.length} transacciones`;
  };

  modal.querySelector('#confirm-import').onclick = async () => {
    try {
      const tickerId = {};
      for (const act of nuevosActivos) {
        const id = await db.activos.add(act);
        tickerId[act.ticker.toUpperCase()] = id;
      }
      for (const t of nuevasTrans) {
        let actId = t.activoId;
        if (!actId && t.ticker) {
          actId = tickerId[t.ticker.toUpperCase()] || (await db.activos.where('ticker').equalsIgnoreCase(t.ticker).first())?.id;
        }
        if (!actId) continue;
        await db.transacciones.add({
          activoId: actId,
          tipo: t.tipo,
          fecha: t.fecha,
          cantidad: t.cantidad,
          precio: t.precio,
          comision: t.comision,
          broker: t.broker
        });
      }
      modal.classList.add('hidden');
      renderActivos();
    } catch (e) {
      res.textContent = 'Error al importar: ' + e.message;
    }
  };

  modal.querySelector('#cancel-import').onclick = () => {
    modal.classList.add('hidden');
  };
}

async function obtenerPrecioYMoneda(ticker, tipo, moneda, manual) {
  try {
    if ((tipo || '').toLowerCase() === 'cripto') {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ticker.toLowerCase()}&vs_currencies=${moneda.toLowerCase()}`;
      const data = await fetchExchangeRates(url);
      const precio = data?.[ticker.toLowerCase()]?.[moneda.toLowerCase()];
      if (precio) return { precio, moneda };
    } else {
      const key = getApiKeyAv();
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${key}`;
      const data = await fetchExchangeRates(url);
      const precio = parseFloat(data?.['Global Quote']?.['05. price']);
      if (precio) return { precio, moneda };
    }
  } catch {}
  return { precio: manual || 0, moneda };
}

async function obtenerTipoCambio(moneda) {
  if (moneda === 'EUR') return 1;
  const rates = getUserSetting('exchangeRates') || {};
  if (rates[moneda]) return parseFloat(rates[moneda]);
  const reg = await db.tiposCambio.where('moneda').equals(moneda).last();
  if (reg) return parseFloat(reg.tasa || 1);
  return getTipoCambio();
}

window.addEventListener("DOMContentLoaded", async () => {
  await initAjustes();
  state.accountMovements = await db.movimientos.toArray();
  state.interestRates = await db.interestRates.toArray();
  document.body.setAttribute('data-theme', getTema());
  navegar();
  window.addEventListener("hashchange", navegar);
  checkForUpdates();
});
