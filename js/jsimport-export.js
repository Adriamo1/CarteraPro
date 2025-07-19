// js/import-export.js
import { db } from './db.js';
import { notify } from './core.js';

// Exporta datos a JSON descargable
export async function exportarJSON() {
  const backup = {};
  for (const tabla of Object.keys(db.tablesByName)) {
    backup[tabla] = await db[tabla].toArray();
  }
  const dataStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `carteraPRO_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  notify("Backup JSON exportado", "success");
}

// Importa datos JSON (reemplaza base de datos)
export async function importarJSON(jsonData) {
  try {
    const data = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;
    await db.delete();
    await db.open();
    for (const tabla in data) {
      if (db[tabla]) await db[tabla].bulkPut(data[tabla]);
    }
    notify("Datos importados correctamente", "success");
    return true;
  } catch (e) {
    notify("Error al importar JSON: " + e.message, "error");
    return false;
  }
}

// Exporta una tabla a CSV
export async function exportarCSV(tabla) {
  if (!db[tabla]) {
    notify(`Tabla ${tabla} no encontrada`, "error");
    return;
  }
  const rows = await db[tabla].toArray();
  if (!rows.length) {
    notify(`Tabla ${tabla} sin datos para exportar`, "error");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${(r[h] ?? "").toString().replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${tabla}_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  notify(`Exportado CSV de ${tabla}`, "success");
}
