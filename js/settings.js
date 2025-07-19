// js/settings.js
// =======================================
// Preferencias de usuario, brokers y bancos editables
// =======================================

/** Guardar una preferencia */
export function saveUserSettings(key, value) {
  localStorage.setItem("carteraPRO_settings_" + key, JSON.stringify(value));
}

/** Obtener una preferencia */
export function getUserSettings(key) {
  const v = localStorage.getItem("carteraPRO_settings_" + key);
  try { return v ? JSON.parse(v) : null; } catch { return null; }
}

/** Brokers/plataformas editables */
export function getBrokers() {
  return getUserSettings("brokers") || [
    "Trade Republic", "Revolut", "Binance", "DEGIRO", "MyInvestor", "Interactive Brokers"
  ];
}
export function setBrokers(list) { saveUserSettings("brokers", list); }

/** Bancos editables */
export function getBancos() {
  return getUserSettings("bancos") || [
    "BBVA", "CaixaBank", "Santander", "ING", "Openbank", "EVO", "Revolut"
  ];
}
export function setBancos(list) { saveUserSettings("bancos", list); }

/** Tema claro/oscuro */
export function setTema(tema) {
  localStorage.setItem("carteraPRO_settings_tema", tema);
  document.body.setAttribute("data-theme", tema);
}
export function getTema() {
  return localStorage.getItem("carteraPRO_settings_tema") || "auto";
}

/** Privacidad global */
export function setPrivacidad(val) {
  localStorage.setItem("carteraPRO_settings_privacidad", !!val);
}
export function getPrivacidad() {
  return localStorage.getItem("carteraPRO_settings_privacidad") === "true";
}

/** Idioma (por defecto español) */
export function setIdioma(idioma) {
  localStorage.setItem("carteraPRO_settings_idioma", idioma);
}
export function getIdioma() {
  return localStorage.getItem("carteraPRO_settings_idioma") || "es";
}
