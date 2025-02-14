import {
  environmentAddressClient,
  createEnvironment,
  listAllService,
  registerRequest,
  environmentAllServices,
} from '../js/services.js';
import {
  showModalAlert,
  closeModal,
  closeModalDetails,
  exitSession,
  openSession,
  returnModal,
} from '../js/modals.js';
import { openDetailsClientAddressId } from './Address.js';
//import { requestsEquipmentEnvironment } from './Request.js';
let addressData;
export async function listEnvironmentAddressClient(address) {
  addressData = address;

  let addressEnvironments = [];

  try {
    const environmentAddress = await environmentAddressClient(address._id);
    if (environmentAddress.status === 401) {
      showModalAlert(
        'Next',
        environmentAddress.title,
        environmentAddress.msg,
        async () => {
          await exitSession();
        }
      );
    } else if (environmentAddress.status === 403) {
      showModalAlert(
        'Alert',
        environmentAddress.title,
        environmentAddress.msg,
        closeModal
      );
      return;
    } else if (environmentAddress.status === 400) {
      addressEnvironments = [];
    } else if (environmentAddress.status === 200) {
      const level = environmentAddress.level;
      await openSession(level);
      addressEnvironments = [...environmentAddress.environmentsAddress];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  let addressEnvironmentfiltered = addressEnvironments;

  if (addressEnvironmentfiltered.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Ambiente!',
      'Por favor, cadastre um Ambiente para esse Endereço.',
      async () => {
        localStorage.setItem(
          'returnModal',
          JSON.stringify({
            type: 'listEnvironment',
            data: address,
          })
        );
        await newEnvironment(address);
      }
    );
  }

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Ambientes do Endereço';

  content.innerHTML = `
        <div class="form-center-item">
          <label class="label">Endereço: ${address.street}</label>
          <select id="select-environment" class="select">
              <option value="">Selecione um Ambiente</option>
              ${addressEnvironmentfiltered
                .map(
                  (env) =>
                    `<option value="${env._id}">${env.environmentName}</option>`
                )
                .join('')}
            </select>
        </div>
        <table class="details-table">
          <thead>
            <tr>
              <th>Nome do ambiente</th>
            </tr>
          </thead>
          <tbody id="environment-list">
            ${renderEnvironmentsRows(addressEnvironmentfiltered)}
          </tbody>
        </table>
      `;

  footer.innerHTML = `
        <div class="modal-user-footer">
          <button type="button" id="newEnvironmentAddress" class="modal-content-btn-enable">+Ambiente</button>
        </div>
      `;

  modal.style.display = 'block';

  btnClose.onclick = () => {
    closeModalDetails();
  };

  btnReturn.onclick = async () => await openDetailsClientAddressId(address);

  const environmentNameFilter = document.getElementById('select-environment');

  environmentNameFilter.addEventListener('change', () => {
    filterEnvironmentAddress();
  });

  function filterEnvironmentAddress() {
    const selectedTypes = document.getElementById('select-environment').value;

    const filteredAddress = addressEnvironmentfiltered.filter(
      (env) => !selectedTypes || env.environmentName === selectedTypes
    );

    document.getElementById('environment-list').innerHTML =
      renderEnvironmentsRows(filteredAddress);
  }

  document
    .getElementById('newEnvironmentAddress')
    .addEventListener('click', async () => {
      localStorage.setItem(
        'returnModal',
        JSON.stringify({
          type: 'listEnvironment',
          data: address,
        })
      );
      await newEnvironment(address);
    });
}

function renderEnvironmentsRows(envs) {
  return envs
    .map(
      (env) => `
          <tr>
            <td>
              <div class="center">
                ${env.environmentName}
                <i class="view-env-btn
                  bi bi-thermometer-snow endBtn"
                  data-env='${JSON.stringify(env)}'>
                </i>
              </div>
            </td>
          </tr>
        `
    )
    .join('');
}

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-env-btn')) {
    const envDetails = JSON.parse(event.target.dataset.env);
    await envAddressDetails(envDetails);
  }
});

export async function envAddressDetails(env) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Detalhamento do Ambiente';

  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Ambiente ${env.environmentName}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Área (m²)</td>
          <td>${env.environmentSize}</td>
        </tr>
        <tr>
          <td>Equipamento:</td>
          <td>${env.equipmentNumber}</td>
        </tr>
        <tr>
          <td>Tipo:</td>
          <td>${env.equipmentType}</td>
        </tr>
        <tr>
          <td>Marca:</td>
          <td>${env.equipmentBrand}</td>
        </tr>
        <tr>
          <td>Modelo:</td>
          <td>${env.equipmentModel}</td>
        </tr>
        <tr>
          <td>Capacidade (Btu):</td>
          <td>${env.capacityBTU}</td>
        </tr>
        <tr>
          <td>Ciclos:</td>
          <td>${env.cicle}</td>
        </tr>
        <tr>
          <td>Voltagem:</td>
          <td>${env.volt}</td>
        </tr>
        <tr>
          <td>Número de Série:</td>
          <td>${env.serialModel}</td>
        </tr>
      </tbody>
    </table>
    <div class="button-client-table">
      <i class="env-request-btn
        bi bi-tools tabBtn"
        data-request='${JSON.stringify(env)}'>
      </i>
      <i class="env-services-btn
        bi bi-window-plus tabBtn"
        data-services='${JSON.stringify(env)}'>
      </i>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      
    </div>
  `;

  modal.style.display = 'block';

  document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('env-services-btn')) {
      const servicesEquipmentEnv = JSON.parse(event.target.dataset.services);
      await servicesEquipment(servicesEquipmentEnv);
    }
  });

  document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('env-request-btn')) {
      const requestEquipment = JSON.parse(event.target.dataset.request);
      await modalNewRequest(requestEquipment);
    }
  });

  btnReturn.onclick = async function () {
    await listEnvironmentAddressClient(addressData);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}

/////////////////////////////////////////////////////////////////

export async function modalNewRequest(env) {
  let servicesData = [];
  try {
    const serviceList = await listAllService();
    if (serviceList.status === 401) {
      showModalAlert('Next', serviceList.title, serviceList.msg, async () => {
        await exitSession();
      });
    } else if (serviceList.status === 403) {
      showModalAlert('Alert', serviceList.title, serviceList.msg, () => {
        window.location.reload();
      });
    } else if (serviceList.status === 400) {
      showModalAlert('Alert', serviceList.title, serviceList.msg, closeModal);
      return;
    } else if (serviceList.status === 404) {
      servicesData = [];
    } else if (serviceList.status === 200) {
      const level = serviceList.level;
      await openSession(level);
      servicesData = [...serviceList.listService];
    }
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  if (servicesData.length === 0) {
    showModalAlert(
      'Next',
      'Não há Serviços!',
      'Por favor, faça cadastros de serviços para gerar Orçamentos.',
      async () => {
        await showModalNewService();
      }
    );
  }

  const maintenance = servicesData.filter(
    (service) => service.serviceType === 'Manutenção'
  );

  const installation = servicesData.filter(
    (service) => service.serviceType === 'Instalação'
  );

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Solicitar Serviço';
  content.innerHTML = `
    <div class="form-content">
      <div class="form-center">
        <label class="label">Selecione o Tipo de Serviço:</label>
        <div class="data-items">
          <label class="label">
            <input type="radio" class="radio" name="service-type" value="Instalação">
            <span class="span">Instalação</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="service-type" value="Manutenção">
            <span class="span">Manutenção</span>
          </label>
        </div>
        <div class="service-selection data-items-budget"></div>
      </div>     
    </div>
  `;

  footer.innerHTML = `
      <div class="modal-user-footer">
        <button type="button" id="saveRequest" class="modal-content-btn-ok"> Enviar </button>
      </div>
    `;

  btnReturn.onclick = async function () {
    await envAddressDetails(env);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  /*document
    .getElementById('newAddressBtn')
    .addEventListener('click', async () => {
      localStorage.setItem(
        'returnModal',
        JSON.stringify({
          type: 'newRequest',
          data: null,
        })
      );
      await newAddress();
      closeModalRegister();
    });
  */
  document.querySelectorAll('input[name="service-type"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      const serviceContainer = document.querySelector('.service-selection');
      serviceContainer.innerHTML = '';

      if (this.value === 'Instalação') {
        renderServices(installation, serviceContainer);
      } else if (this.value === 'Manutenção') {
        renderServices(maintenance, serviceContainer);
      }
    });
  });

  function renderServices(services, container) {
    services.forEach((service) => {
      const label = document.createElement('label');
      label.style.cssText = `
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: var(--color-trans-3);
          padding: 0.5em 1em;
          color: var(--color-3);
          font-family: var(--font-1);
          font-weight: 800;
          font-size: 1em;
        `;
      label.innerHTML = `
          <input type="checkbox" class="service-checkbox checkbox" value="${service.servicePrice}" data-serviceId="${service._id}">
          <span class="span" style="color: var(--color-2);">${service.serviceName}
        `;
      label.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          label.style.backgroundColor = 'var(--color-valid)';
          label
            .querySelectorAll('span')
            .forEach((span) => (span.style.color = 'var(--color-3)'));
        } else {
          label.style.backgroundColor = 'var(--color-trans-3)';
          label
            .querySelectorAll('span')
            .forEach((span) => (span.style.color = 'var(--color-2)'));
        }
      });
      container.appendChild(label);
    });
    container.style.display = 'block';
  }

  function clearServiceSelection() {
    document.querySelectorAll('.service-checkbox').forEach((checkbox) => {
      checkbox.checked = false;
      const label = checkbox.closest('label');
      if (label) {
        label.style.backgroundColor = 'var(--color-trans-3)';
        label.querySelectorAll('span').forEach((span) => {
          span.style.color = 'var(--color-2)';
        });
      }
    });
  }

  document.querySelectorAll('input[name="service-type"]').forEach((radio) => {
    radio.addEventListener('change', function () {
      clearServiceSelection();
      const serviceContainer = document.querySelector('.service-selection');
      serviceContainer.innerHTML = '';

      if (this.value === 'Instalação') {
        renderServices(installation, serviceContainer);
      } else if (this.value === 'Manutenção') {
        renderServices(maintenance, serviceContainer);
      }
    });
  });

  document.getElementById('saveRequest').addEventListener('click', async () => {
    const serviceType = document.querySelector(
      'input[name="service-type"]:checked'
    );
    if (!serviceType) {
      showModalAlert(
        'Alert',
        'Tipo de Serviço',
        'Selecione um tipo de serviço',
        closeModal
      );
      return;
    }
    const selectedServiceIds = Array.from(
      document.querySelectorAll('.service-checkbox:checked')
    ).map((checkbox) => checkbox.getAttribute('data-serviceId'));

    if (selectedServiceIds.length === 0) {
      showModalAlert(
        'Alert',
        'Serviços!',
        'Selecione pelo menos um serviço.',
        closeModal
      );
      return;
    }

    const status = 'Retorno';
    const data = {};

    data.clientId = env.clientId;
    data.addressId = env.addressId;
    data.environmentId = env._id;
    data.requestType = serviceType.value;
    data.requestStatus = status;
    data.serviceIds = selectedServiceIds;

    try {
      const requestData = await registerRequest(data);
      if (requestData.status === 401) {
        showModalAlert('Next', requestData.title, requestData.msg, async () => {
          await exitSession();
        });
      } else if (
        requestData.status === 400 ||
        requestData.status === 409 ||
        requestData.status === 500
      ) {
        showModalAlert('Alert', requestData.title, requestData.msg, closeModal);
      } else if (requestData.status === 201) {
        const level = requestData.level;
        showModalAlert('Next', requestData.title, requestData.msg, async () => {
          await openSession(level);
          closeModalDetails();
        });
      }
    } catch (error) {
      showModalAlert('Erro de Conexão', error.message, closeModal);
    }
  });
}

////////////////////////////////////////////////////////////////

export async function newEnvironment(address) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  const isComplement = address.complement || '';
  const complement = isComplement !== '' ? ` - Compl ${isComplement}` : '';
  title.textContent = 'Novo Ambiente';
  content.innerHTML = `
    <div class="form-content">
      <div class="data-items">
        <label class="label"> Endereço ${address.addressType}</label>
        <label class="label">${address.street}</label>
        <label class="label">Nº${address.number}${complement}</label>
      </div>
      <label class="label">Ambiente do Endereço</label>
      <div class="form-center">
        <div class="form-group">
          <input class="form-group-input" type="text" id="environmentName" name="environmentName" placeholder="">
          <label class="form-group-label" for="">Nome do ambiente:</label>
        </div>
        <div class="form-group">
          <input class="form-group-input" type="text" id="environmentSize" name="environmentSize" placeholder="">
          <label class="form-group-label" for="">Área do ambiente (m²):</label>
        </div>
      </div>
      <label class="label">Equipamento do Ambiente</label>
      <div class="form-center">
        <select class="select" id="equipmentType" required>
          <option value="">Tipo de Equipamento</option>
          <option value="Split">Split</option>
          <option value="Janela">Janela</option>
          <option value="Portátil">Portátil</option>
          <option value="Cassete">Cassete</option>
          <option value="Piso-Teto">Piso-Teto</option>
          <option value="Duto">Duto</option>
          <option value="Inverter">Inverter</option>
          <option value="Multi Split">Multi Split</option>
        </select>
      </div>
      <div class="form-center">
        <select class="select" id="equipmentBrand" required>
          <option value="">Marca do Equipamento</option>
          <option value="LG">LG</option>
          <option value="Samsung">Samsung</option>
          <option value="Midea">Midea</option>
          <option value="Springer">Springer</option>
          <option value="Gree">Gree</option>
          <option value="Consul">Consul</option>
          <option value="Philco">Philco</option>
          <option value="Fujitsu">Fujitsu</option>
          <option value="Carrier">Carrier</option>
          <option value="Daikin">Daikin</option>
          <option value="Elgin">Elgin</option>
          <option value="Hitachi">Hitachi</option>
        </select>
      </div>
      <div class="form-group">
        <input class="form-group-input" type="text" id="equipmentModel" name="equipmentModel" required>
        <label class="form-group-label" for="">Modelo da Marca:</label>
      </div>
      <div class="form-center">
        <select class="select" id="capacityBTU" required>
          <option value="">Capacidade (BTU's)</option>
          <option value="7000">7000 BTUs</option>
          <option value="9000">9000 Btus</option>
          <option value="12000">12000 Btus</option>
          <option value="18000">18000 Btus</option>
          <option value="24000">24000 Btus</option>
          <option value="30000">30000 Btus</option>
          <option value="36000">36000 Btus</option>
          <option value="48000">48000 Btus</option>
          <option value="60000">60000 Btus</option>
        </select>
      </div>
      <div class="form-center">
        <label class="label">Ciclo:</label>
        <div class="data-items">
          <label class="label">
            <input type="checkbox" class="checkbox" name="cicle" value="Frio" required>
            <span class="span">Frio</span>
          </label>
          <label class="label">
            <input type="checkbox" class="checkbox" name="cicle" value="Quente e Frio (Reverso)">
            <span class="span">Quente e Frio</span>
          </label>
        </div>
      </div>
      <div class="form-center">
        <label class="label">Voltagem:</label>
        <div class="data-items">
          <label class="label">
            <input type="checkbox" class="checkbox" name="volt" value="110" required>
            <span class="span">110v</span>
          </label>
          <label class="label">
            <input type="checkbox" class="checkbox" name="volt" value="220">
            <span class="span">220v</span>
          </label>
          <label class="label">
            <input type="checkbox" class="checkbox" name="volt" value="Bivolt">
            <span class="span">Bivolt</span>
          </label>
        </div>
      </div>
      <div class="form-group">
        <input class="form-group-input" type="text" id="serialModel" name="serialModel" required>
        <label class="form-group-label" for="">Número de Série:</label>
      </div>
    </div>     
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="createBtn" class="modal-content-btn-ok">Salvar</button>
    </div>
  `;

  btnReturn.onclick = async function () {
    await returnModal();
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  function validateEnvironmentSize() {
    const sizeInput = document.getElementById('environmentSize');
    const sizeValue = sizeInput.value.trim();
    if (!/^\d+$/.test(sizeValue)) {
      showModalAlert(
        'Alert',
        'Entrada Inválida!',
        'Digite apenas números.',
        closeModal
      );
      sizeInput.value = '';
      return;
    }
    const size = parseInt(sizeValue);
    if (size > 100) {
      showModalAlert(
        'Alert',
        'Área do Ambiente!',
        `Área do ambiente de ${size}m²`,
        closeModal
      );
    }
  }

  function setupEnvironmentSizeValidation() {
    const sizeInput = document.getElementById('environmentSize');
    sizeInput.addEventListener('input', validateEnvironmentSize);
  }

  setupEnvironmentSizeValidation();

  function setupSingleCheckboxSelection(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', function () {
        checkboxes.forEach((cb) => {
          if (cb !== this) cb.checked = false;
        });
      });
    });
  }

  setupSingleCheckboxSelection('cicle');
  setupSingleCheckboxSelection('volt');

  const registerButton = document.getElementById('createBtn');
  registerButton.addEventListener('click', async () => {
    const envName = document.getElementById('environmentName').value;
    const envSize = document.getElementById('environmentSize').value;
    const equipType = document.getElementById('equipmentType').value;
    const equipBrand = document.getElementById('equipmentBrand').value.trim();
    const equipModel = document.getElementById('equipmentModel').value;
    const equipCapacity = parseInt(
      document.getElementById('capacityBTU').value
    );
    const cicle = document.querySelector('input[name="cicle"]:checked')?.value;
    const volt = document.querySelector('input[name="volt"]:checked')?.value;
    const serialModel = document.getElementById('serialModel').value.trim();

    if (!envName) {
      showModalAlert(
        'Alert',
        'Nome do Ambiente!',
        'Digite o nome do ambiente.',
        closeModal
      );
      return;
    }
    if (!envSize) {
      showModalAlert(
        'Alert',
        'Área do Ambiente!',
        'Digite o valor da área do ambiente em m².',
        closeModal
      );
      return;
    }
    if (!equipType) {
      showModalAlert(
        'Alert',
        'Tipo do Equipamento!',
        'Selecione o tipo de equipamento.',
        closeModal
      );
      return;
    }
    if (!equipBrand) {
      showModalAlert(
        'Alert',
        'Marca do Equipamento!',
        'Selecione a marca do equipamento.',
        closeModal
      );
      return;
    }
    if (!equipModel) {
      showModalAlert(
        'Alert',
        'Modelo da Marca!',
        'Digite o modelo do equipamento.',
        closeModal
      );
      return;
    }
    if (isNaN(equipCapacity) || equipCapacity <= 0) {
      showModalAlert(
        'Alert',
        'Capacidade BTUs!',
        'Capacidade BTU deve ser um número positivo.',
        closeModal
      );
      return;
    }
    if (!cicle) {
      showModalAlert(
        'Alert',
        'Ciclos do Equipamento',
        'Selecione o ciclo do equipamento.',
        closeModal
      );
      return;
    }
    if (!volt) {
      showModalAlert(
        'Alert',
        'Votagem do Equipamento!',
        'Selecione uma voltagem válida.',
        closeModal
      );
      return;
    }
    if (!serialModel) {
      showModalAlert(
        'Alert',
        'Número Serial!',
        'Digite o número de série do equipamento.',
        closeModal
      );
      return;
    }

    const dataSend = {
      clientId: address.clientId,
      addressId: address._id,
      environmentName: envName,
      environmentSize: envSize,
      equipmentType: equipType,
      equipmentBrand: equipBrand,
      equipmentModel: equipModel,
      capacityBTU: equipCapacity,
      cicle: cicle,
      volt: volt,
      serialModel: serialModel,
    };

    if (address.requestId) {
      dataSend.requestId = address.requestId;
    }

    try {
      const envAddress = await createEnvironment(dataSend);
      if (envAddress.status === 401) {
        showModalAlert('Next', envAddress.title, envAddress.msg, async () => {
          await exitSession();
        });
      } else if (envAddress.status === 403) {
        window.location.reload();
      } else if (
        envAddress.status === 400 ||
        envAddress.status === 409 ||
        envAddress.status === 500
      ) {
        showModalAlert('Alert', envAddress.title, envAddress.msg, closeModal);
        return;
      } else if (envAddress.status === 201) {
        const returnData = localStorage.getItem('returnModal');
        if (returnData) {
          const { type, data } = JSON.parse(returnData);
          if (type === 'serviceOfficer') {
            data.requestId.envId = null;
            data.requestId.environmentId = envAddress.data;
            const order = data;
            localStorage.removeItem('returnModal');
            localStorage.setItem(
              'returnModal',
              JSON.stringify({
                type: 'serviceOfficer',
                data: order,
              })
            );
          }
        }
        const level = envAddress.level;
        await openSession(level);
        showModalAlert('Next', envAddress.title, envAddress.msg, async () => {
          await returnModal();
        });
      }
    } catch (error) {
      console.error('Erro ao buscar dados de endereço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  });
}

async function servicesEquipment(env) {
  let servicesData = [];
  try {
    const serviceList = await environmentAllServices(env._id);
    if (serviceList.status === 400) {
      servicesData = [];
    } else if (serviceList.status === 200) {
      servicesData = [...serviceList.historys];
    } else {
      showModalAlert('Next', serviceList.title, serviceList.msg, async () => {
        await envAddressDetails(env);
      });
    }
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  if (servicesData.length === 0) {
    showModalAlert(
      'Next',
      'Não há Serviços!',
      'Não há histórico de Serviços executados para este equipamento',
      async () => {
        await envAddressDetails(env);
      }
    );
  }
  console.log(servicesData);
  const maintenance = servicesData.filter(
    (service) => service.serviceType === 'Manutenção'
  );

  const servicesTableRows = generateServiceTableRows(servicesData);
  function generateServiceTableRows(services) {
    let table = '';

    services.forEach((d) => {
      // Adiciona a linha com a data
      table += `<tr><td colspan="2"><strong>Data:</strong> ${new Date(
        d.date
      ).toLocaleString()}</td></tr>`;

      // Itera sobre o array de manutenção e adiciona os serviços
      d.maintenance.forEach((m) => {
        table += `
          <tr>
            <td><strong>Serviço:</strong></td>
            <td>${m.service}</td>
          </tr>
          <tr>
            <td><strong>Observações:</strong></td>
            <td>${m.obs || 'Sem observações'}</td>
          </tr>
        `;
      });
    });

    return table;
  }

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Histórico de Serviços';

  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Equipamento ${env.equipmentNumber}
          </th>
        </tr>
      </thead>
      <tbody>
       ${servicesTableRows}
      </tbody>
    </table>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await envAddressDetails(env);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}
