// js/calendario.js
import { db } from './db.js';

// Retorna eventos próximos en los próximos 'dias' días: vencimientos seguros, préstamos, suscripciones, renovaciones
export async function getProximosEventos(dias = 30) {
  const hoy = new Date();
  const fin = new Date(hoy);
  fin.setDate(hoy.getDate() + dias);

  let eventos = [];

  // Seguros próximos a vencer
  const seguros = await db.seguros.toArray();
  seguros.forEach(s => {
    if (s.vencimiento) {
      const f = new Date(s.vencimiento);
      if (f >= hoy && f <= fin) {
        eventos.push({
          fecha: s.vencimiento,
          tipo: "Seguro",
          titulo: `Seguro ${s.tipo || ''}`,
          descripcion: `Vence el ${new Date(s.vencimiento).toLocaleDateString()}`,
          entidad: 'seguro',
          entidadId: s.id
        });
      }
    }
  });

  // Préstamos con próximas cuotas (simplificado: vencimiento final)
  const prestamos = await db.prestamos.toArray();
  prestamos.forEach(p => {
    if (p.vencimiento) {
      const f = new Date(p.vencimiento);
      if (f >= hoy && f <= fin) {
        eventos.push({
          fecha: p.vencimiento,
          tipo: "Préstamo",
          titulo: `Préstamo ${p.tipo || ''}`,
          descripcion: `Vence el ${new Date(p.vencimiento).toLocaleDateString()}`,
          entidad: 'prestamo',
          entidadId: p.id
        });
      }
    }
  });

  // Suscripciones próximas
  const suscripciones = await db.suscripciones.toArray();
  suscripciones.forEach(s => {
    if (s.proximoPago) {
      const f = new Date(s.proximoPago);
      if (f >= hoy && f <= fin) {
        eventos.push({
          fecha: s.proximoPago,
          tipo: "Suscripción",
          titulo: `Suscripción ${s.nombre || ''}`,
          descripcion: `Próximo pago el ${new Date(s.proximoPago).toLocaleDateString()}`,
          entidad: 'suscripcion',
          entidadId: s.id
        });
      }
    }
  });

  // Ordena por fecha ascendente
  eventos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  return eventos;
}
