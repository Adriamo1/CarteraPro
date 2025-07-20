// app.js sin módulos, todo local
const db = window.db;

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
  return db.ajustes.put({ clave: key, valor: JSON.stringify(value) });
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
function setBrokers(list) { return saveUserSetting("brokers", list); }

function getBancos() {
  return getUserSetting("bancos") || [
    "BBVA", "CaixaBank", "Santander", "ING",
    "Openbank", "EVO", "Revolut"
  ];
}
function setBancos(list) { return saveUserSetting("bancos", list); }

function setTema(tema) {
  document.body.setAttribute("data-theme", tema);
  return saveUserSetting("tema", tema);
}
function getTema() {
  return getUserSetting("tema") || "auto";
}

function setPrivacidad(val) {
  return saveUserSetting("privacidad", !!val);
}
function getPrivacidad() {
  return getUserSetting("privacidad") === true;
}

function setIdioma(idioma) {
  return saveUserSetting("idioma", idioma);
}
function getIdioma() {
  return getUserSetting("idioma") || "es";
}

function setVista(seccion, modo) {
  return saveUserSetting("vista_" + seccion, modo);
}

function getVista(seccion) {
  return getUserSetting("vista_" + seccion) || "resumen";
}

function setObjetivoRentabilidad(v) {
  return saveUserSetting("objetivo_rent", parseFloat(v) || 0);
}

function getObjetivoRentabilidad() {
  return parseFloat(getUserSetting("objetivo_rent") || 0);
}

function setSavebackRate(v) {
  return saveUserSetting("saveback", parseFloat(v) || 1);
}

function getSavebackRate() {
  return parseFloat(getUserSetting("saveback") || 1);
}

function setApiKeyAv(key) {
  return saveUserSetting("api_key_av", key || "");
}

function getApiKeyAv() {
  return getUserSetting("api_key_av") || "";
}

function setTipoCambio(valor) {
  return saveUserSetting("tipo_cambio", parseFloat(valor) || 1);
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

// Impacto total de divisa según tipo de cambio de compra vs actual
async function calcularEfectoDivisa() {
  const [activos, trans] = await Promise.all([
    db.activos.toArray(),
    db.transacciones.toArray()
  ]);
  let impacto = 0;
  for (const a of activos) {
    if (a.moneda && a.moneda !== 'EUR') {
      const compras = trans.filter(t => t.activoId === a.id && (t.tipo || '').toLowerCase() === 'compra');
      const cambioCompra = compras.length ? compras.reduce((s,t)=>s+(+t.cambio||1),0)/compras.length : 1;
      const cambioActual = a.cambioActual ? +a.cambioActual : await obtenerTipoCambio(a.moneda);
      const val = +a.valorActual || 0;
      impacto += val * (cambioActual - cambioCompra);
    }
  }
  return impacto;
}

// Suma de dividendos cobrados según tabla de ingresos
async function totalDividendos() {
  const ingresos = await db.ingresos.toArray();
  return ingresos
    .filter(i => {
      const t = (i.tipo || '').toLowerCase();
      return t === 'dividendo' || t === 'ingreso';
    })
    .reduce((s,i)=>s+(+i.importe||0),0);
}

// Agrupa activos por broker contando número y valor
async function resumenPorBroker() {
  const activos = await db.activos.toArray();
  const map = {};
  activos.forEach(a => {
    const b = a.broker || 'Otro';
    if (!map[b]) map[b] = { count:0, valor:0 };
    map[b].count += 1;
    map[b].valor += (+a.valorActual || 0);
  });
  return map;
}

// Activo con mayor valor actual
async function activoMayorValor() {
  const activos = await db.activos.toArray();
  let max = null;
  for (const a of activos) {
    const v = +a.valorActual || 0;
    if (!max || v > max.valor) max = { nombre:a.nombre, ticker:a.ticker, valor:v };
  }
  return max;
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
  const efectoDivisa = await calcularEfectoDivisa();
  const dividendos = await totalDividendos();
  const brokerRes = await resumenPorBroker();
  const mayor = await activoMayorValor();
  const porTipoHtml = Object.entries(valorPorTipo)
    .map(([t,v]) => `<div>${t}: ${formatCurrency(v)}</div>`).join('');
  const brokerHtml = Object.entries(brokerRes)
    .map(([b,d]) => `<div>${b}: ${d.count} / ${formatCurrency(d.valor)}</div>`)
    .join('');
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
      <div class="kpi-card">
        <div class="kpi-icon">🌍💱</div>
        <div>
          <div>Efecto divisa</div>
          <div class="kpi-value ${efectoDivisa>=0?'kpi-positivo':'kpi-negativo'}">${formatCurrency(Math.abs(efectoDivisa))} ${efectoDivisa>=0?'⬆️':'⬇️'}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🧾💰</div>
        <div>
          <div>Dividendos cobrados</div>
          <div class="kpi-value">${formatCurrency(dividendos)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🏦📊</div>
        <div>
          <div>Distribución por broker</div>
          ${brokerHtml}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🚀📈</div>
        <div>
          <div>Valoración actual más alta</div>
          <div>${mayor ? mayor.nombre + ' (' + mayor.ticker + ')' : '-'}</div>
          <div class="kpi-value">${mayor ? formatCurrency(mayor.valor) : '-'}</div>
        </div>
      </div>
    </div>
    <div class="card"><h3>P&L por activo</h3><canvas id="grafico-pnl" height="160"></canvas></div>
    <div class="card"><h3>Saveback y TIN</h3><canvas id="grafico-saveback" height="160"></canvas></div>
    <div class="card"><h3>Asignación actual vs objetivo</h3><canvas id="grafico-asignacion" height="160"></canvas></div>
    <div class="card"><h3>Distribución por divisa</h3><canvas id="grafico-divisa" height="160"></canvas></div>
    <div class="card"><h3>Distribución por sector</h3><canvas id="grafico-sector" height="160"></canvas></div>
    <div class="card"><h3>Distribución por tipo de activo</h3><canvas id="grafico-tipo" height="160"></canvas></div>
    <div class="card"><h3>Evolución de la cartera</h3><canvas id="grafico-evolucion" height="160"></canvas></div>
    <div class="card"><h3>Distribución por broker</h3><canvas id="grafico-broker" height="160"></canvas></div>
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
      const tipos = [...new Set(activos.map(a => a.tipo))];
      const monedas = [...new Set(activos.map(a => a.moneda))];
      html += `
      <div class="filtros-table">
        <input type="search" id="buscar-activos" placeholder="Buscar..." />
        <select id="filtro-tipo-activo">
          <option value="">Todos los tipos</option>
          ${tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <select id="filtro-moneda-activo">
          <option value="">Todas las monedas</option>
          ${monedas.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <table class="tabla-activos responsive-table"><thead><tr><th>Nombre</th><th>Ticker</th><th>Tipo</th><th>Moneda</th><th></th></tr></thead><tbody></tbody></table>`;
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

  function attachRowHandlers() {
    document.querySelectorAll('.edit-act').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const act = await db.activos.get(id);
        if (act) mostrarModalEditarActivo(act);
      };
    });

    document.querySelectorAll('.del-act').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        const row = btn.closest('tr');
        mostrarConfirmacion('¿Eliminar este activo?', async () => {
          await db.transacciones.where('activoId').equals(id).delete();
          await db.activos.delete(id);
          row.remove();
        });
      };
    });
  }

  if (modo === 'resumen') {
    const tbody = document.querySelector('.tabla-activos tbody');
    const buscar = document.getElementById('buscar-activos');
    const selTipo = document.getElementById('filtro-tipo-activo');
    const selMoneda = document.getElementById('filtro-moneda-activo');

    const filtrar = () => {
      const texto = buscar.value.toLowerCase();
      const tipo = selTipo.value;
      const moneda = selMoneda.value;
      const filas = activos.filter(a => {
        const txt = `${a.nombre} ${a.ticker} ${a.broker||''} ${a.tipo}`.toLowerCase();
        const okTexto = !texto || txt.includes(texto);
        const okTipo = !tipo || a.tipo === tipo;
        const okMon = !moneda || a.moneda === moneda;
        return okTexto && okTipo && okMon;
      }).map(a => `
        <tr data-id="${a.id}">
          <td>${a.nombre}</td>
          <td>${a.ticker}</td>
          <td>${a.tipo}</td>
          <td>${a.moneda}</td>
          <td>
            <button class="btn btn-small edit-act" data-id="${a.id}">✏</button>
            <button class="btn btn-small del-act" data-id="${a.id}">🗑</button>
          </td>
        </tr>
      `).join('');
      tbody.innerHTML = filas;
      attachRowHandlers();
    };

    buscar.addEventListener('input', filtrar);
    selTipo.addEventListener('change', filtrar);
    selMoneda.addEventListener('change', filtrar);
    filtrar();
  } else {
    attachRowHandlers();
  }

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
    const mapa = Object.fromEntries(activos.map(a => [a.id, a]));
    const total = trans.length;
    const tipos = [...new Set(activos.map(a => a.tipo))];
    const monedas = [...new Set(activos.map(a => a.moneda))];
    app.innerHTML = `
    <div class="card">
      <h2>Transacciones</h2>
      <p class="mini-explica">Aquí puedes registrar compras y ventas de tus activos. Total registradas: ${total}.</p>
      <button class="btn" id="add-trans">Añadir transacción</button>
      <button class="btn" id="exportar-trans">Exportar Transacciones (CSV)</button>
      <div class="filtros-table">
        <input type="search" id="buscar-trans" placeholder="Buscar..." />
        <select id="filtro-tipo-trans">
          <option value="">Todos los tipos</option>
          ${tipos.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <select id="filtro-moneda-trans">
          <option value="">Todas las monedas</option>
          ${monedas.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
      </div>
      <table class="responsive-table"><thead><tr>
          <th>Fecha</th><th>Activo</th><th>Tipo</th><th>Cant.</th><th>Precio</th><th>Comisión</th><th></th>
      </tr></thead><tbody></tbody></table>
    </div>`;

    document.getElementById("exportar-trans").onclick = async () => {
      const datos = await db.transacciones.toArray();
      exportarCSV(datos, "transacciones.csv");
    };

    document.getElementById('add-trans').onclick = () => {
      mostrarModalTransaccion(activos);
    };

    function attachHandlers() {
      document.querySelectorAll('.edit-trans').forEach(btn => {
        btn.onclick = async () => {
          const id = Number(btn.dataset.id);
          const t = await db.transacciones.get(id);
          if (t) mostrarModalTransaccion(activos, t);
        };
      });

      document.querySelectorAll('.del-trans').forEach(btn => {
        btn.onclick = () => {
          const id = Number(btn.dataset.id);
          const row = btn.closest('tr');
          mostrarConfirmacion('¿Eliminar esta transacción?', async () => {
            await db.transacciones.delete(id);
            row.remove();
          });
        };
      });
    }

    const tbody = document.querySelector('.responsive-table tbody');
    const buscar = document.getElementById('buscar-trans');
    const selTipo = document.getElementById('filtro-tipo-trans');
    const selMoneda = document.getElementById('filtro-moneda-trans');

    const filtrar = () => {
      const texto = buscar.value.toLowerCase();
      const tipo = selTipo.value;
      const moneda = selMoneda.value;
      const filas = trans.filter(t => {
        const a = mapa[t.activoId] || {};
        const txt = `${a.nombre||''} ${a.ticker||''} ${a.broker||''} ${t.tipo}`.toLowerCase();
        const okTexto = !texto || txt.includes(texto);
        const okTipo = !tipo || a.tipo === tipo;
        const okMon = !moneda || a.moneda === moneda;
        return okTexto && okTipo && okMon;
      }).map(t => {
        const a = mapa[t.activoId] || {};
        return `
          <tr data-id="${t.id}">
            <td data-label="Fecha">${t.fecha}</td>
            <td data-label="Activo">${a.nombre || '?'}</td>
            <td data-label="Tipo">${t.tipo}</td>
            <td data-label="Cant.">${t.cantidad}</td>
            <td data-label="Precio">${t.precio}</td>
            <td data-label="Comisión">${t.comision || 0}</td>
            <td>
              <button class="btn btn-small edit-trans" data-id="${t.id}">✏</button>
              <button class="btn btn-small del-trans" data-id="${t.id}">🗑</button>
            </td>
          </tr>`;
      }).join('');
      tbody.innerHTML = filas;
      attachHandlers();
    };

    buscar.addEventListener('input', filtrar);
    selTipo.addEventListener('change', filtrar);
    selMoneda.addEventListener('change', filtrar);
    filtrar();
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
    const resp = await fetch(
      'https://raw.githubusercontent.com/Adriamo1/CarteraPro/main/version.json',
      { cache: 'no-store' }
    );
    const data = await resp.json();
    const local = getUserSetting('version');
    if (local && local !== data.version) {
      if (confirm(`Nueva versión ${data.version} disponible. ¿Recargar?`)) {
        saveUserSetting('version', data.version);
        location.reload(true);
      }
    } else {
      saveUserSetting('version', data.version);
    }
  } catch (e) {
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
      <form id="form-ajustes" class="settings-form">
        <div class="form-group">
          <label for="language-select">Idioma</label>
          <select id="language-select">
            <option value="es" ${idioma === 'es' ? 'selected' : ''}>Español</option>
            <option value="en" ${idioma === 'en' ? 'selected' : ''}>English</option>
            <option value="fr" ${idioma === 'fr' ? 'selected' : ''}>Français</option>
            <option value="it" ${idioma === 'it' ? 'selected' : ''}>Italiano</option>
          </select>
        </div>
        <div class="form-group">
          <label for="theme-select">Tema</label>
          <select id="theme-select">
            <option value="auto" ${tema === 'auto' ? 'selected' : ''}>Sistema</option>
            <option value="light" ${tema === 'light' ? 'selected' : ''}>Claro</option>
            <option value="dark" ${tema === 'dark' ? 'selected' : ''}>Oscuro</option>
          </select>
        </div>
        <div class="form-group">
          <label for="profit-goal">Objetivo anual de rentabilidad (%)</label>
          <input type="number" id="profit-goal" step="any" value="${objetivo}">
        </div>
        <div class="form-group">
          <label for="saveback-rate">Saveback %</label>
          <input type="number" id="saveback-rate" step="any" value="${saveRate}">
        </div>
        <div class="form-group">
          <label for="tipo-cambio">Tipo de cambio base</label>
          <input type="number" id="tipo-cambio" step="any" value="${tipoCambio}">
        </div>
        <div class="form-group">
          <label for="api-key-av">API Key Alpha Vantage</label>
          <input id="api-key-av" type="text" value="${apiKey}">
        </div>
        <div class="form-group">
          <label for="brokers-list">Brokers</label>
          <textarea id="brokers-list" rows="3">${brokers.join('\n')}</textarea>
        </div>
        <div class="form-group">
          <label for="banks-list">Bancos</label>
          <textarea id="banks-list" rows="3">${bancos.join('\n')}</textarea>
        </div>
        <div class="form-group">
          <label><input type="checkbox" id="chk-privacidad" ${privacidad ? 'checked' : ''}/> Modo privacidad</label>
        </div>
        <button class="btn" type="submit">Guardar ajustes</button>
        <div id="ajustes-msg" class="form-msg"></div>
      </form>
      <section>
        <h3>Exportar datos</h3>
        <button id="btn-exportar-datos" class="btn">Exportar Backup</button>
      </section>
    </div>`;

  const form = document.getElementById('form-ajustes');
  const msg = document.getElementById('ajustes-msg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'form-msg';
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    const objetivoVal = parseFloat(document.getElementById('profit-goal').value);
    const saveVal = parseFloat(document.getElementById('saveback-rate').value);
    const tcVal = parseFloat(document.getElementById('tipo-cambio').value);
    let valid = true;
    if (isNaN(objetivoVal)) { document.getElementById('profit-goal').classList.add('input-error'); valid = false; }
    if (isNaN(saveVal)) { document.getElementById('saveback-rate').classList.add('input-error'); valid = false; }
    if (isNaN(tcVal)) { document.getElementById('tipo-cambio').classList.add('input-error'); valid = false; }
    if (!valid) {
      msg.textContent = 'Revisa los campos marcados.';
      msg.classList.add('error');
      return;
    }
    try {
      await Promise.all([
        setIdioma(document.getElementById('language-select').value),
        setTema(document.getElementById('theme-select').value),
        setObjetivoRentabilidad(objetivoVal),
        setSavebackRate(saveVal),
        setTipoCambio(tcVal),
        setApiKeyAv(document.getElementById('api-key-av').value.trim()),
        setBrokers(document.getElementById('brokers-list').value.split('\n').map(s => s.trim()).filter(Boolean)),
        setBancos(document.getElementById('banks-list').value.split('\n').map(s => s.trim()).filter(Boolean)),
        setPrivacidad(document.getElementById('chk-privacidad').checked)
      ]);
      msg.textContent = 'Ajustes guardados correctamente';
      msg.classList.add('success');
    } catch (err) {
      msg.textContent = 'Error guardando ajustes';
      msg.classList.add('error');
    }
  });

  const btnExp = document.getElementById('btn-exportar-datos');
  if (btnExp) btnExp.onclick = exportarBackup;
}

async function renderInfo() {
  app.innerHTML = `<div class="card"><h2>Información</h2><div id="info-cont">Cargando...</div></div>`;
  try {
    let local;
    try {
      const localResp = await fetch('version.json', { cache: 'no-store' });
      local = await localResp.json();
    } catch {
      const el = document.getElementById('version-data');
      local = el ? JSON.parse(el.textContent) : {};
    }
    const fecha = local.date || '';
    const instalada = local.version || '';
    try {
      const remoteResp = await fetch(
        'https://raw.githubusercontent.com/Adriamo1/CarteraPro/main/version.json',
        { cache: 'no-store' }
      );
      const remoto = await remoteResp.json();
      const ultima = remoto.version;
        document.getElementById('info-cont').innerHTML = `
          <p>Versión instalada: ${instalada}</p>
          <p>Última versión disponible: ${ultima}</p>
          <p>Fecha de creación: ${fecha}</p>
          <p>Creado por <a href="https://www.adrianmonge.es" target="_blank" rel="noopener">Adrián Monge</a></p>
          <p><a href="https://github.com/adrianmonge/CarteraPro" target="_blank" rel="noopener">Repositorio del proyecto</a></p>
          <p><button class="btn" id="btn-check-updates">Buscar actualizaciones</button></p>`;
        const btn = document.getElementById('btn-check-updates');
        if (btn) btn.onclick = checkForUpdates;
      } catch {
        document.getElementById('info-cont').innerHTML = `
          <p>Versión instalada: ${instalada}</p>
          <p>Fecha de creación: ${fecha}</p>
          <p>Creado por <a href="https://www.adrianmonge.es" target="_blank" rel="noopener">Adrián Monge</a></p>
          <p><a href="https://github.com/adrianmonge/CarteraPro" target="_blank" rel="noopener">Repositorio del proyecto</a></p>
          <p><button class="btn" id="btn-check-updates">Buscar actualizaciones</button></p>`;
        const btn2 = document.getElementById('btn-check-updates');
        if (btn2) btn2.onclick = checkForUpdates;
      }
    } catch {
    document.getElementById('info-cont').textContent = 'No disponible';
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

async function datosEvolucionCartera() {
  const trans = await db.transacciones.toArray();
  if (!trans.length) return { labels: [], data: [] };
  trans.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const pos = {}, price = {};
  const labels = [], data = [];
  for (const t of trans) {
    const id = t.activoId;
    if (!pos[id]) pos[id] = 0;
    const qty = +t.cantidad || 0;
    if ((t.tipo||'').toLowerCase()==='compra') pos[id]+=qty;
    if ((t.tipo||'').toLowerCase()==='venta') pos[id]-=qty;
    if (+t.precio) price[id] = +t.precio;
    const total = Object.keys(pos).reduce((s,k)=>s+pos[k]*(price[k]||0),0);
    labels.push(t.fecha.slice(0,10));
    data.push(total);
  }
  return { labels, data };
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

  const tipo = await distribucionPorCampo('tipo');
  const ctxTipo = document.getElementById('grafico-tipo').getContext('2d');
  new Chart(ctxTipo, {type:'doughnut', data:{labels:tipo.labels, datasets:[{data:tipo.data}]}, options:{responsive:true}});

  const evo = await datosEvolucionCartera();
  const ctxE = document.getElementById('grafico-evolucion').getContext('2d');
  new Chart(ctxE, {type:'line', data:{labels:evo.labels, datasets:[{label:'Valor total',data:evo.data,borderColor:'#3498db',tension:0.2}]}, options:{responsive:true}});

  const broker = await distribucionPorCampo('broker');
  const ctxB = document.getElementById('grafico-broker').getContext('2d');
  new Chart(ctxB, {type:'bar', data:{labels:broker.labels, datasets:[{data:broker.data, backgroundColor:'#70c1b3'}]}, options:{responsive:true, plugins:{legend:{display:false}}, indexAxis:'y'}});
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

async function exportarBackup() {
  const backup = {};
  for (const tabla of db.tables) {
    backup[tabla.name] = await tabla.toArray();
  }
  const blob = new Blob([JSON.stringify(backup)], {
    type: 'application/json'
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `carteraPRO_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
}

// ----- Modal Editar Activo -----
function crearModalActivo() {
  if (document.getElementById('activo-modal')) return;
  const div = document.createElement('div');
  div.id = 'activo-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Editar activo</h3>
      <form id="form-activo-modal">
        <input name="nombre" placeholder="Nombre" required />
        <input name="ticker" placeholder="Ticker" required />
        <input name="tipo" placeholder="Tipo" required />
        <input name="moneda" placeholder="Moneda" required />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-activo">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalEditarActivo(activo) {
  crearModalActivo();
  const modal = document.getElementById('activo-modal');
  const form = document.getElementById('form-activo-modal');
  form.nombre.value = activo.nombre || '';
  form.ticker.value = activo.ticker || '';
  form.tipo.value = activo.tipo || '';
  form.moneda.value = activo.moneda || '';
  form.dataset.id = activo.id;
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-activo').onclick = () => {
    modal.classList.add('hidden');
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const id = Number(form.dataset.id);
    await db.activos.update(id, data);
    actualizarFilaActivo(id, data);
    modal.classList.add('hidden');
  };
}

// ----- Modal Confirmar -----
function mostrarConfirmacion(msg, onOk) {
  let modal = document.getElementById('confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content">
        <p id="confirm-msg"></p>
        <button id="confirm-yes" class="btn">Aceptar</button>
        <button id="confirm-no" class="btn">Cancelar</button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector('#confirm-msg').textContent = msg;
  modal.classList.remove('hidden');
  modal.querySelector('#confirm-no').onclick = () => modal.classList.add('hidden');
  modal.querySelector('#confirm-yes').onclick = () => {
    modal.classList.add('hidden');
    onOk();
  };
}

function actualizarFilaActivo(id, data) {
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (!row) return;
  row.children[0].textContent = data.nombre;
  row.children[1].textContent = data.ticker;
  row.children[2].textContent = data.tipo;
  row.children[3].textContent = data.moneda;
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

async function mostrarModalTransaccion(activos, trans) {
  crearModalTransaccion();
  const modal = document.getElementById('transaction-modal');
  const lista = document.getElementById('sel-activo');
  lista.innerHTML = activos.map(a => `<option value="${a.id}" data-ticker="${a.ticker}" data-moneda="${a.moneda}" data-tipo="${a.tipo}">${a.nombre}</option>`).join('');
  const brokers = getBrokers();
  const dl = document.getElementById('lista-brokers');
  dl.innerHTML = brokers.map(b => `<option value="${b}">`).join('');
  modal.classList.remove('hidden');

  const form = document.getElementById('form-transaccion');
  form.dataset.id = trans ? trans.id : '';
  modal.querySelector('h3').textContent = trans ? 'Editar transacción' : 'Nueva transacción';

  if (trans) {
    form.activoId.value = trans.activoId;
    form.tipo.value = trans.tipo;
    form.fecha.value = trans.fecha;
    form.cantidad.value = trans.cantidad;
    document.getElementById('inp-precio').value = trans.precio;
    document.getElementById('inp-comision').value = trans.comision || 0;
    document.getElementById('inp-broker').value = trans.broker || '';
  }

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
    const id = form.dataset.id;
    const prom = id ? db.transacciones.update(Number(id), data) : db.transacciones.add(data);
    prom.then(() => {
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
