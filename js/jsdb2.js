// js/db.js
// ===========================
// Dexie.js - IndexedDB para Cartera PRO
// ===========================

// Importa Dexie desde el CDN en index.html antes de cualquier otro script:
// <script type="module">
//   import Dexie from "https://cdn.jsdelivr.net/npm/dexie@3.2.6/dist/dexie.mjs";
//   window.Dexie = Dexie;
// </script>

export const db = new window.Dexie("carteraPRO");

// Definición de tablas y relaciones
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
  logs: "++id, fecha, accion, entidad, entidadId, usuario, descripcion"
});

// Al poblar la DB por primera vez, crea datos de ejemplo
db.on('populate', async function() {
  await db.activos.bulkPut([
    { id: 1, nombre: "iShares Core MSCI World", ticker: "EUNL", tipo: "ETF", sector: "Global", moneda: "EUR", valorActual: 14500, region: "Europa", broker: "Trade Republic" },
    { id: 2, nombre: "Vanguard S&P 500", ticker: "VUSA", tipo: "ETF", sector: "USA", moneda: "USD", valorActual: 7800, region: "USA", broker: "Revolut" },
    { id: 3, nombre: "BTC", ticker: "BTC", tipo: "Cripto", sector: "Digital", moneda: "USD", valorActual: 2200, region: "Cripto", broker: "Binance" },
    { id: 4, nombre: "Acción Telefónica", ticker: "TEF", tipo: "Acción", sector: "Telecom", moneda: "EUR", valorActual: 600, region: "Europa", broker: "DEGIRO" },
    { id: 5, nombre: "Acción Apple", ticker: "AAPL", tipo: "Acción", sector: "Tecnología", moneda: "USD", valorActual: 950, region: "USA", broker: "Revolut" }
  ]);
  await db.cuentas.bulkPut([
    { id: 1, banco: "BBVA", iban: "ES9100000000000000000000", alias: "BBVA principal", saldo: 4100, tipo: "corriente", principal: true },
    { id: 2, banco: "MyInvestor", iban: "ES9200000000000000000000", alias: "Cuenta remunerada", saldo: 8000, tipo: "remunerada", principal: false }
  ]);
  await db.bienes.bulkPut([
    { id: 1, descripcion: "Piso principal Madrid", tipo: "Vivienda", valorCompra: 185000, valorActual: 220000, direccion: "C/ Mayor 12", propietario: "Adrián" },
    { id: 2, descripcion: "Plaza garaje A", tipo: "Garaje", valorCompra: 18000, valorActual: 19000, direccion: "C/ Mayor 12", propietario: "Adrián" }
  ]);
  await db.gastos.bulkPut([
    { id: 1, fecha: "2025-06-01", importe: 780, tipo: "Hipoteca", categoria: "Vivienda", descripcion: "Cuota mensual", cuentaId: 1, bienId: 1 },
    { id: 2, fecha: "2025-06-08", importe: 95, tipo: "Suministro", categoria: "Luz", descripcion: "Factura Luz", cuentaId: 1, bienId: 1 }
  ]);
  await db.ingresos.bulkPut([
    { id: 1, fecha: "2025-06-05", importe: 1350, tipo: "Nómina", origen: "Trabajo", cuentaId: 1, bienId: null, activoId: null },
    { id: 2, fecha: "2025-06-20", importe: 750, tipo: "Alquiler", origen: "Inquilino", cuentaId: 1, bienId: 2 }
  ]);
  await db.suscripciones.bulkPut([
    { id: 1, nombre: "Netflix", importe: 14.99, periodicidad: "Mensual", proximoPago: "2025-07-14", cuentaId: 1 },
    { id: 2, nombre: "Seguro Hogar", importe: 160, periodicidad: "Anual", proximoPago: "2026-05-10", cuentaId: 1, bienId: 1 }
  ]);
  // Puedes seguir rellenando para préstamos, transacciones, movimientos, etc.
});

// Helpers de import/export para toda la DB
export async function exportTable(tabla) {
  return await db[tabla].toArray();
}
export async function importTable(tabla, arr, clear = false) {
  if (clear) await db[tabla].clear();
  return await db[tabla].bulkPut(arr);
}
export async function exportBackup() {
  const data = {};
  for (const tabla of Object.keys(db.tablesByName)) {
    data[tabla] = await db[tabla].toArray();
  }
  return data;
}
export async function importBackup(data, clear = false) {
  for (const tabla in data) {
    if (db[tabla]) await importTable(tabla, data[tabla], clear);
  }
}
export async function resetDB() {
  await db.delete();
  location.reload();
}
