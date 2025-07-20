// --------- Gráficos Dashboard ---------
async function calcularPnLPorActivo() {
  const [activos, trans] = await Promise.all([
    db.activos.toArray(),
    db.transacciones.toArray()
  ]);
  const compras = {}, ventas = {};
  trans.forEach(t => {
    const id = t.activoId;
    const imp = (+t.cantidad || 0) * (+t.precio || 0);
    if ((t.tipo || '').toLowerCase() === 'compra') {
      compras[id] = compras[id] || { c:0, coste:0 };
      compras[id].c += +t.cantidad || 0;
      compras[id].coste += imp + (+t.comision || 0);
    } else if ((t.tipo || '').toLowerCase() === 'venta') {
      ventas[id] = ventas[id] || { c:0, ing:0 };
      ventas[id].c += +t.cantidad || 0;
      ventas[id].ing += imp - (+t.comision || 0);
    }
  });
  return activos.map(a => {
    const c = compras[a.id] || { c:0, coste:0 };
    const v = ventas[a.id] || { c:0, ing:0 };
    const avg = c.coste / (c.c || 1);
    const realized = v.ing - avg * v.c;
    const restante = c.coste - avg * v.c;
    const valorActual = +a.valorActual || 0;
    const unrealized = valorActual - restante;
    return { nombre: a.nombre, pnl: realized + unrealized };
  });
}

async function datosSavebackTin() {
  const [movs, prestamos] = await Promise.all([
    db.movimientos.where('tipo').equals('saveback').toArray(),
    db.prestamos.toArray()
  ]);
  const porMes = {};
  movs.forEach(m => {
    const mes = (m.fecha || '').slice(0,7);
    porMes[mes] = (porMes[mes] || 0) + (+m.importe || 0);
  });
  const labels = Object.keys(porMes).sort();
  const saveData = labels.map(l => porMes[l]);
  const tin = prestamos[0]?.tin || 0;
  const tinData = labels.map(() => tin);
  return { labels, saveData, tinData };
}

async function distribucionPorCampo(campo) {
  const activos = await db.activos.toArray();
  const map = {};
  activos.forEach(a => {
    const key = a[campo] || 'Otro';
    map[key] = (map[key] || 0) + (+a.valorActual || 0);
  });
  const labels = Object.keys(map);
  const data = labels.map(l => map[l]);
  return { labels, data };
}

async function datosAsignacion() {
  const activos = await db.activos.toArray();
  const total = activos.reduce((s,a)=>s+(+a.valorActual||0),0);
  const porTipo = {};
  activos.forEach(a => {
    porTipo[a.tipo] = (porTipo[a.tipo] || 0) + (+a.valorActual || 0);
  });
  const labels = Object.keys(porTipo);
  const actual = labels.map(l => total ? porTipo[l]/total*100 : 0);
  const objetivoRef = { 'Acción':40, 'ETF':40, 'Cripto':20 };
  const objetivo = labels.map(l => objetivoRef[l] || 0);
  return { labels, actual, objetivo };
}

async function datosEvolucionCartera() {
  const trans = await db.transacciones.toArray();
  if (!trans.length) return { labels: [], data: [] };
  trans.sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const pos = {}, price = {};
  const labels = [], data = [];
  for (const t of trans) {
    const id = t.activoId;
    if (!pos[id]) pos[id] = 0;
    const qty = +t.cantidad || 0;
    if ((t.tipo||'').toLowerCase()==='compra') pos[id]+=qty;
    if ((t.tipo||'').toLowerCase()==='venta') pos[id]-=qty;
    if (+t.precio) price[id] = +t.precio;
    const total = Object.keys(pos).reduce((s,k)=>s+pos[k]*(price[k]||0),0);
    labels.push(t.fecha.slice(0,10));
    data.push(total);
  }
  return { labels, data };
}

async function renderGraficosDashboard() {
  if (!hasChart) return;
  const pnl = await calcularPnLPorActivo();
  const ctxPnl = document.getElementById('grafico-pnl').getContext('2d');
  new Chart(ctxPnl, {
    type:'bar',
    data:{
      labels:pnl.map(p=>p.nombre),
      datasets:[{label:'P&L',data:pnl.map(p=>p.pnl), backgroundColor:'#26a69a'}]
    },
    options:{indexAxis:'y', plugins:{legend:{display:false}}}
  });

  const { labels:labS, saveData, tinData } = await datosSavebackTin();
  const ctxS = document.getElementById('grafico-saveback').getContext('2d');
  new Chart(ctxS, {
    type:'line',
    data:{labels:labS, datasets:[
      {label:'Saveback',data:saveData, borderColor:'#3f8edc', tension:0.2},
      {label:'TIN',data:tinData, borderColor:'#f39c12', tension:0.2}
    ]},
    options:{responsive:true}
  });

  const { labels:labA, actual, objetivo } = await datosAsignacion();
  const ctxA = document.getElementById('grafico-asignacion').getContext('2d');
  new Chart(ctxA, {
    type:'bar',
    data:{labels:labA, datasets:[
      {label:'Actual %',data:actual, backgroundColor:'#2063c2'},
      {label:'Objetivo %',data:objetivo, backgroundColor:'#e57373'}
    ]},
    options:{responsive:true}
  });

  const divisa = await distribucionPorCampo('moneda');
  const ctxD = document.getElementById('grafico-divisa').getContext('2d');
  new Chart(ctxD, {type:'doughnut', data:{labels:divisa.labels, datasets:[{data:divisa.data}]}, options:{responsive:true}});

  const sector = await distribucionPorCampo('sector');
  const ctxSec = document.getElementById('grafico-sector').getContext('2d');
  new Chart(ctxSec, {type:'doughnut', data:{labels:sector.labels, datasets:[{data:sector.data}]}, options:{responsive:true}});

  const tipo = await distribucionPorCampo('tipo');
  const ctxTipo = document.getElementById('grafico-tipo').getContext('2d');
  new Chart(ctxTipo, {type:'doughnut', data:{labels:tipo.labels, datasets:[{data:tipo.data}]}, options:{responsive:true}});

  const evo = await datosEvolucionCartera();
  const ctxE = document.getElementById('grafico-evolucion').getContext('2d');
  new Chart(ctxE, {type:'line', data:{labels:evo.labels, datasets:[{label:'Valor total',data:evo.data,borderColor:'#3498db',tension:0.2}]}, options:{responsive:true}});

  const broker = await distribucionPorCampo('broker');
  const ctxB = document.getElementById('grafico-broker').getContext('2d');
  new Chart(ctxB, {type:'bar', data:{labels:broker.labels, datasets:[{data:broker.data, backgroundColor:'#70c1b3'}]}, options:{responsive:true, plugins:{legend:{display:false}}, indexAxis:'y'}});
}
