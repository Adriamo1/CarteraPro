// js/vistas/ajustes.js
import { getBrokers, setBrokers, getBancos, setBancos, getTema, setTema } from '../settings.js';

// Vista: gestión de ajustes generales, brokers, bancos y tema
export async function renderAjustes(container) {
  const brokers = getBrokers();
  const bancos = getBancos();
  const tema = getTema();

  container.innerHTML = `
    <div class="panel-vista">
      <h2>Ajustes</h2>

      <section>
        <h3>Brokers y Plataformas</h3>
        <textarea id="txt-brokers" rows="4" style="width:100%;">${brokers.join('\n')}</textarea>
        <button id="btn-save-brokers" class="btn">Guardar brokers</button>
      </section>

      <section>
        <h3>Bancos</h3>
        <textarea id="txt-bancos" rows="4" style="width:100%;">${bancos.join('\n')}</textarea>
        <button id="btn-save-bancos" class="btn">Guardar bancos</button>
      </section>

      <section>
        <h3>Tema de la aplicación</h3>
        <select id="sel-tema">
          <option value="auto" ${tema === 'auto' ? 'selected' : ''}>Automático (según sistema)</option>
          <option value="light" ${tema === 'light' ? 'selected' : ''}>Claro</option>
          <option value="dark" ${tema === 'dark' ? 'selected' : ''}>Oscuro</option>
        </select>
        <button id="btn-save-tema" class="btn">Guardar tema</button>
      </section>
    </div>
  `;

  container.querySelector("#btn-save-brokers").onclick = () => {
    const nuevos = container.querySelector("#txt-brokers").value.split('\n').map(s => s.trim()).filter(Boolean);
    setBrokers(nuevos);
    alert("Brokers guardados.");
  };

  container.querySelector("#btn-save-bancos").onclick = () => {
    const nuevos = container.querySelector("#txt-bancos").value.split('\n').map(s => s.trim()).filter(Boolean);
    setBancos(nuevos);
    alert("Bancos guardados.");
  };

  container.querySelector("#btn-save-tema").onclick = () => {
    const nuevoTema = container.querySelector("#sel-tema").value;
    setTema(nuevoTema);
    alert("Tema guardado. Recarga la página si no se aplica automáticamente.");
  };
}
