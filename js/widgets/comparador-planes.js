// js/widgets/comparador-planes.js

// Widget: comparador de planes de pensiones y roboadvisors para tu perfil
export async function render(container, privacy = false) {
  // Datos representativos (puedes editar o ampliar)
  const planes = [
    {
      nombre: "MyInvestor Indexado S&P 500",
      tipo: "Indexado",
      rent3a: 12.4, rent5a: 11.1,
      comision: "0,49%", deposito: "0,05%",
      rescate: "10 años desde aportación",
      fiscalidad: "Deducción IRPF hasta 1.500 €/año",
      observ: "Acceso 100% online, sin mínimos",
      link: "https://myinvestor.es"
    },
    {
      nombre: "Indexa Capital Pensiones",
      tipo: "Roboadvisor",
      rent3a: 10.7, rent5a: 9.2,
      comision: "0,43%", deposito: "0,05%",
      rescate: "Por antigüedad, paro o jubilación",
      fiscalidad: "Deducción IRPF hasta 1.500 €/año",
      observ: "Gestión automática y baja comisión",
      link: "https://indexacapital.com"
    },
    {
      nombre: "Finizens Pensiones",
      tipo: "Roboadvisor",
      rent3a: 9.1, rent5a: 7.7,
      comision: "0,43%", deposito: "0,04%",
      rescate: "Por antigüedad, paro o jubilación",
      fiscalidad: "Deducción IRPF hasta 1.500 €/año",
      observ: "Indexado global, sin mínimos",
      link: "https://finizens.com"
    },
    {
      nombre: "CaixaBank Destino 2035",
      tipo: "Tradicional",
      rent3a: 5.5, rent5a: 3.1,
      comision: "1,50%", deposito: "0,20%",
      rescate: "Jubilación, paro o enfermedad",
      fiscalidad: "Deducción IRPF hasta 1.500 €/año",
      observ: "Acceso presencial/online",
      link: "https://caixabank.es"
    }
  ];

  let html = `<h2>Comparativa planes de pensiones y roboadvisors</h2>
    <table class="tabla-comparador-planes">
      <thead>
        <tr><th>Nombre</th><th>Tipo</th><th>Rentab. 3a</th><th>Rentab. 5a</th>
          <th>Comisión</th><th>Depósito</th><th>Rescate</th><th>Fiscalidad</th><th>Notas</th>
        </tr>
      </thead>
      <tbody>
        ${planes.map(p=>`
          <tr>
            <td><a href="${p.link}" target="_blank">${p.nombre}</a></td>
            <td>${p.tipo}</td>
            <td>${privacy ? "•••" : (p.rent3a ? p.rent3a+"%" : "-")}</td>
            <td>${privacy ? "•••" : (p.rent5a ? p.rent5a+"%" : "-")}</td>
            <td>${p.comision}</td>
            <td>${p.deposito}</td>
            <td>${p.rescate}</td>
            <td>${p.fiscalidad}</td>
            <td>${p.observ}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="mini-explica">Los datos son orientativos. Compara siempre rentabilidades, comisiones y facilidad de rescate.</div>
  `;

  container.innerHTML = `<div class="widget-comparador-planes card">${html}</div>`;
}
