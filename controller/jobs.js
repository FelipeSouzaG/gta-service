import {
  closeModal,
  closeModalDetails,
  closeModalRegister,
  exitSession,
  openSession,
  showModalAlert,
} from '../js/modals.js';

import { listAllServiceOfficer, registerHistory } from '../js/services.js';
import { formatPhoneValue, formatPostalCode, normalizeDate } from '../js/validation.js';
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
      showModalAlert(
        'Alert',
        listServiceData.title,
        listServiceData.msg,
        closeModal
      );
      return;
    } else if (listServiceData.status === 404) {
      showModalAlert('Next', listServiceData.title, listServiceData.msg, () => {
        closeModalRegister();
      });
    } else if (listServiceData.status === 200) {
      const level = listServiceData.level;
      await openSession(level);
      services = [...listServiceData.ordersList];
    }
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  const filteredOrders = services.filter(
    (order) => order.orderStatus === 'Programado'
  );

  if (filteredOrders.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Serviço Programado!',
      'Não há programação de serviços para hoje.',
      async () => {
        closeModalRegister();
      }
    );
  }

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Ordens de Serviços';

  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Programação de Serviços
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Técnico</td>
            <td>${services[0].officerId.userId.name}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th>Número</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody id="order-list">
          ${renderOrdersRows(services)}
        </tbody>
      </table>
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
    document.getElementById('order-list').innerHTML =
      renderOrdersRows(filteredOrders);
  }
  filterOrder();
}

function renderOrdersRows(orders) {
  return orders
    .map(
      (order) => `
          <tr>
            <td>
              ${order.orderNumber}
            </td>
            <td>
              <div class="center">
                ${order.orderStatus}
                <i class="view-order-btn
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

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-order-btn')) {
    const order = JSON.parse(event.target.dataset.order);
    await orderDetails(order);
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
      await equipmentEnvironmentDetails(equipmentData);
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
      .normalize('NFD') // Remove acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/\s+/g, '_') // Substitui espaços por underscore
      .replace(/[^a-zA-Z0-9_-]/g, ''); // Remove caracteres especiais
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
          return await modalNewRequest(env);
        }
        await showModalServicesList();
        closeModalDetails();
      }
    } catch (error) {
      console.error('Erro ao finalizar ordem de serviço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    }
  };
}

async function equipmentEnvironmentDetails(order) {
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
