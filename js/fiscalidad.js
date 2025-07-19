// js/fiscalidad.js
import { db } from './db.js';

// Calcula KPIs fiscales del año: plusvalías, minusvalías, dividendos, retenciones, neto, minusvalías pendientes...
export async function informeFiscal({ year }) {
  const trans = await db.transacciones.toArray();
  const ingresos = await db.ingresos.toArray();

  // Filtra por año
  const tYear = trans.filter(t => t.fecha && new Date(t.fecha).getFullYear() === Number(year));
  const iYear = ingresos.filter(i => i.fecha && new Date(i.fecha).getFullYear() === Number(year));

  // Plusvalías/minusvalías por ventas (simplificado: precio venta - compra)
  let plusvalias = 0, minusvalias = 0;
  for (const t of tYear) {
    if (t.tipo === "venta") {
      // Busca la compra original (simplificado: media ponderada)
      const compras = trans.filter(c => c.activoId === t.activoId && c.tipo === "compra" && new Date(c.fecha) <= new Date(t.fecha));
      const cantidadComprada = compras.reduce((s, c) => s + (+c.cantidad || 0), 0);
      const totalInvertido = compras.reduce((s, c) => s + (+c.cantidad || 0) * (+c.precio || 0), 0);
      const precioMedio = cantidadComprada ? totalInvertido / cantidadComprada : 0;
      const resultado = (+t.cantidad || 0) * ((+t.precio || 0) - precioMedio);
      if (resultado > 0) plusvalias += resultado;
      else minusvalias += resultado;
    }
  }

  // Dividendos y retenciones
  const dividendosBrutos = iYear.filter(i => (i.tipo || "").toLowerCase() === "dividendo")
    .reduce((s, i) => s + (+i.importe || 0), 0);
  // Puedes añadir campos retención local/extranjera si existen en los ingresos, aquí usamos 0 por defecto
  const retLocal = iYear.filter(i => (i.retLocal)).reduce((s,i) => s + (+i.retLocal || 0), 0);
  const retExtranj = iYear.filter(i => (i.retExtranj)).reduce((s,i) => s + (+i.retExtranj || 0), 0);
  const dividendosNetos = dividendosBrutos - retLocal - retExtranj;

  // Minusvalías pendientes (suma minusvalías años anteriores, ejemplo básico)
  const minusvaliasPend = 0; // Aquí puedes guardar el saldo manualmente, o calcular desde DB si guardas el histórico

  return {
    plusvalias: {
      plusvalias,
      minusvalias: Math.abs(minusvalias)
    },
    dividendos: {
      bruto: dividendosBrutos,
      retLocal,
      retExtranj,
      neto: dividendosNetos
    },
    minusvaliasPend
  };
}
