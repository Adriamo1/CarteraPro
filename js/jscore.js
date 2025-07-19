// js/core.js
// ===========================
// Utilidades y helpers globales Cartera PRO
// ===========================

// Formatea moneda (EUR por defecto)
export function formatCurrency(value, currency = "EUR") {
  return (value === null || value === undefined || isNaN(value))
    ? "—"
    : Number(value).toLocaleString('es-ES', { style: 'currency', currency });
}

// Formatea porcentaje
export function formatPercent(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  return `${Number(value).toFixed(decimals)}%`;
}

// Formatea fecha (DD/MM/AAAA)
export function formatDate(fecha) {
  if (!fecha) return "-";
  try {
    return (new Date(fecha)).toLocaleDateString("es-ES");
  } catch { return String(fecha); }
}

// Generador UUID v4
export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Notificaciones flotantes en pantalla
export function notify(msg, tipo = "info", ms = 3300) {
  let el = document.createElement("div");
  el.className = tipo === "success" ? "alert-success"
      : tipo === "error" ? "alert-error"
      : "alert-info";
  el.innerHTML = msg;
  document.body.appendChild(el);
  setTimeout(() => { el.remove(); }, ms);
}

// Validación sencilla de email
export function isEmail(val) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

// Copiar texto al portapapeles
export function copyToClipboard(texto) {
  navigator.clipboard?.writeText(texto)
    .then(() => notify("Copiado al portapapeles", "success", 1500))
    .catch(() => notify("No se pudo copiar", "error", 1800));
}

// Helpers para widgets: mostrar “•••” si modo privacidad
export function priv(val, privacy) {
  return privacy ? "•••" : val;
}

// Helper para sumar arrays numéricos (usa activos.reduce(sumArray,0))
export function sumArray(a, b) {
  return (+a || 0) + (+b || 0);
}
