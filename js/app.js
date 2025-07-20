// app.js sin módulos, todo local
// Definición principal de la base de datos usando Dexie
const db = new Dexie('cartera-pro');
db.version(1).stores({
  assets: "++id, nombre, ticker, tipo, sector, moneda, valorActual, region, broker, isin, etiquetas",
  transactions: "++id, fecha, tipo, activoId, cantidad, precio, comision, broker, cambio, notas",
  movimientos: "++id, fecha, tipo, cuentaId, importe, descripcion, saveback, categoria, notas",
  cuentas: "++id, banco, iban, alias, saldo, tipo, principal, notas",
  tarjetas: "++id, cuentaId, numero, tipo, saldo, limite, vencimiento, notas",
  expenses: "++id, fecha, importe, tipo, categoria, descripcion, cuentaId, bienId, notas",
  income: "++id, fecha, importe, tipo, origen, cuentaId, bienId, activoId, notas",
  suscripciones: "++id, nombre, importe, periodicidad, proximoPago, cuentaId, tarjetaId, bienId, activoId, categoria, notas",
  bienes: "++id, descripcion, tipo, valorCompra, valorActual, direccion, propietario, notas",
  prestamos: "++id, bienId, tipo, principal, saldoPendiente, tin, tae, plazoMeses, cuota, interesesPagados, notas",
  seguros: "++id, bienId, tipo, prima, inicio, vencimiento, notas",
  historico: "fecha, valorTotal, saldoCuentas, saveback, resumenPorActivo, resumenPorBien, tiposCambio",
  carteras: "++id, nombre, descripcion, propietario, activos",
  documentos: "++id, entidad, entidadId, tipo, url, descripcion, fecha",
  logs: "++id, fecha, accion, entidad, entidadId, usuario, descripcion",
  exchangeRates: "++id, moneda, tasa, fecha",
  interestRates: "++id, fecha, tin",
  settings: "clave, valor"
});
db.version(2).stores({
  assets: "++id, nombre, ticker, tipo, sector, moneda, valorActual, region, broker, isin, etiquetas",
  transactions: "++id, fecha, tipo, activoId, cantidad, precio, comision, broker, cambio, notas",
  movimientos: "++id, fecha, tipo, cuentaId, importe, descripcion, saveback, categoria, notas",
  cuentas: "++id, banco, iban, alias, saldo, tipo, principal, notas",
  tarjetas: "++id, cuentaId, numero, tipo, saldo, limite, vencimiento, notas",
  expenses: "++id, fecha, importe, tipo, categoria, descripcion, cuentaId, bienId, notas",
  income: "++id, fecha, importe, tipo, origen, cuentaId, bienId, activoId, notas",
  suscripciones: "++id, nombre, importe, periodicidad, proximoPago, cuentaId, tarjetaId, bienId, activoId, categoria, notas",
  bienes: "++id, descripcion, tipo, valorCompra, valorActual, direccion, propietario, notas",
  prestamos: "++id, bienId, tipo, principal, saldoPendiente, tin, tae, plazoMeses, cuota, interesesPagados, notas",
  seguros: "++id, bienId, tipo, prima, inicio, vencimiento, notas",
  historico: "fecha, valorTotal, saldoCuentas, saveback, resumenPorActivo, resumenPorBien, tiposCambio",
  carteras: "++id, nombre, descripcion, propietario, activos",
  documentos: "++id, entidad, entidadId, tipo, url, descripcion, fecha",
  logs: "++id, fecha, accion, entidad, entidadId, usuario, descripcion",
  exchangeRates: "++id, moneda, tasa, fecha",
  interestRates: "++id, fecha, tin",
  settings: "clave, valor",
  backups: "++id, fecha"
});
db.version(3).stores({
  assets: "++id, nombre, ticker, tipo, sector, moneda, valorActual, region, broker, isin, etiquetas",
  transactions: "++id, fecha, tipo, activoId, cantidad, precio, comision, broker, cambio, notas",
  movimientos: "++id, fecha, tipo, cuentaId, importe, descripcion, saveback, categoria, notas",
  cuentas: "++id, banco, iban, alias, saldo, tipo, principal, notas",
  tarjetas: "++id, cuentaId, numero, tipo, saldo, limite, vencimiento, notas",
  expenses: "++id, fecha, importe, tipo, categoria, descripcion, cuentaId, bienId, notas",
  income: "++id, fecha, importe, tipo, origen, cuentaId, bienId, activoId, notas",
  suscripciones: "++id, nombre, importe, periodicidad, proximoPago, cuentaId, tarjetaId, bienId, activoId, categoria, notas",
  bienes: "++id, descripcion, tipo, valorCompra, valorActual, direccion, propietario, notas",
  deudas: "++id, tipo, descripcion, entidad, fechaInicio, fechaVencimiento, capitalInicial, tipoInteres, interesFijo, inmuebleAsociado, notas",
  deudaMovimientos: "++id, deudaId, fecha, tipoMovimiento, importe, nota",
  seguros: "++id, bienId, tipo, prima, inicio, vencimiento, notas",
  historico: "fecha, valorTotal, saldoCuentas, saveback, resumenPorActivo, resumenPorBien, tiposCambio",
  carteras: "++id, nombre, descripcion, propietario, activos",
  documentos: "++id, entidad, entidadId, tipo, url, descripcion, fecha",
  logs: "++id, fecha, accion, entidad, entidadId, usuario, descripcion",
  exchangeRates: "++id, moneda, tasa, fecha",
  interestRates: "++id, fecha, tin",
  settings: "clave, valor",
  backups: "++id, fecha",
  prestamos: null
}).upgrade(tx => tx.table('prestamos').toArray(p => tx.table('deudas').bulkAdd(p)));
db.version(4).stores({
  portfolioHistory: "++id, fecha, valorTotal, saldoCuenta"
});
db.version(5).stores({
  deudaHistory: "++id, deudaId, fecha, saldo"
});
db.version(6).stores({
  deudas: "++id, tipo, descripcion, entidad, fechaInicio, fechaVencimiento, capitalInicial, tipoInteres, interesFijo, inmuebleAsociado, notas, pagoAutomatico"
});
db.version(7).stores({
  historialPatrimonio: "++id, fecha"
});
db.activos = db.assets;
db.transacciones = db.transactions;
db.gastos = db.expenses;
db.ingresos = db.income;
db.tiposCambio = db.exchangeRates;
db.ajustes = db.settings;
db.prestamos = db.deudas;
db.movimientosDeuda = db.deudaMovimientos;
// Para compatibilidad con versiones anteriores
window.db = db;

const STORE_NAMES = [
  'assets', 'transactions', 'movimientos', 'cuentas', 'tarjetas',
  'expenses', 'income', 'suscripciones', 'bienes', 'deudas', 'movimientosDeuda', 'seguros',
  'historico', 'carteras', 'documentos', 'logs', 'exchangeRates',
  'interestRates', 'settings', 'backups', 'portfolioHistory', 'deudaHistory',
  'historialPatrimonio'
];

const DEFAULT_DATA = STORE_NAMES.reduce((obj, name) => {
  obj[name] = [];
  return obj;
}, {});

let appState = null;

async function cargarEstado() {
  const datos = {};
  for (const name of STORE_NAMES) {
    datos[name] = await db[name].toArray();
  }
  if (Object.values(datos).every(arr => arr.length === 0)) {
    await guardarEstado(DEFAULT_DATA);
    Object.assign(datos, JSON.parse(JSON.stringify(DEFAULT_DATA)));
  }
  appState = datos;
  return datos;
}

async function guardarEstado(estado) {
  const data = estado || appState;
  if (!data) return;
  const ops = [];
  for (const name of STORE_NAMES) {
    if (data[name]) ops.push(db[name].bulkPut(data[name]));
  }
  await Promise.all(ops);
}

async function actualizarEntidad(nombre, objeto) {
  if (!STORE_NAMES.includes(nombre)) throw new Error('Entidad no válida');
  const id = await db[nombre].put(objeto);
  if (appState && appState[nombre]) {
    const idx = appState[nombre].findIndex(e => e.id === id);
    if (idx >= 0) appState[nombre][idx] = { ...objeto, id };
    else appState[nombre].push({ ...objeto, id });
  }
  await guardarEstado(appState);
  return id;
}

async function borrarEntidad(nombre, id) {
  if (!STORE_NAMES.includes(nombre)) throw new Error('Entidad no válida');
  await db[nombre].delete(id);
  if (appState && appState[nombre]) {
    appState[nombre] = appState[nombre].filter(e => e.id !== id);
  }
  await guardarEstado(appState);
}

db.on('changes', changes => {
  if (!appState) return;
  for (const ch of changes) {
    let name = ch.table;
    if (name === 'deudaMovimientos') name = 'movimientosDeuda';
    if (name === 'prestamos') name = 'deudas';
    if (!appState[name]) continue;
    if (ch.type === 1 || ch.type === 'create') {
      appState[name].push({ ...(ch.obj || {}), id: ch.key });
    } else if (ch.type === 2 || ch.type === 'update') {
      const idx = appState[name].findIndex(e => e.id === ch.key);
      if (idx >= 0) Object.assign(appState[name][idx], ch.obj || ch.mods || {});
    } else if (ch.type === 3 || ch.type === 'delete') {
      appState[name] = appState[name].filter(e => e.id !== ch.key);
    }
  }
  if (changes.some(c => ['assets','transactions','movimientos','cuentas','deudas','deudaMovimientos'].includes(c.table))) {
    registrarHistoricoCartera();
    registrarHistorialPatrimonio();
  }
});


const app = document.getElementById("app");
const state = {
  accountMovements: [],
  interestRates: [],
  portfolioHistory: [],
  deudaHistory: [],
  historialPatrimonio: [],
  deudas: [],
  movimientosDeuda: [],
  settings: { lastExchangeUpdate: null }
};
const hasChart = typeof Chart !== 'undefined';

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

function getEntidadesFinancieras() {
  let list = getUserSetting("entidadesFinancieras");
  if (Array.isArray(list)) return [...new Set(list.map(s => s.trim()).filter(Boolean))];
  const brokers = getUserSetting("brokers") || [
    "Trade Republic", "Revolut", "Binance", "DEGIRO",
    "MyInvestor", "Interactive Brokers"
  ];
  const bancos = getUserSetting("bancos") || [
    "BBVA", "CaixaBank", "Santander", "ING",
    "Openbank", "EVO", "Revolut"
  ];
  list = [...new Set([...brokers, ...bancos])];
  saveUserSetting("entidadesFinancieras", list);
  return list;
}
function setEntidadesFinancieras(list) {
  const unique = [...new Set(list.map(s => s.trim()).filter(Boolean))];
  return saveUserSetting("entidadesFinancieras", unique);
}

function actualizarDatalistEntidades() {
  const dl = document.getElementById('lista-entidades');
  if (dl) dl.innerHTML = getEntidadesFinancieras().map(e => `<option value="${e}">`).join('');
}

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
  "#deudas": renderDeudas,
  "#planpagos": renderPlanPagos,
  "#tiposcambio": renderTiposCambio,
  "#analisisvalue": renderAnalisisValue,
  "#glosario": renderGlosario,
  "#info": renderInfo,
  "#debug": renderDebug,
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
  const costeTotal = Object.values(compras).reduce((s,c)=>s+c.coste,0);

  const valorPorTipo = activos.reduce((acc, a) => {
    const val = +a.valorActual || 0;
    acc[a.tipo] = (acc[a.tipo] || 0) + val;
    return acc;
  }, {});

  return { valorTotal, rentTotal, realized, unrealized, valorPorTipo, costeTotal };
}

async function calcularPatrimonioNeto() {
  const [activos, cuentas, deudas] = await Promise.all([
    db.activos.toArray(),
    db.cuentas.where('tipo').equals('remunerada').toArray(),
    db.deudas.toArray()
  ]);
  const valorActivos = activos.reduce((s, a) => s + (+a.valorActual || 0), 0);
  const saldoCuentas = cuentas.reduce((s, c) => s + (+c.saldo || 0), 0);
  const deudasVals = await Promise.all(deudas.map(d => calcularSaldoPendiente(d)));
  const deudaPendiente = deudasVals.reduce((s, v) => s + v, 0);
  const patrimonioNeto = valorActivos + saldoCuentas - deudaPendiente;
  const ratioDeudaActivos = valorActivos ? (deudaPendiente / valorActivos) * 100 : 0;
  return { patrimonioNeto, valorActivos, saldoCuentas, deudaPendiente, ratioDeudaActivos };
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

async function calcularInteresMesArgs(anyo, mes) {
  const hoy = new Date();
  const diasMes = (anyo === hoy.getFullYear() && mes === hoy.getMonth())
    ? hoy.getDate()
    : new Date(anyo, mes + 1, 0).getDate();
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

async function calcularInteresAnual() {
  const hoy = new Date();
  let total = 0;
  for (let m = 0; m <= hoy.getMonth(); m++) {
    total += await calcularInteresMesArgs(hoy.getFullYear(), m);
  }
  return total;
}

async function calcularApy() {
  if (!state.interestRates.length) {
    state.interestRates = await db.interestRates.toArray();
  }
  const rate = state.interestRates[state.interestRates.length - 1];
  const tin = rate ? parseFloat(rate.tin) : 0;
  return Math.pow(1 + tin / 100 / 12, 12) - 1;
}

async function saldoMedioAnual() {
  const hoy = new Date();
  const anyo = hoy.getFullYear();
  if (!state.accountMovements.length) {
    state.accountMovements = await db.movimientos.toArray();
  }
  const cuentas = await db.cuentas.where('tipo').equals('remunerada').toArray();
  if (!cuentas.length) return 0;
  const movs = state.accountMovements.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha));
  let totalInicio = 0;
  let totalFin = 0;
  for (const cuenta of cuentas) {
    const saldoFin = +cuenta.saldo || 0;
    const movYear = movs.filter(m=>m.cuentaId==cuenta.id && m.fecha>=`${anyo}-01-01`);
    const delta = movYear.reduce((s,m)=>s+(+m.importe||0),0);
    const saldoIni = saldoFin - delta;
    totalInicio += saldoIni;
    totalFin += saldoFin;
  }
  return (totalInicio + totalFin) / 2;
}

async function calcularRentabilidadAnualizada() {
  const hist = await db.portfolioHistory.orderBy('fecha').toArray();
  if (hist.length < 2) return 0;
  const inicio = hist[0];
  const fin = hist[hist.length - 1];
  const valIni = +inicio.valorTotal || 0;
  const valFin = +fin.valorTotal || 0;
  const dias = (new Date(fin.fecha) - new Date(inicio.fecha)) / 86400000;
  if (valIni <= 0 || dias <= 0) return 0;
  const anos = dias / 365;
  return Math.pow(valFin / valIni, 1 / anos) - 1;
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

async function totalDeudaPendiente() {
  const deudas = await db.deudas.toArray();
  let total = 0;
  for (const d of deudas) total += await calcularSaldoPendiente(d);
  return total;
}

async function totalInteresesPagadosDeuda() {
  const movs = await db.movimientosDeuda.toArray();
  return movs
    .filter(m => m.tipoMovimiento === 'Pago interés' || m.tipoMovimiento === 'Comisión')
    .reduce((s,m)=>s+(+m.importe||0),0);
}

async function prioridadAmortizacionDeudas() {
  const deudas = await db.deudas.toArray();
  const data = [];
  for (const d of deudas) {
    const saldo = await calcularSaldoPendiente(d);
    if (saldo <= 0) continue;
    data.push({ deuda: d, saldo });
  }
  if (!data.length) return [];
  const maxTin = Math.max(...data.map(r => parseFloat(r.deuda.tipoInteres || r.deuda.tin || r.deuda.tae || 0)));
  const maxSaldo = Math.max(...data.map(r => r.saldo));
  const maxDias = Math.max(...data.map(r => r.deuda.fechaVencimiento ? diffDias(new Date(), new Date(r.deuda.fechaVencimiento)) : 0));
  return data.map(r => {
    const tin = parseFloat(r.deuda.tipoInteres || r.deuda.tin || r.deuda.tae || 0);
    const tinScore = maxTin ? tin / maxTin : 0;
    const saldoScore = maxSaldo ? 1 - r.saldo / maxSaldo : 0;
    let diasScore = 0;
    if (r.deuda.fechaVencimiento) {
      const dias = diffDias(new Date(), new Date(r.deuda.fechaVencimiento));
      diasScore = maxDias ? 1 - Math.max(0, dias) / maxDias : 0;
    }
    const prioridad = (tinScore + saldoScore + diasScore) / 3;
    return { id: r.deuda.id, prioridad };
  }).sort((a,b) => b.prioridad - a.prioridad);
}
async function analizarCosteDeudasVsCuenta() {
  if (!state.interestRates.length) {
    state.interestRates = await db.interestRates.toArray();
  }
  const last = state.interestRates[state.interestRates.length - 1];
  const tinCuenta = last ? parseFloat(last.tin) : 0;
  const deudas = await db.deudas.toArray();
  const res = [];
  for (const d of deudas) {
    const saldo = await calcularSaldoPendiente(d);
    if (saldo <= 0) continue;
    const tinDeuda = parseFloat(d.tipoInteres || d.tin || d.tae || 0);
    if (tinDeuda > tinCuenta) {
      res.push({ nombre: d.descripcion || d.tipo || 'deuda', tinCuenta, tinDeuda });
    }
  }
  return res;
}

async function registrarHistoricoCartera() {
  const { valorTotal } = await calcularKpis();
  const { patrimonioNeto } = await calcularPatrimonioNeto();
  const cuentas = await db.cuentas.toArray();
  const saldoCuenta = cuentas.reduce((s,c)=>s+(+c.saldo||0),0);
  const fecha = new Date().toISOString().slice(0,10);
  const existente = await db.portfolioHistory.where('fecha').equals(fecha).first();
  if (existente) {
    await db.portfolioHistory.update(existente.id, { valorTotal, saldoCuenta, patrimonioNeto });
  } else {
    const id = await db.portfolioHistory.add({ fecha, valorTotal, saldoCuenta, patrimonioNeto });
    if (appState && appState.portfolioHistory) {
      appState.portfolioHistory.push({ id, fecha, valorTotal, saldoCuenta, patrimonioNeto });
    }
  }
}

async function registrarHistorialPatrimonio() {
  const { patrimonioNeto, valorActivos, saldoCuentas, deudaPendiente } = await calcularPatrimonioNeto();
  const fecha = new Date().toISOString().slice(0,10);
  const existente = await db.historialPatrimonio.where('fecha').equals(fecha).first();
  if (existente) {
    await db.historialPatrimonio.update(existente.id, {
      patrimonioNeto, activos: valorActivos, cuentas: saldoCuentas, deudas: deudaPendiente
    });
    if (appState && appState.historialPatrimonio) {
      const idx = appState.historialPatrimonio.findIndex(h=>h.id===existente.id);
      if (idx>=0) Object.assign(appState.historialPatrimonio[idx], { patrimonioNeto, activos: valorActivos, cuentas: saldoCuentas, deudas: deudaPendiente });
    }
  } else {
    const id = await db.historialPatrimonio.add({ fecha, patrimonioNeto, activos: valorActivos, cuentas: saldoCuentas, deudas: deudaPendiente });
    if (appState && appState.historialPatrimonio) {
      appState.historialPatrimonio.push({ id, fecha, patrimonioNeto, activos: valorActivos, cuentas: saldoCuentas, deudas: deudaPendiente });
    }
  }
}

async function registrarHistoricoDeuda(deudaId, fecha) {
  const saldo = await calcularSaldoPendiente(deudaId);
  const f = fecha || new Date().toISOString().slice(0,10);
  const existe = await db.deudaHistory.where({ deudaId, fecha: f }).first();
  if (existe) {
    await db.deudaHistory.update(existe.id, { saldo });
    if (appState && appState.deudaHistory) {
      const idx = appState.deudaHistory.findIndex(h=>h.id===existe.id);
      if (idx>=0) appState.deudaHistory[idx].saldo = saldo;
    }
  } else {
    const id = await db.deudaHistory.add({ deudaId, fecha: f, saldo });
    if (appState && appState.deudaHistory) {
      appState.deudaHistory.push({ id, deudaId, fecha: f, saldo });
    }
  }
}

async function obtenerHistorialDeuda(deudaId) {
  let hist = await db.deudaHistory.where('deudaId').equals(deudaId).sortBy('fecha');
  if (!hist.length) {
    const deuda = await db.deudas.get(deudaId);
    if (!deuda) return [];
    const movs = await db.movimientosDeuda.where('deudaId').equals(deudaId).toArray();
    movs.sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));
    let saldo = +deuda.capitalInicial || 0;
    hist = [];
    for (const m of movs) {
      if (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Cancelación anticipada') {
        saldo -= (+m.importe || 0);
        const item = { deudaId, fecha: m.fecha, saldo };
        hist.push(item);
      }
    }
    if (hist.length) await db.deudaHistory.bulkAdd(hist);
  }
  return hist;
}

async function renderGraficoHistorialDeuda(id) {
  if (!hasChart) return;
  const hist = await obtenerHistorialDeuda(id);
  if (!hist.length) return;
  const movs = await db.movimientosDeuda.where('deudaId').equals(id).toArray();
  movs.sort((a,b)=> new Date(a.fecha)-new Date(b.fecha));
  const mapInt = {};
  let total = 0;
  for (const m of movs) {
    if (m.tipoMovimiento === 'Pago interés' || m.tipoMovimiento === 'Comisión') {
      total += (+m.importe || 0);
    }
    if (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Cancelación anticipada') {
      mapInt[m.fecha] = total;
    }
  }
  const labels = hist.map(h=>h.fecha);
  const saldos = hist.map(h=>h.saldo);
  const intereses = hist.map(h=>mapInt[h.fecha] || 0);
  const ctx = document.getElementById('grafico-saldo-deuda');
  if (!ctx) return;
  new Chart(ctx.getContext('2d'), {
    type:'line',
    data:{labels, datasets:[
      {label:'Saldo', data:saldos, borderColor:'#3498db', tension:0.2},
      {label:'Interés acumulado', data:intereses, borderColor:'#e67e22', tension:0.2}
    ]},
    options:{responsive:true}
  });
}

async function datosComparativaDeudas() {
  const [deudas, movs] = await Promise.all([
    db.deudas.toArray(),
    db.movimientosDeuda.toArray()
  ]);
  let saldoHip = 0, saldoPres = 0, intHip = 0, intPres = 0;
  for (const d of deudas) {
    const tipo = (d.tipo || '').toLowerCase().includes('hipotec') ? 'hip' : 'pre';
    const saldo = await calcularSaldoPendiente(d);
    const intereses = movs.filter(m => m.deudaId === d.id && (m.tipoMovimiento === 'Pago interés' || m.tipoMovimiento === 'Comisión'))
      .reduce((s,m)=>s+(+m.importe||0),0);
    if (tipo === 'hip') {
      saldoHip += saldo;
      intHip += intereses;
    } else {
      saldoPres += saldo;
      intPres += intereses;
    }
  }
  return { saldoHip, saldoPres, intHip, intPres };
}

async function renderGraficoComparativaDeudas() {
  if (!hasChart) return;
  const datos = await datosComparativaDeudas();
  const ctx = document.getElementById('grafico-deudas');
  if (!ctx) return;
  new Chart(ctx.getContext('2d'), {
    type:'bar',
    data:{
      labels:['Saldo pendiente','Intereses pagados'],
      datasets:[
        {label:'Hipoteca', data:[datos.saldoHip, datos.intHip], backgroundColor:'#2063c2'},
        {label:'Préstamo', data:[datos.saldoPres, datos.intPres], backgroundColor:'#70c1b3'}
      ]
    },
    options:{responsive:true}
  });
}

async function obtenerCuotasProximas() {
  const [deudas, movs] = await Promise.all([
    db.deudas.toArray(),
    db.movimientosDeuda.toArray()
  ]);
  const hoy = new Date();
  const pagos = [];
  for (const d of deudas) {
    const lista = movs.filter(m => m.deudaId === d.id && (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Pago interés'))
      .sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
    let fecha = lista[0] ? new Date(lista[0].fecha) : new Date(d.fechaInicio || hoy);
    if (isNaN(fecha)) fecha = hoy;
    fecha.setMonth(fecha.getMonth() + 1);
    while (fecha <= hoy) fecha.setMonth(fecha.getMonth() + 1);
    if (d.fechaVencimiento && new Date(d.fechaVencimiento) < fecha) continue;
    const info = await calcularAmortizacionDeuda(d);
    if (!info) continue;
    pagos.push({
      id: d.id,
      descripcion: d.descripcion || d.entidad || d.tipo,
      fecha: fecha.toISOString().slice(0,10),
      cuota: info.cuota,
      interes: info.interes,
      capital: info.capital
    });
  }
  return pagos.sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));
}

function totalesPagosMes(pagos) {
  const hoy = new Date();
  const m = hoy.getMonth();
  const y = hoy.getFullYear();
  const m2 = (m + 1) % 12;
  const y2 = m === 11 ? y + 1 : y;
  let t1 = 0, t2 = 0;
  for (const p of pagos) {
    const f = new Date(p.fecha);
    if (f.getFullYear() === y && f.getMonth() === m) t1 += p.cuota;
    if (f.getFullYear() === y2 && f.getMonth() === m2) t2 += p.cuota;
  }
  return { actual: t1, siguiente: t2 };
}

async function renderPlanPagos() {
  const pagos = await obtenerCuotasProximas();
  const tot = totalesPagosMes(pagos);
  const filas = pagos.map(p => `<tr><td>${p.fecha}</td><td>${p.descripcion}</td><td>${formatCurrency(p.cuota)}</td></tr>`).join('');
  app.innerHTML = `
    <div class="card">
      <h2>Planificador mensual</h2>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon">📅</div><div><div>Pagos mes actual</div><div class="kpi-value">${formatCurrency(tot.actual)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">⏭️</div><div><div>Pagos mes siguiente</div><div class="kpi-value">${formatCurrency(tot.siguiente)}</div></div></div>
      </div>
      <table class="tabla responsive-table"><thead><tr><th>Fecha</th><th>Deuda</th><th>Cuota</th></tr></thead><tbody>${filas}</tbody></table>
      <button class="btn" id="volver-deudas">Volver</button>
    </div>`;
  document.getElementById('volver-deudas').onclick = () => history.back();
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
  const { valorTotal, rentTotal, realized, unrealized, valorPorTipo, costeTotal } = await calcularKpis();
  const { patrimonioNeto, valorActivos, saldoCuentas, deudaPendiente, ratioDeudaActivos } = await calcularPatrimonioNeto();
  const hist = await db.portfolioHistory.orderBy('fecha').reverse().limit(2).toArray();
  let variacion = 0;
  if (hist.length === 2) {
    variacion = patrimonioNeto - (hist[1].patrimonioNeto || 0);
  }
  const interesMes = await calcularInteresMes();
  const interesAnual = await calcularInteresAnual();
  const apy = await calcularApy();
  const cagr = await calcularRentabilidadAnualizada();
  const savePend = await totalSavebackPendiente();
  const efectoDivisa = await calcularEfectoDivisa();
  const dividendos = await totalDividendos();
  const brokerRes = await resumenPorBroker();
  const mayor = await activoMayorValor();
  const interesPagado = await totalInteresesPagadosDeuda();
  const porTipoHtml = Object.entries(valorPorTipo)
    .map(([t, v]) => `<div>${t}: ${formatCurrency(v)}</div>`).join('');
  const roi = costeTotal ? (rentTotal / costeTotal) * 100 : 0;
  const objetivo = getObjetivoRentabilidad();
  const cumplido = roi >= objetivo && objetivo > 0;
  const brokerHtml = Object.entries(brokerRes)
    .map(([b,d]) => `<div>${b}: ${d.count} / ${formatCurrency(d.valor)}</div>`)
    .join('');
  const amortizaciones = await analizarCosteDeudasVsCuenta();
  const alertaAmort = amortizaciones.length
    ? '<div class="alert pendiente">' +
        amortizaciones.map(a => `💡 Tu cuenta remunera al ${a.tinCuenta}% pero estás pagando un ${a.tinDeuda}% por tu deuda ${a.nombre}. Podrías amortizar para ahorrar intereses.`).join('<br>') +
      '</div>'
    : '';
  app.innerHTML = `
    <h2>Panel de control</h2>
    ${objetivo>0?`<div class="alert ${cumplido?'cumplido':'pendiente'}">${cumplido?'🎯 ¡Has alcanzado tu objetivo anual de rentabilidad! <button id="reset-obj" class="btn btn-small">Reiniciar</button>':'Objetivo a '+(objetivo-roi).toFixed(2)+' %'}</div>`:''}
    ${alertaAmort}
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">💎</div>
        <div>
          <div>Patrimonio neto</div>
          <div class="kpi-value ${patrimonioNeto>=0?'kpi-positivo':'kpi-negativo'}">${formatCurrency(patrimonioNeto)} ${variacion>0?'⬆️':variacion<0?'⬇️':''}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📊</div>
        <div>
          <div>Valor activos</div>
          <div class="kpi-value">${formatCurrency(valorActivos)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🏦</div>
        <div>
          <div>Cuentas remuneradas</div>
          <div class="kpi-value">${formatCurrency(saldoCuentas)}</div>
        </div>
      </div>
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
          <div>Interés anual</div>
          <div class="kpi-value">${formatCurrency(interesAnual)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🎯</div>
        <div>
          <div>Rentabilidad cartera <span class="help" title="ROI"></span></div>
          <div class="kpi-value ${roi>=0?'kpi-positivo':'kpi-negativo'}">${roi.toFixed(2)}% ${cumplido?'🏆':''}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📆</div>
        <div>
          <div>Rentabilidad anualizada <span class="help" title="(valorFinal / valorInicial)^(1/años) - 1">?</span></div>
          <div class="kpi-value ${cagr>=0?'kpi-positivo':'kpi-negativo'}">${(cagr*100).toFixed(2)}%</div>
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
        <div class="kpi-icon">🏦</div>
        <div>
          <div>Deuda pendiente</div>
          <div class="kpi-value">${formatCurrency(deudaPendiente)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💸</div>
        <div>
          <div>Intereses pagados</div>
          <div class="kpi-value">${formatCurrency(interesPagado)}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">%🏦</div>
        <div>
          <div>Deuda / activos</div>
          <div class="kpi-value">${ratioDeudaActivos.toFixed(2)}%</div>
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
    <div class="card"><h3>P&L por activo <span class="help" title="Beneficio o pérdida"></span></h3><canvas id="grafico-pnl" height="160"></canvas></div>
    <div class="card"><h3>Composición del patrimonio</h3><canvas id="grafico-patrimonio" height="160"></canvas></div>
    <div class="card"><h3>Saveback y TIN <span class="help" title="Ahorro para inversiones y tipo nominal"></span></h3><canvas id="grafico-saveback" height="160"></canvas></div>
    <div class="card"><h3>Asignación actual vs objetivo</h3><canvas id="grafico-asignacion" height="160"></canvas></div>
    <div class="card"><h3>Distribución por divisa</h3><canvas id="grafico-divisa" height="160"></canvas></div>
    <div class="card"><h3>Distribución por sector</h3><canvas id="grafico-sector" height="160"></canvas></div>
    <div class="card"><h3>Distribución por tipo de activo</h3><canvas id="grafico-tipo" height="160"></canvas></div>
    <div class="card"><h3>Evolución de la cartera</h3><canvas id="grafico-evolucion" height="160"></canvas></div>
    <div class="card"><h3>Evolución patrimonio neto <select id="filtro-hpat"><option value="">Todo</option><option value="30">30 días</option><option value="180">6 meses</option></select></h3><canvas id="grafico-hist-patrimonio" height="160"></canvas></div>
    <div class="card"><h3>Distribución por broker</h3><canvas id="grafico-broker" height="160"></canvas></div>
    <button class="btn" id="btn-plan-pagos">Planificador mensual de deudas</button>
    `;

  renderGraficosDashboard();
  renderGraficoHistorialPatrimonio();
  const btnReset = document.getElementById('reset-obj');
  if (btnReset) btnReset.onclick = () => {
    setObjetivoRentabilidad(0).then(renderDashboard);
  };
  const planBtn = document.getElementById('btn-plan-pagos');
  if (planBtn) planBtn.onclick = () => { location.hash = '#planpagos'; };
  const selH = document.getElementById('filtro-hpat');
  if (selH) selH.onchange = renderGraficoHistorialPatrimonio;
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
        <select name="tipo" id="tipo-activo">
          <option value="Acción">Acción</option>
          <option value="ETF">ETF</option>
          <option value="Fondo de inversión">Fondo de inversión</option>
          <option value="Plan de pensiones">Plan de pensiones</option>
          <option value="REIT">REIT</option>
          <option value="Inmueble">Inmueble</option>
          <option value="Metales preciosos">Metales preciosos</option>
          <option value="Cripto">Cripto</option>
          <option value="Otro">Otro</option>
        </select>
        <input name="tipo-personal" id="tipo-personal" placeholder="Tipo personal" style="display:none" />
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
  if (!document.getElementById('lista-entidades')) {
    const dl = document.createElement('datalist');
    dl.id = 'lista-entidades';
    document.body.appendChild(dl);
  }
  actualizarDatalistEntidades();

  const selTipo = document.getElementById('tipo-activo');
  const inputPersonal = document.getElementById('tipo-personal');
  if (selTipo) {
    selTipo.onchange = () => {
      if (selTipo.value === 'Otro') {
        inputPersonal.style.display = 'block';
        inputPersonal.required = true;
      } else {
        inputPersonal.style.display = 'none';
        inputPersonal.required = false;
      }
    };
  }

  document.getElementById('toggle-activos').onclick = () => {
    setVista('activos', modo === 'detalle' ? 'resumen' : 'detalle');
    renderActivos();
  };

  document.getElementById("form-activo").onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    if (data["tipo"] === "Otro") data["tipo"] = data["tipo-personal"] || "Otro";
    actualizarEntidad('assets', data).then(renderActivos);
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
          await borrarEntidad('assets', id);
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

  if (hasChart && modo === 'detalle') {
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
            await borrarEntidad('transactions', id);
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
  const tinActual = state.interestRates[state.interestRates.length-1]?.tin || 0;
  const tae = (await calcularApy())*100;
  const interesMes = await calcularInteresMes();
  const interesAnual = await calcularInteresAnual();
  const saldoMedio = await saldoMedioAnual();
  const rentEfec = saldoMedio ? (interesAnual / saldoMedio) * 100 : 0;
  const modo = getVista('cuentas');
  let html = `<div class="card">
      <h2>Cuentas</h2>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon">%📈</div><div><div>TIN actual <span class="help" title="Tipo nominal"></span></div><div class="kpi-value">${tinActual}%</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">🔄</div><div><div>TAE estimada <span class="help" title="Tasa anual equivalente"></span></div><div class="kpi-value">${tae.toFixed(2)}%</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">💵</div><div><div>Interés mes</div><div class="kpi-value">${formatCurrency(interesMes)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">📆</div><div><div>Interés anual</div><div class="kpi-value">${formatCurrency(interesAnual)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">✅</div><div><div>Rent. efectiva</div><div class="kpi-value">${rentEfec.toFixed(2)}%</div></div></div>
      </div>
      <button id="toggle-cuentas" class="btn">${modo === 'detalle' ? 'Vista resumen' : 'Ver detalles'}</button>
      <button id="add-mov" class="btn">Añadir movimiento</button>
      <form id="form-cuenta">
        <input name="nombre" placeholder="Nombre" required />
        <input name="banco" placeholder="Entidad" list="lista-entidades" required />
        <input name="tipo" placeholder="Tipo" value="corriente" required />
        <input name="saldo" placeholder="Saldo" type="number" step="any" value="0" required />
        <button class="btn">Guardar</button>
      </form>`;
  if (modo === 'resumen') {
      html += `<ul>${cuentas.map(c => `<li>${c.nombre} (${c.banco}) - ${c.saldo}€</li>`).join('')}</ul>`;
  } else {
      for (const c of cuentas) {
        const movs = await db.movimientos.where('cuentaId').equals(c.id).toArray();
        const filas = movs.map(m => `<tr data-id="${m.id}">
            <td data-label="Fecha">${m.fecha}</td>
            <td data-label="Importe">${formatCurrency(m.importe)}</td>
            <td data-label="Concepto" class="col-ocultar">${m.descripcion||''}</td>
            <td>
              <button class="btn btn-small edit-mov" data-id="${m.id}">✏️</button>
              <button class="btn btn-small del-mov" data-id="${m.id}">🗑️</button>
            </td>
          </tr>`).join('');
        const interes = (c.saldo || 0) * 0.01;
        html += `<section class="detalle">
          <h3>${c.nombre}</h3>
          <table class="tabla-detalle responsive-table"><thead><tr><th>Fecha</th><th>Importe</th><th>Concepto</th><th></th></tr></thead><tbody>${filas}</tbody></table>
          <div class="mini-explica">Interés estimado: ${formatCurrency(interes)}</div>
        </section>`;
      }
  }
  html += '</div>';
  app.innerHTML = html;
  if (!document.getElementById('lista-entidades')) {
    const dl = document.createElement('datalist');
    dl.id = 'lista-entidades';
    document.body.appendChild(dl);
  }
  actualizarDatalistEntidades();

  document.getElementById('toggle-cuentas').onclick = () => {
    setVista('cuentas', modo === 'detalle' ? 'resumen' : 'detalle');
    renderCuentas();
  };

  document.getElementById('add-mov').onclick = () => {
    mostrarModalMovimiento(cuentas);
  };

  function attachMovHandlers() {
    document.querySelectorAll('.edit-mov').forEach(btn => {
      btn.onclick = async () => {
        const id = Number(btn.dataset.id);
        const mov = await db.movimientos.get(id);
        if (mov) mostrarModalMovimiento(cuentas, mov);
      };
    });
    document.querySelectorAll('.del-mov').forEach(btn => {
      btn.onclick = () => {
        const id = Number(btn.dataset.id);
        const row = btn.closest('tr');
        mostrarConfirmacion('¿Eliminar este movimiento?', async () => {
          const mov = await db.movimientos.get(id);
          await borrarEntidad('movimientos', id);
          if (mov) {
            const c = await db.cuentas.get(mov.cuentaId);
            await db.cuentas.update(mov.cuentaId, { saldo: (+c.saldo || 0) - mov.importe });
          }
          row.remove();
          renderCuentas();
          if (location.hash === '#dashboard') renderDashboard();
        });
      };
    });
  }

  attachMovHandlers();

  document.getElementById('form-cuenta').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.saldo = parseFloat(data.saldo);
    db.cuentas.add(data).then(renderCuentas);
  };
}

async function renderDeudas() {
  const deudas = await db.deudas.toArray();
  const movs = await db.movimientosDeuda.toArray();
  let totalSaldo = 0, totalIntereses = 0, sumTinSaldo = 0;
  let proxVenc = null;
  let hayAlertas = false;
  const prioridades = await prioridadAmortizacionDeudas();
  const topPrioridad = new Set(prioridades.slice(0,3).map(p=>p.id));
  const filas = await Promise.all(deudas.map(async d => {
    const saldo = await calcularSaldoPendiente(d);
    const pagos = (+d.capitalInicial || 0) - saldo;
    const intereses = movs.filter(m => m.deudaId === d.id && (m.tipoMovimiento === 'Pago interés' || m.tipoMovimiento === 'Comisión'))
      .reduce((s,m)=>s+(+m.importe||0),0);
    totalSaldo += saldo;
    totalIntereses += intereses;
    const tin = parseFloat(d.tipoInteres || d.tin || 0);
    sumTinSaldo += saldo * tin;
    const vencDate = d.fechaVencimiento ? new Date(d.fechaVencimiento) : null;
    if (vencDate && (!proxVenc || vencDate < proxVenc)) proxVenc = vencDate;
    const pagosDeuda = movs.filter(m => m.deudaId === d.id && (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Pago interés'))
      .sort((a,b)=> new Date(b.fecha)-new Date(a.fecha));
    const lastPago = pagosDeuda[0]?.fecha;
    const sinPagoReciente = !lastPago || (new Date() - new Date(lastPago)) / 86400000 > 90;
    const vencida = vencDate && vencDate < new Date() && saldo > 0;
    hayAlertas = hayAlertas || vencida || sinPagoReciente;
    const alertIcons = `${vencida ? '⚠️' : ''}${sinPagoReciente ? ' ⏰' : ''}`;
    const pri = topPrioridad.has(d.id) ? '<span class="prioridad help" title="Prioridad alta para amortizar">⭐</span>' : '';
    return `<tr data-id="${d.id}">
      <td>${pri}${d.tipo || ''}</td>
      <td>${d.entidad || ''}</td>
      <td>${formatCurrency(d.capitalInicial)}</td>
      <td>${formatCurrency(saldo)}</td>
      <td>${d.tipoInteres || d.tin || 0}%</td>
      <td>${d.fechaVencimiento || ''} ${alertIcons}</td>
      <td>
        <button class="btn btn-small ver-deuda" data-id="${d.id}">Ver</button>
        <button class="btn btn-small edit-deuda" data-id="${d.id}">✏️</button>
        <button class="btn btn-small del-deuda" data-id="${d.id}">🗑️</button>
      </td>
    </tr>`;
  }));

  const sugerencias = await analizarCosteDeudasVsCuenta();

  const tinMedio = totalSaldo ? (sumTinSaldo / totalSaldo).toFixed(2) : 0;
  const proxVencStr = proxVenc ? proxVenc.toISOString().slice(0,10) : '-';
  const tipos = [...new Set(deudas.map(d=>d.tipo).filter(Boolean))];
  let html = `<div class="card">
      <h2>Deudas</h2>
      ${hayAlertas?'<div class="alert pendiente">Hay deudas vencidas o sin pagos recientes</div>':''}
      ${sugerencias.length?'<div class="alert pendiente">'+sugerencias.map(s=>s).join('<br>')+'</div>':''}
      <div class="filtros-table"><select id="filtro-deuda-tipo"><option value="">Todas</option>${tipos.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div>
      <div class="kpi-grid">
        <div class="kpi-card"><div class="kpi-icon">💰</div><div><div>Total pendiente</div><div class="kpi-value">${formatCurrency(totalSaldo)}</div></div></div>
        <div class="kpi-card"><div class="kpi-icon">💸</div><div><div>Intereses pagados</div><div class="kpi-value">${formatCurrency(totalIntereses)}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon">%📈</div><div><div>TIN medio</div><div class="kpi-value">${tinMedio}%</div></div></div>
      <div class="kpi-card"><div class="kpi-icon">📆</div><div><div>Próx. vencimiento</div><div class="kpi-value">${proxVencStr}</div></div></div>
    </div>
    <canvas id="grafico-deudas" height="120"></canvas>
    <button id="add-deuda" class="btn">Añadir deuda</button>
      <button id="sim-amort" class="btn">Simular amortización</button>
      <button id="plan-pagos" class="btn">Planificador mensual</button>
      <table class="tabla responsive-table"><thead><tr><th>Tipo</th><th>Entidad</th><th>Capital inicial</th><th>Saldo</th><th>TIN</th><th>Vencimiento</th><th></th></tr></thead><tbody>${filas.join('')}</tbody></table>
      <div id="detalle-deuda"></div>
    </div>`;
  app.innerHTML = html;
  renderGraficoComparativaDeudas();

  document.getElementById('add-deuda').onclick = () => mostrarModalDeuda();
  document.getElementById('sim-amort').onclick = () => mostrarModalSimularAmortizacion();
  const planBtn = document.getElementById('plan-pagos');
  if (planBtn) planBtn.onclick = () => { location.hash = '#planpagos'; };
  document.querySelectorAll('.edit-deuda').forEach(b => b.onclick = async () => {
    const d = await db.deudas.get(Number(b.dataset.id));
    if (d) mostrarModalDeuda(d);
  });
  document.querySelectorAll('.del-deuda').forEach(b => b.onclick = () => {
    const id = Number(b.dataset.id);
    mostrarConfirmacion('¿Eliminar esta deuda?', async () => {
      await db.movimientosDeuda.where('deudaId').equals(id).delete();
      await db.deudaHistory.where('deudaId').equals(id).delete();
      await borrarEntidad('deudas', id);
      renderDeudas();
    });
  });
  document.querySelectorAll('.ver-deuda').forEach(b => b.onclick = () => mostrarDetalleDeuda(Number(b.dataset.id)));
  document.querySelectorAll('.tabla tbody tr').forEach(tr => {
    tr.addEventListener('click', e => {
      if (e.target.tagName !== 'BUTTON') mostrarDetalleDeuda(Number(tr.dataset.id));
    });
  });
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
      mostrarModalActualizacion(data.version);
    } else {
      saveUserSetting('version', data.version);
    }
  } catch (e) {
    console.log('Sin conexión para comprobar actualizaciones');
  }
}
function renderAjustes() {
  const entidades = getEntidadesFinancieras();
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
          <label for="entidades-list">Entidades financieras</label>
          <textarea id="entidades-list" rows="4">${entidades.join('\n')}</textarea>
        </div>
        <div class="form-group">
          <label><input type="checkbox" id="chk-privacidad" ${privacidad ? 'checked' : ''}/> Modo privacidad</label>
        </div>
        <button class="btn" type="submit">Guardar ajustes</button>
        <div id="ajustes-msg" class="form-msg"></div>
      </form>
      <section>
        <h3>Gestión de Datos</h3>
        <p>
          <button id="btn-exp-json" class="btn">💾 Exportar JSON</button>
          <input type="file" id="inp-json" accept="application/json" hidden>
          <button id="btn-imp-json" class="btn">📤 Importar JSON</button>
        </p>
        <p>
          <select id="sel-csv-kind">
            <option value="transactions">Transacciones</option>
            <option value="accountMovements">Cuenta remunerada</option>
          </select>
          <button id="btn-exp-csv" class="btn">⬇️ Exportar CSV</button>
          <input type="file" id="inp-csv" accept=".csv" hidden>
          <button id="btn-imp-csv" class="btn">📥 Importar CSV</button>
        </p>
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
        setEntidadesFinancieras(
          document.getElementById('entidades-list').value
            .split('\n').map(s => s.trim()).filter(Boolean)
        ),
        setPrivacidad(document.getElementById('chk-privacidad').checked)
      ]);
      msg.textContent = 'Ajustes guardados correctamente';
      msg.classList.add('success');
    } catch (err) {
      msg.textContent = 'Error guardando ajustes';
      msg.classList.add('error');
    }
  });

  const btnExpJ = document.getElementById('btn-exp-json');
  const btnImpJ = document.getElementById('btn-imp-json');
  const inpJ = document.getElementById('inp-json');
  const btnExpC = document.getElementById('btn-exp-csv');
  const btnImpC = document.getElementById('btn-imp-csv');
  const inpC = document.getElementById('inp-csv');
  const selCsv = document.getElementById('sel-csv-kind');
  if (btnExpJ) btnExpJ.onclick = exportarJSON;
  if (btnImpJ) btnImpJ.onclick = () => inpJ.click();
  if (inpJ) inpJ.onchange = () => {
    if (inpJ.files[0]) importarJSON(inpJ.files[0]);
    inpJ.value = '';
  };
  if (btnExpC) btnExpC.onclick = () => exportarCSVTipo(selCsv.value);
  if (btnImpC) btnImpC.onclick = () => inpC.click();
  if (inpC) inpC.onchange = () => {
    if (inpC.files[0]) importarCSV(inpC.files[0], selCsv.value);
    inpC.value = '';
  };
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

function renderGlosario() {
  const defs = {
    'P&L':'Beneficio o pérdida. Diferencia entre valor actual y coste total.',
    'TIN':'Tipo de interés nominal.',
    'APY':'Rentabilidad anual equivalente.',
    'ROI':'Retorno de la inversión.',
    'TAE':'Tasa anual equivalente.',
    'Saveback':'Ahorro destinado a amortizar deudas o invertir.'
  };
  const lista = Object.entries(defs)
    .map(([t,d]) => `<dt>${t}</dt><dd>${d}</dd>`).join('');
  app.innerHTML = `<div class="card"><h2>Glosario financiero</h2><dl>${lista}</dl></div>`;
}

async function renderDebug() {
  if (!appState) await cargarEstado();
  const size = JSON.stringify(appState).length;
  const assets = appState.assets.length;
  const trans = appState.transactions.length;
  const lastTc = state.settings.lastExchangeUpdate ? new Date(state.settings.lastExchangeUpdate).toLocaleString() : 'N/A';
  const lastHist = appState.portfolioHistory.slice(-1)[0]?.fecha || 'N/A';
  app.innerHTML = `
    <div class="card">
      <h2>Estado de la app</h2>
      <p>Tamaño del state: ${size} bytes</p>
      <p>Activos registrados: ${assets}</p>
      <p>Transacciones registradas: ${trans}</p>
      <p>Última actualización de TC: ${lastTc}</p>
      <p>Último histórico de cartera: ${lastHist}</p>
    </div>`;
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
    db.deudas.toArray()
  ]);
  const porMes = {};
  movs.forEach(m => {
    const mes = (m.fecha || '').slice(0,7);
    porMes[mes] = (porMes[mes] || 0) + (+m.importe || 0);
  });
  const labels = Object.keys(porMes).sort();
  const saveData = labels.map(l => porMes[l]);
  const tin = prestamos[0]?.tipoInteres || prestamos[0]?.tin || 0;
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
  const hist = await db.portfolioHistory.orderBy('fecha').toArray();
  if (hist.length) {
    return {
      labels: hist.map(h=>h.fecha),
      data: hist.map(h=>h.valorTotal)
    };
  }
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

async function datosHistorialPatrimonio(rangoDias) {
  if (!state.historialPatrimonio.length) {
    state.historialPatrimonio = await db.historialPatrimonio.orderBy('fecha').toArray();
  }
  let hist = [...state.historialPatrimonio];
  hist.sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));
  if (rangoDias) {
    const limite = new Date();
    limite.setDate(limite.getDate() - rangoDias);
    const f = limite.toISOString().slice(0,10);
    hist = hist.filter(h=>h.fecha >= f);
  }
  return {
    labels: hist.map(h=>h.fecha),
    neto: hist.map(h=>h.patrimonioNeto),
    activos: hist.map(h=>h.activos),
    cuentas: hist.map(h=>h.cuentas),
    deudas: hist.map(h=>h.deudas)
  };
}

async function renderGraficoHistorialPatrimonio() {
  if (!hasChart) return;
  const sel = document.getElementById('filtro-hpat');
  const rango = sel && sel.value ? parseInt(sel.value) : null;
  const datos = await datosHistorialPatrimonio(rango);
  const ctxEl = document.getElementById('grafico-hist-patrimonio');
  if (!ctxEl) return;
  if (ctxEl.chart) ctxEl.chart.destroy();
  ctxEl.chart = new Chart(ctxEl.getContext('2d'), {
    type:'line',
    data:{
      labels:datos.labels,
      datasets:[
        {label:'Patrimonio neto', data:datos.neto, borderColor:'#2e7d32', tension:0.2},
        {label:'Activos', data:datos.activos, borderColor:'#3498db', tension:0.2},
        {label:'Cuentas', data:datos.cuentas, borderColor:'#3f8edc', tension:0.2},
        {label:'Deudas', data:datos.deudas.map(d=>-d), borderColor:'#e57373', tension:0.2}
      ]
    },
    options:{responsive:true}
  });
}

async function renderGraficosDashboard() {
  if (!hasChart) return;
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

  const pat = await calcularPatrimonioNeto();
  const ctxPat = document.getElementById('grafico-patrimonio').getContext('2d');
  new Chart(ctxPat, {type:'bar', data:{labels:['Activos','Cuenta','Deudas','Neto'], datasets:[{data:[pat.valorActivos, pat.saldoCuentas, -pat.deudaPendiente, pat.patrimonioNeto], backgroundColor:['#3498db','#3f8edc','#e57373','#2e7d32']}]}, options:{responsive:true, plugins:{legend:{display:false}}}});

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

async function exportarJSON() {
  if (!appState) await cargarEstado();
  const filename = `cartera-pro-datos-${new Date().toISOString().slice(0,10)}.json`;
  const blob = new Blob([JSON.stringify(appState)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

async function importarJSON(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') {
      alert('Archivo inválido');
      return false;
    }
    if (data.deudaMovimientos && !data.movimientosDeuda) {
      data.movimientosDeuda = data.deudaMovimientos;
    }
    if (data.prestamos && !data.deudas) {
      data.deudas = data.prestamos;
    }
    if (!Array.isArray(data.assets) || !Array.isArray(data.transactions) ||
        !data.settings || !Array.isArray(data.deudas) ||
        !Array.isArray(data.movimientosDeuda) ||
        !Array.isArray(data.deudaHistory) ||
        !Array.isArray(data.historialPatrimonio)) {
      alert('Archivo incompleto');
      return false;
    }
    for (const name of STORE_NAMES) {
      if (Array.isArray(data[name])) {
        await db[name].clear();
        if (data[name].length) await db[name].bulkAdd(data[name]);
      }
    }
    appState = JSON.parse(JSON.stringify(data));
    alert('Datos importados');
    return true;
  } catch (e) {
    alert('Error al importar: ' + e.message);
    return false;
  }
}

async function exportarCSVTipo(tipo) {
  const datos = [];
  if (tipo === 'transactions') {
    const trans = appState ? appState.transactions : await db.transactions.toArray();
    const assets = appState ? appState.assets : await db.assets.toArray();
    const mapa = {};
    assets.forEach(a => mapa[a.id] = a.ticker || '');
    trans.forEach(t => datos.push({
      assetId: t.activoId,
      assetTicker: mapa[t.activoId] || '',
      date: t.fecha,
      type: t.tipo,
      quantity: t.cantidad,
      pricePerUnit: t.precio,
      commission: t.comision,
      broker: t.broker
    }));
    exportarCSV(datos, 'transacciones.csv');
  } else if (tipo === 'accountMovements') {
    const movs = appState ? appState.movimientos : await db.movimientos.toArray();
    const cuentas = appState ? appState.cuentas : await db.cuentas.toArray();
    const mapa = {};
    cuentas.forEach(c => mapa[c.id] = c.banco || '');
    movs.forEach(m => datos.push({
      date: m.fecha,
      type: m.tipo,
      bank: mapa[m.cuentaId] || '',
      amount: m.importe,
      notes: m.descripcion || m.notas || ''
    }));
    exportarCSV(datos, 'movimientos.csv');
  }
}

async function importarCSV(file, tipo) {
  const text = await file.text();
  const rows = parseCSV(text);
  if (!rows.length) return;
  if (tipo === 'transactions') {
    const assets = appState ? appState.assets : await db.assets.toArray();
    const mapaTicker = {};
    assets.forEach(a => mapaTicker[(a.ticker || '').toUpperCase()] = a.id);
    for (const r of rows) {
      if (!r.date && !r.fecha) continue;
      const id = parseInt(r.id || r.ID);
      if (id && await db.transactions.get(id)) continue;
      let actId = parseInt(r.assetId || r.activoId || 0);
      const tkr = (r.assetTicker || r.ticker || '').toUpperCase();
      if (!actId && tkr) actId = mapaTicker[tkr];
      if (!actId && tkr) {
        actId = await db.assets.add({ nombre: tkr, ticker: tkr, tipo: '', moneda: 'EUR' });
        mapaTicker[tkr] = actId;
      }
      if (!actId) continue;
      const obj = {
        activoId: actId,
        fecha: r.date || r.fecha,
        tipo: r.type || r.tipo,
        cantidad: parseFloat(r.quantity || r.cantidad || 0),
        precio: parseFloat(r.pricePerUnit || r.precio || 0),
        comision: parseFloat(r.commission || r.comision || 0),
        broker: r.broker || ''
      };
      await db.transactions.add(obj);
    }
  } else if (tipo === 'accountMovements') {
    const cuentas = appState ? appState.cuentas : await db.cuentas.toArray();
    const mapaBanco = {};
    cuentas.forEach(c => mapaBanco[(c.banco || '').toUpperCase()] = c.id);
    for (const r of rows) {
      const id = parseInt(r.id || r.ID);
      if (id && await db.movimientos.get(id)) continue;
      let cId = mapaBanco[(r.bank || '').toUpperCase()];
      if (!cId && r.bank) {
        cId = await db.cuentas.add({ banco: r.bank, alias: r.bank, saldo: 0, tipo: 'corriente' });
        mapaBanco[(r.bank || '').toUpperCase()] = cId;
      }
      if (!cId) continue;
      const obj = {
        fecha: r.date || r.fecha,
        tipo: r.type || r.tipo,
        cuentaId: cId,
        importe: parseFloat(r.amount || r.importe || 0),
        descripcion: r.notes || r.descripcion || ''
      };
      await db.movimientos.add(obj);
    }
  }
  await cargarEstado();
}

async function exportarBackup() {
  const backup = {};
  if (appState) {
    Object.assign(backup, appState);
  } else {
    for (const tabla of db.tables) {
      backup[tabla.name] = await tabla.toArray();
    }
  }
  const filename = `CarteraPRO_backup_${new Date().toISOString().slice(0,10)}.json`;
  const blob = new Blob([JSON.stringify(backup)], {
    type: 'application/json'
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  localStorage.setItem('backupPendienteImportar', 'true');
}

async function importarBackupDesdeArchivo(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    for (const tabla of db.tables) {
      if (data[tabla.name]) {
        await tabla.clear();
        if (data[tabla.name].length) {
          await tabla.bulkAdd(data[tabla.name]);
        }
      }
    }
    appState = JSON.parse(JSON.stringify(data));
    alert('Copia restaurada correctamente');
    return true;
  } catch (e) {
    alert('Error al importar: ' + e.message);
    return false;
  }
}

function mostrarModalImportarBackup() {
  if (document.getElementById('import-modal')) return;
  const div = document.createElement('div');
  div.id = 'import-modal';
  div.className = 'modal';
  div.innerHTML = `
    <div class="modal-content">
      <p>¿Deseas importar la copia de seguridad que descargaste antes de actualizar? Puedes hacerlo ahora para restaurar tus datos anteriores.</p>
      <input type="file" id="sel-backup" accept="application/json" />
      <p><button class="btn" id="btn-importar">Importar</button>
      <button class="btn" id="cerrar-import">Cerrar</button></p>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('btn-importar').onclick = async () => {
    const f = document.getElementById('sel-backup').files[0];
    if (!f) return alert('Selecciona un archivo');
    const ok = await importarBackupDesdeArchivo(f);
    if (ok) {
      div.remove();
      localStorage.removeItem('backupPendienteImportar');
    }
  };
  document.getElementById('cerrar-import').onclick = () => {
    div.remove();
    localStorage.removeItem('backupPendienteImportar');
  };
}

function mostrarModalActualizacion(nuevaVersion) {
  if (document.getElementById('update-modal')) return;
  const div = document.createElement('div');
  div.id = 'update-modal';
  div.className = 'modal';
  div.innerHTML = `
    <div class="modal-content">
      <p>Se ha generado una copia de seguridad. Por favor, guarda este archivo antes de continuar con la actualización.</p>
      <p><button class="btn" id="descargar-backup">Descargar backup</button></p>
      <p><button class="btn" id="confirm-update" disabled>Actualizar ahora</button></p>
      <p><button class="btn" id="cancel-update">Cancelar</button></p>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('descargar-backup').onclick = async () => {
    await exportarBackup();
    document.getElementById('confirm-update').disabled = false;
  };
  document.getElementById('confirm-update').onclick = () => {
    proceedUpdate(nuevaVersion);
  };
  document.getElementById('cancel-update').onclick = () => {
    div.remove();
  };
}

async function proceedUpdate(nuevaVersion) {
  const modal = document.getElementById('update-modal');
  if (modal) modal.remove();
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  saveUserSetting('version', nuevaVersion);
  location.reload(true);
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
    await actualizarEntidad('assets', { ...data, id });
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

async function mostrarModalMovimiento(cuentas, mov) {
  crearModalMovimiento();
  const modal = document.getElementById('mov-modal');
  const form = document.getElementById('form-mov');
  const lista = document.getElementById('sel-cuenta');
  lista.innerHTML = cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

  if (mov) {
    modal.querySelector('h3').textContent = 'Editar movimiento';
    form.cuentaId.value = mov.cuentaId;
    form.fecha.value = mov.fecha || '';
    form.importe.value = mov.importe;
    form.tipo.value = mov.tipo;
    form.descripcion.value = mov.descripcion || '';
    form.dataset.id = mov.id;
  } else {
    modal.querySelector('h3').textContent = 'Nuevo movimiento';
    form.reset();
    form.dataset.id = '';
  }

  modal.classList.remove('hidden');

  modal.querySelector('#cancel-mov').onclick = () => {
    modal.classList.add('hidden');
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.cuentaId = parseInt(data.cuentaId);
    data.importe = parseFloat(data.importe);

    const id = form.dataset.id;
    if (id) {
      const anterior = await db.movimientos.get(Number(id));
      await actualizarEntidad('movimientos', { ...data, id: Number(id) });
      if (anterior) {
        if (anterior.cuentaId === data.cuentaId) {
          const c = await db.cuentas.get(data.cuentaId);
          await db.cuentas.update(data.cuentaId, { saldo: (+c.saldo || 0) - anterior.importe + data.importe });
        } else {
          const cOld = await db.cuentas.get(anterior.cuentaId);
          const cNew = await db.cuentas.get(data.cuentaId);
          await db.cuentas.update(anterior.cuentaId, { saldo: (+cOld.saldo || 0) - anterior.importe });
          await db.cuentas.update(data.cuentaId, { saldo: (+cNew.saldo || 0) + data.importe });
        }
      }
    } else {
      const cuenta = await db.cuentas.get(data.cuentaId);
      const obj = {
        cuentaId: data.cuentaId,
        fecha: data.fecha,
        importe: data.importe,
        descripcion: data.descripcion || '',
        tipo: data.tipo
      };
      const newId = await db.movimientos.add(obj);
      obj.id = newId;
      state.accountMovements.push(obj);
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
        <input name="broker" id="inp-broker" list="lista-entidades" placeholder="Entidad" />
        <datalist id="lista-entidades"></datalist>
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
  actualizarDatalistEntidades();
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
    const prom = id ? actualizarEntidad('transactions', { ...data, id: Number(id) })
                    : actualizarEntidad('transactions', data);
  prom.then(() => {
      modal.classList.add('hidden');
      renderTransacciones();
    });
  };
}

// ----- Modal Deuda -----
function crearModalDeuda() {
  if (document.getElementById('deuda-modal')) return;
  const div = document.createElement('div');
  div.id = 'deuda-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nueva deuda</h3>
      <form id="form-deuda">
        <select name="tipo">
          <option value="Préstamo personal">Préstamo personal</option>
          <option value="Hipoteca">Hipoteca</option>
        </select>
        <input name="descripcion" placeholder="Descripción" required />
        <input name="entidad" id="inp-entidad" list="lista-entidades" placeholder="Entidad" required />
        <input type="date" name="fechaInicio" required />
        <input type="date" name="fechaVencimiento" />
        <input type="number" step="any" min="0" name="capitalInicial" placeholder="Capital inicial" required />
        <input type="number" step="any" min="0" name="tipoInteres" placeholder="TIN %" required />
        <label><input type="checkbox" name="interesFijo" /> Interés fijo</label>
        <label><input type="checkbox" name="pagoAutomatico" /> Pago automático mensual</label>
        <input name="inmuebleAsociado" placeholder="Inmueble (si hipoteca)" />
        <textarea name="notas" placeholder="Notas"></textarea>
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-deuda">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
  if (!document.getElementById('lista-entidades')) {
    const dl = document.createElement('datalist');
    dl.id = 'lista-entidades';
    document.body.appendChild(dl);
  }
}

function mostrarModalDeuda(deuda) {
  crearModalDeuda();
  const modal = document.getElementById('deuda-modal');
  const form = document.getElementById('form-deuda');
  actualizarDatalistEntidades();
  if (deuda) {
    modal.querySelector('h3').textContent = 'Editar deuda';
    Object.keys(deuda).forEach(k => {
      if (form[k] !== undefined) form[k].value = deuda[k] || '';
    });
    form.interesFijo.checked = !!deuda.interesFijo;
    form.pagoAutomatico.checked = !!deuda.pagoAutomatico;
    form.dataset.id = deuda.id;
  } else {
    modal.querySelector('h3').textContent = 'Nueva deuda';
    form.reset();
    form.dataset.id = '';
  }
  modal.classList.remove('hidden');
  modal.querySelector('#cancel-deuda').onclick = () => modal.classList.add('hidden');
  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.capitalInicial = parseFloat(data.capitalInicial);
    data.tipoInteres = parseFloat(data.tipoInteres);
    data.interesFijo = form.interesFijo.checked;
    data.pagoAutomatico = form.pagoAutomatico.checked;
    const entidades = getEntidadesFinancieras();
    if (!entidades.includes(data.entidad)) { alert('Selecciona una entidad válida'); return; }
    if (isNaN(data.capitalInicial) || data.capitalInicial <= 0) { alert('Importe inválido'); return; }
    if (isNaN(data.tipoInteres) || data.tipoInteres <= 0) { alert('TIN inválido'); return; }
    if (data.fechaVencimiento && data.fechaVencimiento < data.fechaInicio) { alert('Fechas incoherentes'); return; }
    const id = form.dataset.id;
    if (id) await actualizarEntidad('deudas', { ...data, id: Number(id) });
    else await db.deudas.add(data);
    modal.classList.add('hidden');
    renderDeudas();
  };
}

function crearModalDeudaMovimiento() {
  if (document.getElementById('deuda-mov-modal')) return;
  const div = document.createElement('div');
  div.id = 'deuda-mov-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nuevo movimiento</h3>
      <form id="form-deuda-mov">
        <input type="hidden" name="deudaId" />
        <input type="date" name="fecha" required />
        <select name="tipoMovimiento">
          <option value="Pago capital">Pago capital</option>
          <option value="Pago interés">Pago interés</option>
          <option value="Comisión">Comisión</option>
          <option value="Cancelación anticipada">Cancelación anticipada</option>
        </select>
        <input type="number" step="any" name="importe" placeholder="Importe" required />
        <input name="nota" placeholder="Nota" />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-deuda-mov">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalDeudaMovimiento(deudaId, mov) {
  crearModalDeudaMovimiento();
  const modal = document.getElementById('deuda-mov-modal');
  const form = document.getElementById('form-deuda-mov');
  form.deudaId.value = deudaId;
  if (mov) {
    modal.querySelector('h3').textContent = 'Editar movimiento';
    form.fecha.value = mov.fecha || '';
    form.tipoMovimiento.value = mov.tipoMovimiento;
    form.importe.value = mov.importe;
    form.nota.value = mov.nota || '';
    form.dataset.id = mov.id;
  } else {
    modal.querySelector('h3').textContent = 'Nuevo movimiento';
    form.reset();
    form.deudaId.value = deudaId;
    form.dataset.id = '';
  }
  modal.classList.remove('hidden');
  modal.querySelector('#cancel-deuda-mov').onclick = () => modal.classList.add('hidden');
  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    data.deudaId = Number(data.deudaId);
    data.importe = parseFloat(data.importe);
    if (!data.fecha || isNaN(new Date(data.fecha).getTime())) { alert('Fecha inválida'); return; }
    if (isNaN(data.importe) || data.importe <= 0) { alert('Importe inválido'); return; }
    const id = form.dataset.id;
    if (id) await actualizarEntidad('movimientosDeuda', { ...data, id: Number(id) });
    else await db.movimientosDeuda.add(data);
    if (data.tipoMovimiento === 'Pago capital' || data.tipoMovimiento === 'Cancelación anticipada') {
      await registrarHistoricoDeuda(data.deudaId, data.fecha);
    }
    modal.classList.add('hidden');
    mostrarDetalleDeuda(data.deudaId);
    renderDeudas();
  };
}

function crearModalSimularAmortizacion() {
  if (document.getElementById('sim-amort-modal')) return;
  const div = document.createElement('div');
  div.id = 'sim-amort-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Simular amortización</h3>
      <form id="form-sim-amort">
        <input type="number" step="any" name="capital" placeholder="Capital" required />
        <input type="number" step="any" name="tin" placeholder="TIN %" required />
        <input type="number" step="any" name="plazo" placeholder="Plazo (años)" required />
        <select name="frecuencia">
          <option value="12">Mensual</option>
          <option value="4">Trimestral</option>
          <option value="1">Anual</option>
        </select>
        <button class="btn">Calcular</button>
        <button type="button" class="btn" id="cancel-sim-amort">Cerrar</button>
      </form>
      <div id="sim-amort-res" class="mini-explica"></div>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalSimularAmortizacion(prefill) {
  crearModalSimularAmortizacion();
  const modal = document.getElementById('sim-amort-modal');
  const form = document.getElementById('form-sim-amort');
  const res = document.getElementById('sim-amort-res');
  form.reset();
  if (prefill) {
    form.capital.value = prefill.capital || '';
    form.tin.value = prefill.tin || '';
    form.plazo.value = prefill.plazo || '';
    form.frecuencia.value = prefill.frecuencia || '12';
  }
  modal.classList.remove('hidden');
  modal.querySelector('#cancel-sim-amort').onclick = () => {
    modal.classList.add('hidden');
    res.textContent = '';
  };
  form.onsubmit = e => {
    e.preventDefault();
    const capital = parseFloat(form.capital.value);
    const tin = parseFloat(form.tin.value) / 100;
    const plazo = parseFloat(form.plazo.value);
    const freq = parseInt(form.frecuencia.value);
    const n = plazo * freq;
    const i = tin / freq;
    const cuota = capital * i / (1 - Math.pow(1 + i, -n));
    const totalPagado = cuota * n;
    const totalInteres = totalPagado - capital;
    const interes1 = capital * i;
    const capital1 = cuota - interes1;
    res.innerHTML =
      `Cuota: ${formatCurrency(cuota)} · Interés total: ${formatCurrency(totalInteres)}<br>Primer pago → Interés: ${formatCurrency(interes1)}, Capital: ${formatCurrency(capital1)}`;
  };
}

function diffMeses(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1;
}

function diffDias(a, b) {
  return Math.ceil((b - a) / 86400000);
}

async function calcularSaldoPendiente(id) {
  const deuda = typeof id === 'object' ? id : await db.deudas.get(id);
  if (!deuda) return 0;
  const movs = await db.movimientosDeuda.where('deudaId').equals(deuda.id).toArray();
  const pagos = movs
    .filter(m => m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Cancelación anticipada')
    .reduce((s, m) => s + (+m.importe || 0), 0);
  return (+deuda.capitalInicial || 0) - pagos;
}

async function calcularAmortizacionDeuda(id) {
  const deuda = typeof id === 'object' ? id : await db.deudas.get(id);
  if (!deuda) return null;
  const movs = await db.movimientosDeuda.where('deudaId').equals(deuda.id).toArray();
  const amortizado = movs.filter(m => m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Cancelación anticipada')
    .reduce((s,m)=>s+(+m.importe||0),0);
  const pagosRealizados = movs.filter(m => m.tipoMovimiento === 'Pago capital').length;
  const pendiente = (+deuda.capitalInicial || 0) - amortizado;
  const totalMeses = deuda.fechaInicio && deuda.fechaVencimiento ?
      diffMeses(new Date(deuda.fechaInicio), new Date(deuda.fechaVencimiento)) : 1;
  const mesesRestantes = Math.max(1, totalMeses - pagosRealizados);
  const i = (parseFloat(deuda.tipoInteres || deuda.tin || 0) / 100) / 12;
  const cuota = pendiente * i / (1 - Math.pow(1 + i, -mesesRestantes));
  const interes = pendiente * i;
  const capital = cuota - interes;
  return { cuota, interes, capital, mesesRestantes, capitalPendiente: pendiente };
}

async function registrarCuotaAutomatica(id, fecha) {
  const info = await calcularAmortizacionDeuda(id);
  if (!info) return;
  const f = fecha || new Date().toISOString().slice(0,10);
  await db.movimientosDeuda.bulkAdd([
    { deudaId: id, fecha: f, tipoMovimiento: 'Pago interés', importe: parseFloat(info.interes.toFixed(2)) },
    { deudaId: id, fecha: f, tipoMovimiento: 'Pago capital', importe: parseFloat(info.capital.toFixed(2)) }
  ]);
  await registrarHistoricoDeuda(id, f);
}

async function procesarPagosAutomaticos() {
  const [deudas, movs] = await Promise.all([
    db.deudas.where('pagoAutomatico').equals(1).toArray(),
    db.movimientosDeuda.toArray()
  ]);
  const hoy = new Date();
  for (const d of deudas) {
    const lista = movs
      .filter(m => m.deudaId === d.id && (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Pago interés'))
      .sort((a,b)=> new Date(b.fecha) - new Date(a.fecha));
    let fecha = lista[0] ? new Date(lista[0].fecha) : new Date(d.fechaInicio || hoy);
    if (isNaN(fecha)) fecha = hoy;
    fecha.setMonth(fecha.getMonth() + 1);
    while (fecha <= hoy) {
      const fstr = fecha.toISOString().slice(0,10);
      const existe = movs.some(m => m.deudaId === d.id && m.fecha === fstr && (m.tipoMovimiento === 'Pago capital' || m.tipoMovimiento === 'Pago interés'));
      if (!existe) {
        await registrarCuotaAutomatica(d.id, fstr);
        movs.push({ deudaId: d.id, fecha: fstr, tipoMovimiento: 'Pago capital' });
      }
      fecha.setMonth(fecha.getMonth() + 1);
      if (d.fechaVencimiento && new Date(d.fechaVencimiento) < fecha) break;
    }
  }
}

async function mostrarDetalleDeuda(id) {
  const cont = document.getElementById('detalle-deuda');
  const deuda = await db.deudas.get(id);
  const movs = await db.movimientosDeuda.where('deudaId').equals(id).toArray();
  const saldo = await calcularSaldoPendiente(deuda);
  let resumen = `<p><strong>${deuda.descripcion}</strong> (${deuda.tipo || ''})<br>
    Entidad: ${deuda.entidad || ''} · Capital inicial: ${formatCurrency(deuda.capitalInicial)} · Saldo pendiente: ${formatCurrency(saldo)} · Interés: ${(deuda.tipoInteres || deuda.tin || 0)}% · Vencimiento: ${deuda.fechaVencimiento || ''}</p>`;
  const prioridades = await prioridadAmortizacionDeudas();
  const top = new Set(prioridades.slice(0,3).map(p=>p.id));
  if (top.has(deuda.id)) {
    resumen += ' <span class="prioridad help" title="Prioridad alta para amortizar">⭐</span>';
  }
  if (deuda.tipo === 'Hipoteca' && deuda.inmuebleAsociado) {
    const bienId = Number(deuda.inmuebleAsociado);
    const bien = await db.bienes.get(bienId);
    if (bien) resumen += `<p>Valor inmueble: ${formatCurrency(bien.valorActual || bien.valorCompra)}</p>`;
  }
  const tinCuenta = state.interestRates[state.interestRates.length-1]?.tin || 0;
  const tinDeuda = parseFloat(deuda.tipoInteres || deuda.tin || deuda.tae || 0);
  if (saldo > 0 && tinDeuda > tinCuenta) {
    resumen += `<div class="alert pendiente">💡 Tu cuenta remunera al ${tinCuenta}% pero estás pagando un ${tinDeuda}% por tu deuda ${deuda.descripcion}. Podrías amortizar para ahorrar intereses.</div>`;
  }
  resumen += `<p>Pago automático: ${deuda.pagoAutomatico ? 'Sí' : 'No'} <button id="toggle-auto" class="btn btn-small">${deuda.pagoAutomatico ? 'Desactivar' : 'Activar'}</button></p>`;
  const filas = movs.map(m => `<tr data-id="${m.id}"><td>${m.fecha}</td><td>${m.tipoMovimiento}</td><td>${formatCurrency(m.importe)}</td><td class="col-ocultar">${m.nota||''}</td><td><button class="btn btn-small edit-dmov" data-id="${m.id}">✏️</button><button class="btn btn-small del-dmov" data-id="${m.id}">🗑️</button></td></tr>`).join('');
  cont.innerHTML = `<section class="detalle">
      ${resumen}
      <table class="tabla-detalle responsive-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Importe</th><th class="col-ocultar">Nota</th><th></th></tr></thead><tbody>${filas}</tbody></table>
      <button class="btn" id="add-mov-deuda">Añadir movimiento</button>
      <button class="btn" id="reg-cuota">Registrar cuota</button>
      <button class="btn" id="sim-cuota">Simular cuota</button>
      <canvas id="grafico-saldo-deuda" height="120"></canvas>
    </section>`;
  document.getElementById('add-mov-deuda').onclick = () => mostrarModalDeudaMovimiento(id);
  document.getElementById('reg-cuota').onclick = async () => {
    const fecha = prompt('Fecha', new Date().toISOString().slice(0,10));
    if (!fecha) return;
    await registrarCuotaAutomatica(id, fecha);
    mostrarDetalleDeuda(id);
    renderDeudas();
  };
  document.getElementById('sim-cuota').onclick = () => {
    const plazoMeses = deuda.fechaInicio && deuda.fechaVencimiento ? diffMeses(new Date(deuda.fechaInicio), new Date(deuda.fechaVencimiento)) : 12;
    mostrarModalSimularAmortizacion({
      capital: saldo,
      tin: deuda.tipoInteres || deuda.tin || 0,
      plazo: (plazoMeses / 12),
      frecuencia: 12
    });
  };
  document.getElementById('toggle-auto').onclick = async () => {
    deuda.pagoAutomatico = !deuda.pagoAutomatico;
    await actualizarEntidad('deudas', deuda);
    mostrarDetalleDeuda(id);
    renderDeudas();
  };
  cont.querySelectorAll('.edit-dmov').forEach(b => b.onclick = async () => {
    const mv = await db.movimientosDeuda.get(Number(b.dataset.id));
    if (mv) mostrarModalDeudaMovimiento(id, mv);
  });
  cont.querySelectorAll('.del-dmov').forEach(b => b.onclick = () => {
    const movId = Number(b.dataset.id);
    mostrarConfirmacion('¿Borrar movimiento?', async () => {
      await borrarEntidad('movimientosDeuda', movId);
      mostrarDetalleDeuda(id);
      renderDeudas();
    });
  });
  renderGraficoHistorialDeuda(id);
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

function scheduleAutoBackup() {
  setInterval(async () => {
    if (!appState) await cargarEstado();
    const fecha = new Date().toISOString();
    try {
      await db.backups.add({ fecha, data: JSON.stringify(appState) });
      const all = await db.backups.orderBy('fecha').toArray();
      if (all.length > 5) await db.backups.delete(all[0].id);
    } catch {}
  }, 6 * 60 * 60 * 1000);
}

function initDragAndDrop() {
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (f.name.toLowerCase().endsWith('.json')) {
      if (confirm('Importar datos desde JSON?')) importarJSON(f);
    } else if (f.name.toLowerCase().endsWith('.csv')) {
      const tipo = prompt('Tipo de CSV (transactions/accountMovements)', 'transactions');
      if (tipo) importarCSV(f, tipo);
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } catch {}
  }
  await initAjustes();
  await cargarEstado();
  state.accountMovements = await db.movimientos.toArray();
  state.interestRates = await db.interestRates.toArray();
  state.portfolioHistory = await db.portfolioHistory.toArray();
  state.deudas = await db.deudas.toArray();
  state.movimientosDeuda = await db.movimientosDeuda.toArray();
  state.deudaHistory = await db.deudaHistory.toArray();
  state.historialPatrimonio = await db.historialPatrimonio.toArray();
  await procesarPagosAutomaticos();
  document.body.setAttribute('data-theme', getTema());
  initDragAndDrop();
  registrarHistoricoCartera();
  registrarHistorialPatrimonio();
  scheduleAutoBackup();
  navegar();
  window.addEventListener("hashchange", navegar);
  if (localStorage.getItem('backupPendienteImportar')) {
    mostrarModalImportarBackup();
  }
  checkForUpdates();
});
