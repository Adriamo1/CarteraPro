// database.js - esquema central de IndexedDB usando Dexie
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

window.db = db;
