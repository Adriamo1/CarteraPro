// Exportar CSV
function exportarCSV(array, filename) {
  if (!array.length) return alert("No hay datos.");
  const encabezados = Object.keys(array[0]);
  const csv = [
    encabezados.join(";"),
    ...array.map(row => encabezados.map(k => JSON.stringify(row[k] ?? "")).join(";"))
  ].join("\\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/);
  if (!rows.length) return [];
  const headers = rows.shift().split(/[,;]\s*/).map(h => h.trim());
  return rows.filter(Boolean).map(line => {
    const cols = line.split(/[,;]\s*/);
    const obj = {};
    headers.forEach((h,i)=> obj[h] = (cols[i] || '').trim());
    return obj;
  });
}

async function exportarBackup() {
  const backup = {};
  for (const tabla of db.tables) {
    backup[tabla.name] = await tabla.toArray();
  }
  const filename = `CarteraPRO_backup_${new Date().toISOString().slice(0,10)}.json`;
  const blob = new Blob([JSON.stringify(backup)], {
    type: 'application/json'
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  localStorage.setItem('backupPendienteImportar', 'true');
}

async function importarBackupDesdeArchivo(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    for (const tabla of db.tables) {
      if (data[tabla.name]) {
        await tabla.clear();
        if (data[tabla.name].length) {
          await tabla.bulkAdd(data[tabla.name]);
        }
      }
    }
    alert('Copia restaurada correctamente');
    return true;
  } catch (e) {
    alert('Error al importar: ' + e.message);
    return false;
  }
}

function mostrarModalImportarBackup() {
  if (document.getElementById('import-modal')) return;
  const div = document.createElement('div');
  div.id = 'import-modal';
  div.className = 'modal';
  div.innerHTML = `
    <div class="modal-content">
      <p>¿Deseas importar la copia de seguridad que descargaste antes de actualizar? Puedes hacerlo ahora para restaurar tus datos anteriores.</p>
      <input type="file" id="sel-backup" accept="application/json" />
      <p><button class="btn" id="btn-importar">Importar</button>
      <button class="btn" id="cerrar-import">Cerrar</button></p>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('btn-importar').onclick = async () => {
    const f = document.getElementById('sel-backup').files[0];
    if (!f) return alert('Selecciona un archivo');
    const ok = await importarBackupDesdeArchivo(f);
    if (ok) {
      div.remove();
      localStorage.removeItem('backupPendienteImportar');
    }
  };
  document.getElementById('cerrar-import').onclick = () => {
    div.remove();
    localStorage.removeItem('backupPendienteImportar');
  };
}

function mostrarModalActualizacion(nuevaVersion) {
  if (document.getElementById('update-modal')) return;
  const div = document.createElement('div');
  div.id = 'update-modal';
  div.className = 'modal';
  div.innerHTML = `
    <div class="modal-content">
      <p>Se ha generado una copia de seguridad. Por favor, guarda este archivo antes de continuar con la actualización.</p>
      <p><button class="btn" id="descargar-backup">Descargar backup</button></p>
      <p><button class="btn" id="confirm-update" disabled>Actualizar ahora</button></p>
      <p><button class="btn" id="cancel-update">Cancelar</button></p>
    </div>`;
  document.body.appendChild(div);
  document.getElementById('descargar-backup').onclick = async () => {
    await exportarBackup();
    document.getElementById('confirm-update').disabled = false;
  };
  document.getElementById('confirm-update').onclick = () => {
    proceedUpdate(nuevaVersion);
  };
  document.getElementById('cancel-update').onclick = () => {
    div.remove();
  };
}

async function proceedUpdate(nuevaVersion) {
  const modal = document.getElementById('update-modal');
  if (modal) modal.remove();
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      await reg.update();
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }
  const keys = await caches.keys();
  await Promise.all(keys.map(k => caches.delete(k)));
  saveUserSetting('version', nuevaVersion);
  location.reload(true);
}

// ----- Modal Editar Activo -----
function crearModalActivo() {
  if (document.getElementById('activo-modal')) return;
  const div = document.createElement('div');
  div.id = 'activo-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Editar activo</h3>
      <form id="form-activo-modal">
        <input name="nombre" placeholder="Nombre" required />
        <input name="ticker" placeholder="Ticker" required />
        <input name="tipo" placeholder="Tipo" required />
        <input name="moneda" placeholder="Moneda" required />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-activo">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalEditarActivo(activo) {
  crearModalActivo();
  const modal = document.getElementById('activo-modal');
  const form = document.getElementById('form-activo-modal');
  form.nombre.value = activo.nombre || '';
  form.ticker.value = activo.ticker || '';
  form.tipo.value = activo.tipo || '';
  form.moneda.value = activo.moneda || '';
  form.dataset.id = activo.id;
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-activo').onclick = () => {
    modal.classList.add('hidden');
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    const id = Number(form.dataset.id);
    await db.activos.update(id, data);
    actualizarFilaActivo(id, data);
    modal.classList.add('hidden');
  };
}

// ----- Modal Confirmar -----
function mostrarConfirmacion(msg, onOk) {
  let modal = document.getElementById('confirm-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'confirm-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-content">
        <p id="confirm-msg"></p>
        <button id="confirm-yes" class="btn">Aceptar</button>
        <button id="confirm-no" class="btn">Cancelar</button>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.querySelector('#confirm-msg').textContent = msg;
  modal.classList.remove('hidden');
  modal.querySelector('#confirm-no').onclick = () => modal.classList.add('hidden');
  modal.querySelector('#confirm-yes').onclick = () => {
    modal.classList.add('hidden');
    onOk();
  };
}

function actualizarFilaActivo(id, data) {
  const row = document.querySelector(`tr[data-id='${id}']`);
  if (!row) return;
  row.children[0].textContent = data.nombre;
  row.children[1].textContent = data.ticker;
  row.children[2].textContent = data.tipo;
  row.children[3].textContent = data.moneda;
}

// ----- Modal Movimientos -----
function crearModalMovimiento() {
  if (document.getElementById('mov-modal')) return;
  const div = document.createElement('div');
  div.id = 'mov-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nuevo movimiento</h3>
      <form id="form-mov">
        <select id="sel-cuenta" name="cuentaId" required></select>
        <input type="date" name="fecha" required />
        <input type="number" step="any" name="importe" placeholder="Importe" required />
        <select name="tipo" id="sel-tipo">
          <option value="Ingreso">Ingreso</option>
          <option value="Gasto">Gasto</option>
          <option value="Gasto Tarjeta">Gasto Tarjeta</option>
        </select>
        <input name="descripcion" placeholder="Concepto" />
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-mov">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

async function mostrarModalMovimiento(cuentas) {
  crearModalMovimiento();
  const modal = document.getElementById('mov-modal');
  const lista = document.getElementById('sel-cuenta');
  lista.innerHTML = cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-mov').onclick = () => {
    modal.classList.add('hidden');
  };

  modal.querySelector('#form-mov').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.cuentaId = parseInt(data.cuentaId);
    data.importe = parseFloat(data.importe);
    const cuenta = await db.cuentas.get(data.cuentaId);
    const mov = {
      cuentaId: data.cuentaId,
      fecha: data.fecha,
      importe: data.importe,
      descripcion: data.descripcion || '',
      tipo: data.tipo
    };
    const id = await db.movimientos.add(mov);
    mov.id = id;
    state.accountMovements.push(mov);
    await db.cuentas.update(data.cuentaId, { saldo: (+cuenta.saldo || 0) + data.importe });

    if (data.tipo === 'Gasto Tarjeta') {
      const porcentaje = getSavebackRate();
      const importeSave = Math.abs(data.importe) * (porcentaje / 100);
      const movSave = {
        cuentaId: data.cuentaId,
        fecha: data.fecha,
        importe: importeSave,
        descripcion: 'Saveback pendiente',
        tipo: 'Saveback pendiente'
      };
      const id2 = await db.movimientos.add(movSave);
      movSave.id = id2;
      state.accountMovements.push(movSave);
    }

    modal.classList.add('hidden');
    renderCuentas();
    if (location.hash === '#dashboard') {
      renderDashboard();
    }
  };
}

// ----- Modal Transacciones -----
function crearModalTransaccion() {
  if (document.getElementById('transaction-modal')) return;
  const div = document.createElement('div');
  div.id = 'transaction-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Nueva transacción</h3>
      <form id="form-transaccion">
        <select name="activoId" id="sel-activo" required></select>
        <select name="tipo" required>
          <option value="compra">Compra</option>
          <option value="venta">Venta</option>
        </select>
        <input type="date" name="fecha" required />
        <input type="number" step="any" name="cantidad" placeholder="Cantidad" required />
        <input type="number" step="any" name="precio" id="inp-precio" placeholder="Precio" required />
        <button type="button" class="btn" id="btn-precio">📈 Obtener precio actual</button>
        <div id="currency-info" class="mini-explica"></div>
        <input type="number" step="any" name="comision" id="inp-comision" placeholder="Comisión" value="0" />
        <input name="broker" id="inp-broker" list="lista-brokers" placeholder="Broker" />
        <datalist id="lista-brokers"></datalist>
        <div id="rate-info" class="mini-explica"></div>
        <div id="total-eur" class="mini-explica"></div>
        <button class="btn">Guardar</button>
        <button type="button" class="btn" id="cancel-trans">Cancelar</button>
      </form>
    </div>`;
  document.body.appendChild(div);
}

async function mostrarModalTransaccion(activos, trans) {
  crearModalTransaccion();
  const modal = document.getElementById('transaction-modal');
  const lista = document.getElementById('sel-activo');
  lista.innerHTML = activos.map(a => `<option value="${a.id}" data-ticker="${a.ticker}" data-moneda="${a.moneda}" data-tipo="${a.tipo}">${a.nombre}</option>`).join('');
  const brokers = getBrokers();
  const dl = document.getElementById('lista-brokers');
  dl.innerHTML = brokers.map(b => `<option value="${b}">`).join('');
  modal.classList.remove('hidden');

  const form = document.getElementById('form-transaccion');
  form.dataset.id = trans ? trans.id : '';
  modal.querySelector('h3').textContent = trans ? 'Editar transacción' : 'Nueva transacción';

  if (trans) {
    form.activoId.value = trans.activoId;
    form.tipo.value = trans.tipo;
    form.fecha.value = trans.fecha;
    form.cantidad.value = trans.cantidad;
    document.getElementById('inp-precio').value = trans.precio;
    document.getElementById('inp-comision').value = trans.comision || 0;
    document.getElementById('inp-broker').value = trans.broker || '';
  }

  const precioEl = document.getElementById('inp-precio');
  const cantEl = modal.querySelector('[name="cantidad"]');
  const comEl = document.getElementById('inp-comision');
  const totalEl = document.getElementById('total-eur');
  const curEl = document.getElementById('currency-info');
  const rateEl = document.getElementById('rate-info');
  const btnPrecio = document.getElementById('btn-precio');
  let currentTc = 1;

  async function actualizarPrecio() {
    const opt = lista.selectedOptions[0];
    if (!opt) return;
    const ticker = opt.dataset.ticker;
    const tipo = opt.dataset.tipo || '';
    const moneda = opt.dataset.moneda || 'EUR';
    const info = await obtenerPrecioYMoneda(ticker, tipo, moneda, parseFloat(precioEl.value));
    precioEl.value = info.precio;
    precioEl.dataset.moneda = info.moneda;
    curEl.textContent = `Divisa: ${info.moneda}`;
    currentTc = await obtenerTipoCambio(info.moneda);
    rateEl.textContent = `TC aplicado: ${currentTc}`;
    calcularTotal(currentTc);
  }

  function calcularTotal(tc) {
    const cant = parseFloat(cantEl.value) || 0;
    const precio = parseFloat(precioEl.value) || 0;
    const com = parseFloat(comEl.value) || 0;
    const total = cant * precio * (tc || 1) + com;
    totalEl.textContent = `Total EUR aprox.: ${formatCurrency(total)}`;
  }

  lista.onchange = actualizarPrecio;
  btnPrecio.onclick = actualizarPrecio;
  cantEl.oninput = () => calcularTotal(currentTc);
  precioEl.oninput = () => calcularTotal(currentTc);
  comEl.oninput = () => calcularTotal(currentTc);

  actualizarPrecio();

  modal.querySelector('#cancel-trans').onclick = () => {
    modal.classList.add('hidden');
  };

  modal.querySelector('#form-transaccion').onsubmit = e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.cantidad = parseFloat(data.cantidad);
    data.precio = parseFloat(data.precio);
    data.comision = parseFloat(data.comision) || 0;
    const id = form.dataset.id;
    const prom = id ? db.transacciones.update(Number(id), data) : db.transacciones.add(data);
    prom.then(() => {
      modal.classList.add('hidden');
      renderTransacciones();
    });
  };
}

// ----- Modal Análisis Value -----
function crearModalAnalisis() {
  if (document.getElementById('analisis-modal')) return;
  const div = document.createElement('div');
  div.id = 'analisis-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Análisis Value</h3>
      <form id="form-analisis-modal">
        <input name="ticker" placeholder="Ticker o ID" required />
        <button class="btn">Analizar</button>
        <button type="button" class="btn" id="cancel-analisis">Cerrar</button>
      </form>
      <div id="analisis-res"></div>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalAnalisis() {
  crearModalAnalisis();
  const modal = document.getElementById('analisis-modal');
  const form = document.getElementById('form-analisis-modal');
  const res = document.getElementById('analisis-res');
  modal.classList.remove('hidden');

  modal.querySelector('#cancel-analisis').onclick = () => {
    modal.classList.add('hidden');
  };

  form.onsubmit = async e => {
    e.preventDefault();
    const ticker = form.ticker.value.trim().toUpperCase();
    if (!ticker) return;
    res.textContent = 'Cargando...';
    try {
      const datos = await analizarEmpresa(ticker);
      const filas = Object.entries({
        Ticker: datos.ticker,
        Empresa: datos.empresa,
        Sector: datos.sector,
        'Precio actual': datos.precioActual,
        PER: datos.per,
        'P/B': datos.pb,
        ROE: datos.roe,
        ROIC: datos.roic,
        FCF: datos.fcf,
        'FCF Yield': datos.fcfYield,
        Payout: datos.payout,
        'Crecimiento 5 años': datos.crecimientoIngresos5a,
        'Deuda / Patrimonio': datos.deudaPatrimonio,
        Moat: datos.moat,
        'Valoración Buffett': datos.valorBuffett,
        'Margen de seguridad (%)': datos.margenSeguridad,
        Recomendación: datos.recomendacion
      }).map(([k,v])=>`<tr><td data-label="Campo">${k}</td><td data-label="Valor">${v}</td></tr>`).join('');
      res.innerHTML = `<table class="tabla-analisis responsive-table"><tbody>${filas}</tbody></table>
        <button id="exp-analisis-modal" class="btn">Exportar CSV</button>
        <button id="copiar-md-modal" class="btn">Copiar Markdown</button>`;
      document.getElementById('exp-analisis-modal').onclick = () => exportarCSV([datos], `analisis-${ticker}.csv`);
      document.getElementById('copiar-md-modal').onclick = () => {
        const md = Object.entries(datos).map(([k,v])=>`|${k}|${v}|`).join('\n');
        navigator.clipboard.writeText(md);
        alert('Copiado en formato Markdown');
      };
    } catch {
      res.textContent = 'No se pudo obtener datos';
    }
  };
}

// ----- Modal Importación de datos -----
function crearModalImportar() {
  if (document.getElementById('import-modal')) return;
  const div = document.createElement('div');
  div.id = 'import-modal';
  div.className = 'modal hidden';
  div.innerHTML = `
    <div class="modal-content">
      <h3>Importar Datos</h3>
      <input type="file" id="file-import" accept=".csv,.json" />
      <div id="import-res" class="mini-explica"></div>
      <div id="import-list"></div>
      <button id="confirm-import" class="btn">Guardar</button>
      <button type="button" class="btn" id="cancel-import">Cancelar</button>
    </div>`;
  document.body.appendChild(div);
}

function mostrarModalImportar() {
  crearModalImportar();
  const modal = document.getElementById('import-modal');
  const inp = document.getElementById('file-import');
  const res = document.getElementById('import-res');
  const list = document.getElementById('import-list');
  let nuevosActivos = [];
  let nuevasTrans = [];
  modal.classList.remove('hidden');

  inp.onchange = async () => {
    res.textContent = '';
    list.innerHTML = '';
    nuevosActivos = [];
    nuevasTrans = [];
    const file = inp.files[0];
    if (!file) return;
    const text = await file.text();
    let data;
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        data = JSON.parse(text);
      } else {
        data = parseCSV(text);
      }
    } catch {
      res.textContent = 'Archivo no válido';
      return;
    }

    let activosRaw = [], transRaw = [];
    if (Array.isArray(data)) {
      if (data[0] && (data[0].fecha || data[0].tipo === 'compra' || data[0].tipo === 'venta')) {
        transRaw = data;
      } else {
        activosRaw = data;
      }
    } else if (data && typeof data === 'object') {
      activosRaw = Array.isArray(data.activos) ? data.activos : activosRaw;
      transRaw = Array.isArray(data.transacciones) ? data.transacciones : transRaw;
    }

  const existentes = await db.activos.toArray();
  const mapaTickerId = {};
  existentes.forEach(a => mapaTickerId[(a.ticker || '').toUpperCase()] = a.id);
  const tickersUsados = new Set(Object.keys(mapaTickerId));
  const avisos = [];
  const transKeySet = new Set();

    activosRaw.forEach((row,i) => {
      const nombre = (row.nombre || '').trim();
      const tkr = (row.ticker || '').trim().toUpperCase();
      if (!nombre || !tkr) {
        avisos.push(`Línea ${i+1} de activos: campos incompletos`);
        return;
      }
      if (tickersUsados.has(tkr)) {
        avisos.push(`Línea ${i+1} de activos: duplicado ${tkr}`);
        return;
      }
      tickersUsados.add(tkr);
      nuevosActivos.push({
        nombre,
        ticker: tkr,
        tipo: row.tipo || '',
        moneda: row.moneda || 'EUR',
        sector: row.sector || 'Desconocido'
      });
    });

    transRaw.forEach((row,i) => {
      const tkr = (row.ticker || '').trim().toUpperCase();
      const id = parseInt(row.activoId);
      if (!tkr && !id) {
        avisos.push(`Línea ${i+1} de transacciones: falta activo`);
        return;
      }
      if (!row.tipo || !row.fecha) {
        avisos.push(`Línea ${i+1} de transacciones: campos incompletos`);
        return;
      }
      const clave = `${id||tkr}-${row.tipo}-${row.fecha}-${row.cantidad}`;
      if (transKeySet.has(clave)) {
        avisos.push(`Línea ${i+1} de transacciones: duplicada`);
        return;
      }
      transKeySet.add(clave);
      nuevasTrans.push({
        ticker: tkr,
        activoId: id || null,
        tipo: row.tipo,
        fecha: row.fecha,
        cantidad: parseFloat(row.cantidad || 0),
        precio: parseFloat(row.precio || 0),
        comision: parseFloat(row.comision || 0),
        broker: row.broker || ''
      });
    });

    const activosPreview = nuevosActivos.map(n => `<div>${n.nombre} (${n.ticker})</div>`).join('');
    const transPreview = nuevasTrans.slice(0,5).map(t => `<div>${t.fecha} ${t.tipo} ${t.cantidad} ${t.ticker||('#'+t.activoId)}</div>`).join('');
    list.innerHTML = activosPreview + (transPreview ? `<h4>Transacciones</h4>${transPreview}` : '');
    if (avisos.length) list.innerHTML += `<div class="mini-explica kpi-negativo">${avisos.join('<br>')}</div>`;
    res.textContent = `${nuevosActivos.length} nuevos activos - ${nuevasTrans.length} transacciones`;
  };

  modal.querySelector('#confirm-import').onclick = async () => {
    try {
      const tickerId = {};
      for (const act of nuevosActivos) {
        const id = await db.activos.add(act);
        tickerId[act.ticker.toUpperCase()] = id;
      }
      for (const t of nuevasTrans) {
        let actId = t.activoId;
        if (!actId && t.ticker) {
          actId = tickerId[t.ticker.toUpperCase()] || (await db.activos.where('ticker').equalsIgnoreCase(t.ticker).first())?.id;
        }
        if (!actId) continue;
        await db.transacciones.add({
          activoId: actId,
          tipo: t.tipo,
          fecha: t.fecha,
          cantidad: t.cantidad,
          precio: t.precio,
          comision: t.comision,
          broker: t.broker
        });
      }
      modal.classList.add('hidden');
      renderActivos();
    } catch (e) {
      res.textContent = 'Error al importar: ' + e.message;
    }
  };

  modal.querySelector('#cancel-import').onclick = () => {
    modal.classList.add('hidden');
  };
}

async function obtenerPrecioYMoneda(ticker, tipo, moneda, manual) {
  try {
    if ((tipo || '').toLowerCase() === 'cripto') {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ticker.toLowerCase()}&vs_currencies=${moneda.toLowerCase()}`;
      const data = await fetchExchangeRates(url);
      const precio = data?.[ticker.toLowerCase()]?.[moneda.toLowerCase()];
      if (precio) return { precio, moneda };
    } else {
      const key = getApiKeyAv();
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${key}`;
      const data = await fetchExchangeRates(url);
      const precio = parseFloat(data?.['Global Quote']?.['05. price']);
      if (precio) return { precio, moneda };
    }
  } catch {}
  return { precio: manual || 0, moneda };
}

async function obtenerTipoCambio(moneda) {
  if (moneda === 'EUR') return 1;
  const rates = getUserSetting('exchangeRates') || {};
  if (rates[moneda]) return parseFloat(rates[moneda]);
  const reg = await db.tiposCambio.where('moneda').equals(moneda).last();
  if (reg) return parseFloat(reg.tasa || 1);
  return getTipoCambio();
}

window.addEventListener("DOMContentLoaded", async () => {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('service-worker.js'); } catch {}
  }
  await initAjustes();
  state.accountMovements = await db.movimientos.toArray();
  state.interestRates = await db.interestRates.toArray();
  document.body.setAttribute('data-theme', getTema());
  navegar();
  window.addEventListener("hashchange", navegar);
  if (localStorage.getItem('backupPendienteImportar')) {
    mostrarModalImportarBackup();
  }
  checkForUpdates();
});
