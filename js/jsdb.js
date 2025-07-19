
// js/db.js
// Dexie.js - IndexedDB para Cartera PRO con datos simulados

const db = new Dexie("carteraPRO");

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
  ajustes: "clave, valor"
});

db.on('populate', async () => {
  await db.ajustes.bulkPut([
    { clave: "tema", valor: "claro" },
    { clave: "idioma", valor: "es" }
  ]);

  await db.activos.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    nombre: `ETF Simulado ${i+1}`,
    ticker: `ETF${i+1}`,
    tipo: "ETF",
    sector: "Global",
    moneda: "EUR",
    valorActual: 1000 + i * 50,
    region: "Europa",
    broker: "Trade Republic",
    isin: `DE00000000${i+1}`,
    etiquetas: "largo plazo"
  })));

  await db.cuentas.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    banco: `Banco ${i+1}`,
    iban: `ES${i+1}0000000000000000`,
    alias: `Cuenta ${i+1}`,
    saldo: 1000 + i * 200,
    tipo: i % 2 === 0 ? "Corriente" : "Broker",
    principal: i === 0,
    notas: "Simulada"
  })));

  await db.transacciones.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    fecha: `2025-07-${(i+1).toString().padStart(2, '0')}`,
    tipo: "Compra",
    activoId: (i % 10) + 1,
    cantidad: 10 + i,
    precio: 50 + i,
    comision: 0.5,
    broker: "Trade Republic",
    cambio: 1.0,
    notas: "Compra simulada"
  })));

  await db.gastos.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    fecha: `2025-06-${(i+1).toString().padStart(2, '0')}`,
    importe: 50 + i,
    tipo: "Doméstico",
    categoria: "Vivienda",
    descripcion: `Gasto simulado ${i+1}`,
    cuentaId: 1,
    bienId: null,
    notas: ""
  })));

  await db.ingresos.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    fecha: `2025-06-${(i+1).toString().padStart(2, '0')}`,
    importe: 1000 + i * 100,
    tipo: "Nómina",
    origen: "Empresa Ficticia",
    cuentaId: 1,
    bienId: null,
    activoId: null,
    notas: ""
  })));

  await db.suscripciones.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    nombre: `Servicio ${i+1}`,
    importe: 9.99 + i,
    periodicidad: "Mensual",
    proximoPago: `2025-08-${(i+1).toString().padStart(2, '0')}`,
    cuentaId: 1,
    tarjetaId: null,
    bienId: null,
    activoId: null,
    categoria: "Streaming",
    notas: ""
  })));

  await db.bienes.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    descripcion: `Bien ${i+1}`,
    tipo: "Inmueble",
    valorCompra: 100000 + i * 5000,
    valorActual: 110000 + i * 6000,
    direccion: `Calle Falsa ${i+1}`,
    propietario: "Adrián",
    notas: ""
  })));

  await db.prestamos.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    bienId: i + 1,
    tipo: "Hipoteca",
    principal: 80000,
    saldoPendiente: 40000 - i * 1000,
    tin: 1.5,
    tae: 1.8,
    plazoMeses: 240,
    cuota: 350,
    interesesPagados: 3000,
    notas: ""
  })));

  await db.seguros.bulkPut([...Array(10)].map((_, i) => ({
    id: i + 1,
    bienId: i + 1,
    tipo: "Hogar",
    prima: 300 + i,
    inicio: `2025-01-01`,
    vencimiento: `2026-01-01`,
    notas: ""
  })));
});

window.db = db;
