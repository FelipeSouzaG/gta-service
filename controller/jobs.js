import {
  closeModal,
  closeModalDetails,
  closeModalRegister,
  exitSession,
  openSession,
  showModalAlert,
} from '../js/modals.js';

import {
  listAllServiceOfficer,
  registerHistory,
  updateRequest,
} from '../js/services.js';
import {
  formatPhoneValue,
  formatPostalCode,
  normalizeDate,
} from '../js/validation.js';
import { newEnvironment, modalNewRequest } from './Environment.js';

document.addEventListener('DOMContentLoaded', async function () {
  document
    .getElementById('serviceMobile')
    .addEventListener('click', showModalServicesList);
  document
    .getElementById('serviceDesktop')
    .addEventListener('click', showModalServicesList);
});

async function showModalServicesList() {
  let services;

  try {
    const listServiceData = await listAllServiceOfficer();
    if (listServiceData.status === 401) {
      showModalAlert(
        'Next',
        listServiceData.title,
        listServiceData.msg,
        async () => {
          await exitSession();
        }
      );
    } else if (listServiceData.status === 403) {
      showModalAlert('Next', listServiceData.title, listServiceData.msg, () => {
        window.location.reload();
      });
    } else if (listServiceData.status === 400) {
      services = null;
    } else if (listServiceData.status === 404) {
      showModalAlert('Next', listServiceData.title, listServiceData.msg, () => {
        closeModalRegister();
      });
    } else if (listServiceData.status === 200) {
      const level = listServiceData.level;
      await openSession(level);
      services = listServiceData.programService;
    }
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  if (!services) {
    showModalAlert(
      'Next',
      'Nenhum Serviço Programado!',
      'Não há programação de serviços para hoje.',
      async () => {
        closeModalRegister();
      }
    );
  }
  const orders =
    services.orders && Object.keys(services.orders).length > 0
      ? `<table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ordens de Serviço
            </th>
          </tr>
          <tr>
            <th>Data e Hora</th>
            <th>Número</th>
          </tr>
        </thead>
        <tbody id="order-list">
          ${renderOrdersRows(services.orders)}
        </tbody>
      </table>`
      : '';
  const requests =
    services.requests && Object.keys(services.requests).length > 0
      ? `<table class="details-table">
          <thead>
            <tr>
              <th colspan="2" style="text-align: center;">
                Visitas Técnica
              </th>
            </tr>
            <tr>
              <th>Data e Hora</th>
              <th>Número</th>
            </tr>
          </thead>
          <tbody id="request-list">
            ${renderRequestsRows(services.requests)}
          </tbody>
        </table>`
      : '';

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Programação de Serviços';

  content.innerHTML = `
    <div class="form-center">
      ${orders}
      ${requests}
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="newService" class="hidden">+Serviços</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = () => closeModalRegister();

  function filterOrder() {
    document.getElementById('order-list').innerHTML = renderOrdersRows(
      services.orders
    );
  }

  function filterRequest() {
    document.getElementById('request-list').innerHTML = renderRequestsRows(
      services.requests
    );
  }

  if (orders) {
    filterOrder();
  }

  if (requests) {
    filterRequest();
  }
}

function renderOrdersRows(orders) {
  return orders
    .map(
      (order) => `
          <tr>
            <td>
              ${normalizeDate(order.date)} as ${order.time}
            </td>
            <td>
              <div class="center">
                ${order.orderNumber}
                <i class="view-service-order-btn
                  bi bi-tools endBtn"
                  data-order='${JSON.stringify(order)}'>
                </i>
              </div>
            </td>
          </tr>
        `
    )
    .join('');
}
function renderRequestsRows(requests) {
  return requests
    .map(
      (request) => `
          <tr>
            <td>
              ${normalizeDate(request.dateVisit)} as ${request.timeVisit}
            </td>
            <td>
              <div class="center">
                ${request.requestNumber}
                <i class="view-service-request-btn
                  bi bi-tools endBtn"
                  data-request='${JSON.stringify(request)}'>
                </i>
              </div>
            </td>
          </tr>
        `
    )
    .join('');
}

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-service-order-btn')) {
    const order = JSON.parse(event.target.dataset.order);
    await orderDetails(order);
    closeModalRegister();
  }
});

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-service-request-btn')) {
    const request = JSON.parse(event.target.dataset.request);
    await requestDetailsOfficer(request);
    closeModalRegister();
  }
});

async function orderDetails(order) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');
  title.textContent = 'Detalhes da O.S';

  const isComplement =
    order.requestId.addressId.complement &&
    Object.keys(order.requestId.addressId.complement).length > 0;
  const complement =
    isComplement && order.requestId.addressId.complement.length > 0
      ? `<tr><td>Complemento</td><td>${order.requestId.addressId.complement}</td></tr>`
      : '';
  const env =
    order.requestId.envId && Object.keys(order.requestId.envId).length > 0
      ? `<tr>
          <td>Nome do Ambiente</td>
          <td>${order.requestId.envId.split('-').slice(1).join('-')}</td>
        </tr>`
      : '';
  const environment =
    order.requestId.environmentId &&
    Object.keys(order.requestId.environmentId).length > 0
      ? `<tr>
          <td>Nome do Ambiente</td>
          <td>${order.requestId.environmentId.environmentName}</td>
        </tr>
        <tr>
          <td>Tamanho do Ambiente</td>
          <td>${order.requestId.environmentId.environmentSize}</td>
        </tr>
        <tr>
          <td>Equipamento instalado</td>
          <td>
            <div class="center">
                ${order.requestId.environmentId.equipmentNumber}
                <i class="view-equipment-btn
                  bi bi-thermometer-snow endBtn"
                  data-equipment='${JSON.stringify(order)}'>
                </i>
              </div>
          </td>
        </tr>
        `
      : '';
  const altPhone =
    order.requestId.clientId.alternativePhone &&
    Object.keys(order.requestId.clientId.alternativePhone).length > 0
      ? `<tr><td>Telefone Alternativo</td><td>${formatPhoneValue(
          order.requestId.clientId.alternativePhone
        )}</td></tr>`
      : '';

  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ordem de Serviço ${order.orderNumber}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Status da O.S</td>
            <td>${order.orderStatus}</td>
          </tr>
          <tr>
            <td>Data Programada</td>
            <td>${normalizeDate(order.date)}</td>
          </tr>
          <tr>
            <td>Hora Programada</td>
            <td>${order.time}</td>
          </tr>
           <tr>
            <td>Técnico</td>
            <td>${order.officerId.userId.name}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Cliente ${order.requestId.clientId.clientNumber}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome</td>
            <td>${order.requestId.clientId.name}</td>
          </tr>
          <tr>
            <td>Telefone</td>
            <td>${formatPhoneValue(order.requestId.clientId.phone)}</td>
          </tr>
          ${altPhone}
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Endereço do Serviço Tipo ${order.requestId.addressId.addressType}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">${order.requestId.addressId.street}</td>
          </tr>
          <tr>
            <td>Número</td>
            <td>${order.requestId.addressId.number}</td>
          </tr>
          ${complement}
          <tr>
            <td>Bairro</td>
            <td>${order.requestId.addressId.district}</td>
          </tr>
          <tr>
            <td>Cidade</td>
            <td>${order.requestId.addressId.city} / ${
    order.requestId.addressId.state
  }</td>
          </tr>
          <tr>
            <td>CEP</td>
            <td>${formatPostalCode(order.requestId.addressId.postalCode)}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ambiente do Serviço
            </th>
          </tr>
        </thead>
        <tbody>
        ${env}
        ${environment}
        </tbody>
      </table>

      <div class="button-client-table">
        <i class="order-services-btn
          bi bi-tools tabBtn"
          data-services='${JSON.stringify(order)}'>
        </i>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="finishedOrder-Btn" class="hidden">Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await showModalServicesList();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('order-services-btn')) {
      const order = JSON.parse(event.target.dataset.services);
      await servicesOrderDetails(order);
    }
  });

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('view-equipment-btn')) {
      const equipmentData = JSON.parse(event.target.dataset.equipment);
      await equipmentEnvironmentDetailsOrder(equipmentData);
    }
  });
}

export async function servicesOrderDetails(order) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = `${order.orderNumber}`;

  function sanitizeId(str) {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function generateServices(services) {
    let divs = '';
    services.forEach((service, index) => {
      const sanitizedId = sanitizeId(service.serviceName);
      divs += `
        <div class="form-center">
          <table class="details-table">
            <thead>
              <tr>
                <th colspan="2" style="text-align: center;">
                  ${service.serviceName}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="2" style="text-align: center;">
                  ${service.serviceDescription.join('<br>')}
                </td>
              </tr>
            </tbody>
          </table>
          <div class="form-center">
            <label class="label">Observações da Atividade</label>
            <div class="form-group">
              <input class="form-group-input" type="text" id="obs-${sanitizedId}" placeholder="">
              <label class="form-group-label" for="obs-${sanitizedId}">Descreva</label>
            </div>
          </div>
        </div>
      `;
    });
    return divs;
  }

  const servicesDiv = generateServices(order.serviceIds);

  content.innerHTML = `
    <div class="form-center">
      <label class="label">Serviços</label>
      ${servicesDiv}
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="environment-Btn" class='hidden'>Ambiente</button>
      <button type="button" id="finishedOrder-Btn" class='hidden'>Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await orderDetails(order);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  const envBtn = document.getElementById('environment-Btn');
  const finishBtn = document.getElementById('finishedOrder-Btn');

  function checkEnvironment() {
    const isEnvironment =
      order.requestId.environmentId &&
      Object.keys(order.requestId.environmentId).length > 0;

    if (isEnvironment) {
      envBtn.classList.add('hidden');
      envBtn.classList.remove('modal-content-btn-ok');
      finishBtn.classList.remove('hidden');
      finishBtn.classList.add('modal-content-btn-ok');
    } else {
      showModalAlert(
        'Alert',
        'Criar Ambiente!',
        'Antes de Finalizar esta Ordem de Serviço, crie o ambiente do Novo Equipamento instalado.',
        closeModal
      );
      envBtn.classList.remove('hidden');
      envBtn.classList.add('modal-content-btn-ok');
      finishBtn.classList.remove('modal-content-btn-ok');
      finishBtn.classList.add('hidden');
    }
  }

  checkEnvironment();

  envBtn.onclick = async () => {
    localStorage.setItem(
      'returnModal',
      JSON.stringify({
        type: 'serviceOfficer',
        data: order,
      })
    );
    await newEnvironment(order.requestId.addressId);
  };

  finishBtn.onclick = async () => {
    let maintenance = [];

    order.serviceIds.forEach((service) => {
      const sanitizedId = sanitizeId(service.serviceName);
      const obsValue = document.getElementById(`obs-${sanitizedId}`).value;
      maintenance.push({
        service: service.serviceName,
        obs: obsValue || '',
      });
    });

    let dataSend = {
      orderId: order._id,
      requestId: order.requestId._id,
      environmentId: order.requestId.environmentId?._id,
      maintenance,
    };

    const env = order.requestId.environmentId;
    env.clientId = order.requestId.clientId;
    env.addressId = order.requestId.addressId;

    try {
      const finishRequest = await registerHistory(dataSend);
      if (finishRequest.status === 401) {
        showModalAlert(
          'Next',
          finishRequest.title,
          finishRequest.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (finishRequest.status === 403) {
        window.location.reload();
      } else if (
        finishRequest.status === 404 ||
        finishRequest.status === 500 ||
        finishRequest.status === 409
      ) {
        showModalAlert(
          'Alert',
          finishRequest.title,
          finishRequest.msg,
          closeModal
        );
        return;
      } else if (finishRequest.status === 201) {
        const level = finishRequest.level;
        await openSession(level);
        showModalAlert(
          'Alert',
          finishRequest.title,
          finishRequest.msg,
          closeModal
        );
        const confirmed = await showModalAlert(
          'Confirm',
          'Requisição de Retorno?',
          'Deseja gerar uma Requisição de Retorno futura para esse Equipamento?',
          () => {
            return true;
          }
        );
         if (confirmed) {
          await modalNewRequest(env);
        } else {
          closeModalDetails();
          await showModalServicesList();
        }
      }
    } catch (error) {
      console.error('Erro ao finalizar ordem de serviço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    }
  };
}

async function equipmentEnvironmentDetailsOrder(order) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = `Equipamento ${order.requestId.environmentId.equipmentNumber}`;

  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ambiente do Equipamento
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome do Ambiente</td>
            <td>${order.requestId.environmentId.environmentName}</td>
          </tr>
          <tr>
            <td>Tamanho do Ambiente</td>
            <td>${order.requestId.environmentId.environmentSize}</td>
          </tr>
        </tbody>
         <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Equipamento Tipo ${order.requestId.environmentId.equipmentType} Instalado
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Marca</td>
            <td>${order.requestId.environmentId.equipmentBrand}</td>
          </tr>
          <tr>
            <td>Modelo</td>
            <td>${order.requestId.environmentId.equipmentModel}</td>
          </tr>
          <tr>
            <td>Capacidade</td>
            <td>${order.requestId.environmentId.capacityBTU} BTU</td>
          </tr>
          <tr>
            <td>Ciclo</td>
            <td>${order.requestId.environmentId.cicle}</td>
          </tr>
          <tr>
            <td>Voltagem</td>
            <td>${order.requestId.environmentId.volt}</td>
          </tr>
          <tr>
            <td>Nº Serial</td>
            <td>${order.requestId.environmentId.serialModel}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="finishedOrder-Btn" class="hidden">Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await orderDetails(order);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}

async function requestDetailsOfficer(request) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');
  title.textContent = 'Detalhes da Requisição';

  const isComplement =
    request.addressId.complement &&
    Object.keys(request.addressId.complement).length > 0;
  const complement =
    isComplement && request.addressId.complement.length > 0
      ? `<tr><td>Complemento</td><td>${request.addressId.complement}</td></tr>`
      : '';
  const env =
    request.envId && Object.keys(request.envId).length > 0
      ? `<tr>
          <td>Nome do Ambiente</td>
          <td>${request.envId.split('-').slice(1).join('-')}</td>
        </tr>`
      : '';
  const environment =
    request.environmentId && Object.keys(request.environmentId).length > 0
      ? `<tr>
          <td>Nome do Ambiente</td>
          <td>${request.environmentId.environmentName}</td>
        </tr>
        <tr>
          <td>Tamanho do Ambiente</td>
          <td>${request.environmentId.environmentSize}</td>
        </tr>
        <tr>
          <td>Equipamento instalado</td>
          <td>
            <div class="center">
                ${request.environmentId.equipmentNumber}
                <i class="view-equipment-btn
                  bi bi-thermometer-snow endBtn"
                  data-equipment='${JSON.stringify(request)}'>
                </i>
              </div>
          </td>
        </tr>
        `
      : '';
  const altPhone =
    request.clientId.alternativePhone &&
    Object.keys(request.clientId.alternativePhone).length > 0
      ? `<tr><td>Telefone Alternativo</td><td>${formatPhoneValue(
          request.clientId.alternativePhone
        )}</td></tr>`
      : '';

  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Requisição ${request.requestNumber}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Status da REQ</td>
            <td>${request.requestStatus}</td>
          </tr>
          <tr>
            <td>Data Programada</td>
            <td>${normalizeDate(request.dateVisit)}</td>
          </tr>
          <tr>
            <td>Hora Programada</td>
            <td>${request.timeVisit}</td>
          </tr>
           <tr>
            <td>Técnico</td>
            <td>${request.officerId.userId.name}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Cliente ${request.clientId.clientNumber}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome</td>
            <td>${request.clientId.name}</td>
          </tr>
          <tr>
            <td>Telefone</td>
            <td>${formatPhoneValue(request.clientId.phone)}</td>
          </tr>
          ${altPhone}
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Endereço do Serviço Tipo ${request.addressId.addressType}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">${request.addressId.street}</td>
          </tr>
          <tr>
            <td>Número</td>
            <td>${request.addressId.number}</td>
          </tr>
          ${complement}
          <tr>
            <td>Bairro</td>
            <td>${request.addressId.district}</td>
          </tr>
          <tr>
            <td>Cidade</td>
            <td>${request.addressId.city} / ${request.addressId.state}</td>
          </tr>
          <tr>
            <td>CEP</td>
            <td>${formatPostalCode(request.addressId.postalCode)}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ambiente do Serviço
            </th>
          </tr>
        </thead>
        <tbody>
        ${env}
        ${environment}
        </tbody>
      </table>

      <div class="button-client-table">
        <i class="request-services-btn
          bi bi-tools tabBtn"
          data-services='${JSON.stringify(request)}'>
        </i>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="finishedOrder-Btn" class="hidden">Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await showModalServicesList();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('request-services-btn')) {
      const request = JSON.parse(event.target.dataset.services);
      await servicesRequestDetails(request);
    }
  });

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('view-equipment-btn')) {
      const equipmentData = JSON.parse(event.target.dataset.equipment);
      await equipmentEnvironmentDetailsRequest(equipmentData);
    }
  });
}

async function equipmentEnvironmentDetailsRequest(request) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = `Equipamento ${request.environmentId.equipmentNumber}`;

  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Ambiente do Equipamento
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Nome do Ambiente</td>
            <td>${request.environmentId.environmentName}</td>
          </tr>
          <tr>
            <td>Tamanho do Ambiente</td>
            <td>${request.environmentId.environmentSize}</td>
          </tr>
        </tbody>
         <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Equipamento Tipo ${request.environmentId.equipmentType} Instalado
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Marca</td>
            <td>${request.environmentId.equipmentBrand}</td>
          </tr>
          <tr>
            <td>Modelo</td>
            <td>${request.environmentId.equipmentModel}</td>
          </tr>
          <tr>
            <td>Capacidade</td>
            <td>${request.environmentId.capacityBTU} BTU</td>
          </tr>
          <tr>
            <td>Ciclo</td>
            <td>${request.environmentId.cicle}</td>
          </tr>
          <tr>
            <td>Voltagem</td>
            <td>${request.environmentId.volt}</td>
          </tr>
          <tr>
            <td>Nº Serial</td>
            <td>${request.environmentId.serialModel}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="finishedOrder-Btn" class="hidden">Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await requestDetailsOfficer(request);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}

export async function servicesRequestDetails(request) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  const isProblem =
    request.maintenanceProblem &&
    Object.keys(request.maintenanceProblem).length > 0;
  const isInstallation =
    request.installationEquipment &&
    Object.keys(request.installationEquipment).length > 0;
  const isServices =
    request.serviceIds && Object.keys(request.serviceIds).length > 0;

  let serviceProgram = '';

  if (isServices) {
    generateServices(request.serviceIds);
  } else if (isInstallation) {
    serviceProgram = `
      <label class="label">Serviço de Instalação</label>
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Incluir Equipamento no serviço?
            <th>
          <tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">${request.installationEquipment}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else if (isProblem) {
    serviceProgram = `
      <label class="label">Serviço de Manutenção</label>
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Problemas Reclamados pelo Cliente
            <th>
          <tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">${request.maintenanceProblem}</td>
          </tr>
        </tbody>
      </table>
    `;
  } else {
    serviceProgram = '';
  }

  title.textContent = `${request.requestNumber}`;

  function generateServices(services) {
    let divs = '';
    services.forEach((service, index) => {
      divs += `
        <div class="form-center">
          <table class="details-table">
            <thead>
              <tr>
                <th colspan="2" style="text-align: center;">
                  ${service.serviceName}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="2" style="text-align: center;">
                  ${service.serviceDescription.join('<br>')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });
    serviceProgram = `
      <label class="label">Serviços</label>
      ${divs}
    `;
  }

  content.innerHTML = `
    <div class="form-center">
      ${serviceProgram}
      <div class="form-center">
        <label class="label">Observações da Atividade</label>
        <div class="form-group">
          <input class="form-group-input" type="text" id="feedback" placeholder="">
          <label class="form-group-label" for="">Descreva</label>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="saveRequest-Btn" class='hidden'>Salvar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await requestDetailsOfficer(request);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  const saveBtn = document.getElementById('saveRequest-Btn');

  async function checkEnvironment() {
    const isEnvironment =
      request.environmentId && Object.keys(request.environmentId).length > 0;
    const isTypeMaintenance = request.requestType === 'Manutenção';
    if (isTypeMaintenance && !isEnvironment) {
      const confirmed = await showModalAlert(
        'Confirm',
        'Cadastro de Ambiente',
        'Deseja cadastrar um novo ambiente?',
        () => {
          return true;
        }
      );
      if (confirmed) {
        localStorage.setItem(
          'returnModal',
          JSON.stringify({
            type: 'requestOfficer',
            data: request,
          })
        );
        await newEnvironment(request.addressId);
      } else {
        saveBtn.classList.remove('hidden');
        saveBtn.classList.add('modal-content-btn-ok');
      }
    } else {
      saveBtn.classList.remove('hidden');
      saveBtn.classList.add('modal-content-btn-ok');
    }
  }

  checkEnvironment();

  saveBtn.onclick = async () => {
    const feedbackRequest = document.getElementById('feedback').value;

    if (!feedbackRequest) {
      showModalAlert(
        'Alert',
        'Descrição da Atividade',
        'Descreva as observações da Visita Técnica',
        closeModal
      );
      return;
    }

    const dataSend = {
      feedback: `Visita Técnica Realizada! Observações do Técnico: ${feedbackRequest}`,
      requestStatus: 'Visita Técnica Realizada',
    };

    try {
      const requestdataUpdate = await updateRequest(dataSend, request._id);
      if (requestdataUpdate.status === 401) {
        showModalAlert(
          'Next',
          requestdataUpdate.title,
          requestdataUpdate.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (requestdataUpdate.status === 403) {
        window.location.reload();
      } else if (
        requestdataUpdate.status === 404 ||
        requestdataUpdate.status === 500
      ) {
        showModalAlert(
          'Alert',
          requestdataUpdate.title,
          requestdataUpdate.msg,
          closeModal
        );
        return;
      } else if (requestdataUpdate.status === 200) {
        const level = requestdataUpdate.level;
        await openSession(level);
        showModalAlert(
          'Next',
          requestdataUpdate.title,
          requestdataUpdate.msg,
          async () => {
            closeModalDetails();
            await showModalServicesList();
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados de endereço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  };
}
