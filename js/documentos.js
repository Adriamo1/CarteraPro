 jsdocumentos.js
import { db } from '.db.js';

 Función para obtener documentos asociados a una entidad y su ID
export async function getDocumentos({ entidad = null, entidadId = null } = {}) {
  if (!entidad) return [];
  if (entidadId == null) {
    return await db.documentos.where(entidad).equals(entidad).toArray();
  }
  return await db.documentos
    .where([entidad+entidadId])
    .equals([entidad, Number(entidadId)])
    .toArray();
}

 Función para agregar un documento (puedes ampliar con validación)
export async function agregarDocumento(doc) {
   doc debe contener entidad, entidadId, tipo, url, descripcion, fecha
  if (!doc.entidad  doc.entidadId == null  !doc.tipo  !doc.url) {
    throw new Error(Datos incompletos para documento);
  }
  doc.fecha = doc.fecha  new Date().toISOString();
  return await db.documentos.add(doc);
}

 Función para eliminar documento por id
export async function eliminarDocumento(id) {
  return await db.documentos.delete(id);
}
