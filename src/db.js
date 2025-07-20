// Configuración de IndexedDB con Dexie
const db = new Dexie('carteraPRO');
db.version(1).stores({
  activos: "++id, nombre, ticker, tipo, sector, moneda, valorActual, region, broker, isin, etiquetas",
  transacciones: "++id, fecha, tipo, activoId, cantidad, precio, comision, broker, cambio, notas",
  movimientos: "++id, fecha, tipo, cuentaId, importe, descripcion, saveback, categoria, notas",
  cuentas: "++id, banco, iban, alias, saldo, tipo, principal, notas",
  tarjetas: "++id, cuentaId, numero, tipo, saldo, limite, vencimiento, notas",
  gastos: "++id, fecha, importe, tipo, categoria, descripcion, cuentaId, bienId, notas",
  ingresos: "++id, fecha, importe, tipo, origen, cuentaId, bienId, activoId, notas",
  suscripciones: "++id, nombre, importe, periodicidad, proximoPago, cuentaId, tarjetaId, bienId, activoId, categoria, notas",
  bienes: "++id, descripcion, tipo, valorCompra, valorActual, direccion, propietario, notas",
  prestamos: "++id, bienId, tipo, principal, saldoPendiente, tin, tae, plazoMeses, cuota, interesesPagados, notas",
  seguros: "++id, bienId, tipo, prima, inicio, vencimiento, notas",
  historico: "fecha, valorTotal, saldoCuentas, saveback, resumenPorActivo, resumenPorBien, tiposCambio",
  carteras: "++id, nombre, descripcion, propietario, activos",
  documentos: "++id, entidad, entidadId, tipo, url, descripcion, fecha",
  logs: "++id, fecha, accion, entidad, entidadId, usuario, descripcion",
  tiposCambio: "++id, moneda, tasa, fecha",
  interestRates: "++id, fecha, tin",
  ajustes: "clave, valor"
});
// Para compatibilidad con versiones anteriores
window.db = db;


const app = document.getElementById("app");
const state = {
  accountMovements: [],
  interestRates: [],
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

