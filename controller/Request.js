import {
  registerBudget,
  updateBudget,
  listAllRequest,
  listAllService,
  updateRequest,
  listAllOfficers,
  registerOrder,
} from '../js/services.js';
import {
  showModalAlert,
  closeModal,
  closeModalDetails,
  exitSession,
  openSession,
  closeModalRegister,
} from '../js/modals.js';
import {
  formatPhoneValue,
  formatPostalCode,
  normalizeDate,
} from '../js/validation.js';
import { showModalNewService } from './Service.js';
import { newOfficer } from './Officers.js';

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('listRequestMobile').addEventListener('click', () => {
    listRequestModal();
  });
  document
    .getElementById('listRequestDesktop')
    .addEventListener('click', () => {
      listRequestModal();
    });
});

export async function listRequestModal() {
  let requests = [];
  try {
    const listRequest = await listAllRequest();
    if (listRequest.status === 401) {
      showModalAlert('Next', listRequest.title, listRequest.msg, async () => {
        await exitSession();
      });
    } else if (listRequest.status === 403) {
      showModalAlert('Alert', listRequest.title, listRequest.msg, closeModal);
      return;
    } else if (listRequest.status === 400) {
      requests = [];
    } else if (listRequest.status === 200) {
      const level = listRequest.level;
      await openSession(level);
      requests = [...listRequest.requestList];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  if (requests.length === 0) {
    showModalAlert(
      'Next',
      'Não há requisições!',
      'Por favor, faça cadastros de requisições de serviços para clientes',
      async () => {
        closeModalRegister();
      }
    );
  }

  let filteredRequests = requests;

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Lista de Requisições';
  content.innerHTML = `
    <div class="form-center">
      <select id="select-request-status" class="select">
        <option value="">Requisições por Status</option>
        <option value="Pendente">Pendente</option>
        <option value="Retorno">Retorno</option>
        <option value="Visita Técnica Programada">Visita Técnica Programada</option>
        <option value="Visita Técnica Realizada">Visita Técnica Realizada</option>
        <option value="Orçamento">Orçamento</option>
        <option value="Orçamento Aprovado">Orçamento Aprovado</option>
        <option value="Orçamento Reprovado">Orçamento Reprovado</option>
        <option value="Ordem de Serviço Programada">Ordem de Serviço Programada</option>
        <option value="Ordem de Serviço Realizada">Ordem de Serviço Realizada</option>
        <option value="Finalizado">Finalizado</option>
      </select>
      <table class="details-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Tipo</th>
          </tr>
        </thead>
        <tbody id="request-list">
          ${renderRequestRows(filteredRequests)}
        </tbody>
      </table>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="newRequestBtn" class="hidden">+Requisição</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = () => {
    closeModalRegister();
  };

  const requestStatusFilter = document.getElementById('select-request-status');

  requestStatusFilter.addEventListener('change', () => {
    filterRequest();
  });

  function filterRequest() {
    const selectedStatus = document.getElementById(
      'select-request-status'
    ).value;

    const filteredRequest = filteredRequests.filter(
      (request) => !selectedStatus || request.requestStatus === selectedStatus
    );

    document.getElementById('request-list').innerHTML =
      renderRequestRows(filteredRequest);
  }
}

function renderRequestRows(requests) {
  return requests
    .map(
      (request) => `
          <tr>
            <td>
              ${request.requestStatus}
            </td>
            <td>
              <div class="center">
                ${request.requestType}
                <i class="view-request-btn
                  bi bi-thermometer-snow endBtn"
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
  if (event.target.classList.contains('view-request-btn')) {
    const requestData = JSON.parse(event.target.dataset.request);
    await requestDetails(requestData);
    closeModalRegister();
  }
});

async function requestDetails(request) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  let status;
  let reqStatus = `<tr>
    <td>Status da Requisição</td>
    <td>${request.requestStatus}</td>
  </tr>`;
  if (request.requestStatus === 'Pendente') {
    status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-pending);">
          Requisição criada em ${normalizeDate(
            request.createdAt
          )} aguardando avaliação técnica.
        </td>
      </tr>`;
  } else if (request.requestStatus === 'Retorno') {
    status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-pending);">
          Requisição de Retorno para ${normalizeDate(request.requestDate)}.
        </td>
      </tr>`;
  } else if (request.requestStatus === 'Visita Técnica Programada') {
    status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-valid);">
          Visita técnica agendanda para ${normalizeDate(
            request.dateVisit
          )} ás ${request.timeVisit}.
        </td>
      </tr>`;
  } else if (request.requestStatus === 'Visita Técnica Realizada') {
    status = `<tr>
          <td colspan="2" style="text-align: center; background-color: var(--color-pending);">
            ${request.feedback}
          </td>
        </tr>`;
  } else if (request.requestStatus === 'Orçamento') {
    const isBudget =
      request.budgetId.budgetStatus &&
      Object.keys(request.budgetId.budgetStatus).length > 0;
    const budgetStatus = isBudget ? request.budgetId.budgetStatus : '';
    if (budgetStatus === 'Pendente') {
      reqStatus = `
        <tr>
          <td>Status da Requisição</td>
          <td>
            <div class="center">
              ${request.requestStatus}
              <i class="view-budgetNoClient-btn
                bi bi-pencil-square endBtn"
                data-request='${JSON.stringify(request)}'>
              </i>
            </div>
          </td>
        </tr>
      `;
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-valid);">
          ${request.feedback}
        </td>
      </tr>`;
    } else {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          Status Não identificado. Contacte o erro ao Programador.
        </td>
      </tr>`;
    }
  } else if (request.requestStatus === 'Orçamento Aprovado') {
    const isBudget =
      request.budgetId.budgetStatus &&
      Object.keys(request.budgetId.budgetStatus).length > 0;
    const budgetStatus = isBudget ? request.budgetId.budgetStatus : '';
    if (budgetStatus === 'Aprovado') {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-pending);">
          ${request.budgetId.feedback}
        </td>
      </tr>`;
    } else {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          Status Não identificado. Contacte o erro ao Programador.
        </td>
      </tr>`;
    }
  } else if (request.requestStatus === 'Orçamento Reprovado') {
    const isBudget =
      request.budgetId.budgetStatus &&
      Object.keys(request.budgetId.budgetStatus).length > 0;
    const budgetStatus = isBudget ? request.budgetId.budgetStatus : '';
    if (budgetStatus === 'Reprovado') {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          ${request.budgetId.feedback}
        </td>
      </tr>`;
    } else {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          Status Não identificado. Contacte o erro ao Programador.
        </td>
      </tr>`;
    }
  } else if (request.requestStatus === 'Ordem de Serviço Programada') {
    const isOrder =
      request.orderId.orderStatus &&
      Object.keys(request.orderId.orderStatus).length > 0;
    const orderStatus = isOrder ? request.orderId.orderStatus : '';
    if (orderStatus === 'Programado') {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-valid);">
          ${request.feedback}
        </td>
      </tr>`;
    } else {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          Status Não identificado. Contacte o erro ao Programador.
        </td>
      </tr>`;
    }
  } else if (request.requestStatus === 'Ordem de Serviço Realizada') {
    const isOrder =
      request.orderId.orderStatus &&
      Object.keys(request.orderId.orderStatus).length > 0;
    const orderStatus = isOrder ? request.orderId.orderStatus : '';
    if (orderStatus === 'Realizado') {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-valid);">
          ${request.feedback}
        </td>
      </tr>`;
    } else {
      status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-invalid);">
          Status Não identificado. Contacte o erro ao Programador.
        </td>
      </tr>`;
    }
  } else if (request.requestStatus === 'Finalizado') {
    status = `<tr>
        <td colspan="2" style="text-align: center; background-color: var(--color-valid);">
        ${request.feedback}
        </td>
      </tr>`;
  }

  const reqType = request.requestType;
  let typeService;
  const isServiceIds =
    request.serviceIds && Object.keys(request.serviceIds).length > 0;

  const isMaintenanceProblem =
    request.maintenanceProblem &&
    Object.keys(request.maintenanceProblem).length > 0;

  const isInstallation =
    request.installationEquipment &&
    Object.keys(request.installationEquipment).length > 0;

  const servicesTableRows = generateServiceTableRows(request.serviceIds);
  function generateServiceTableRows(services) {
    let rows = '';
    services.forEach((service) => {
      rows += ` ${service.serviceName}, `;
    });
    const tableServices = `
      <tr>
        <td>Serviços</td>
        <td>${rows}</td>
      </tr>
    `;
    return tableServices;
  }

  if (reqType === 'Manutenção') {
    if (isServiceIds) {
      typeService = servicesTableRows;
    } else if (isMaintenanceProblem) {
      typeService = `
        <tr>
          <td>Problemas relatados:</td>
          <td>${request.maintenanceProblem}</td>
        </tr>
      `;
    } else {
      typeService = '';
    }
  } else if (reqType === 'Instalação') {
    if (isInstallation && isServiceIds) {
      typeService = `
        <tr>
          <td>Equipamento:</td>
          <td>${request.installationEquipment}</td>
        </tr>
        ${servicesTableRows}
      `;
    } else if (isInstallation && !isServiceIds) {
      typeService = `
        <tr>
          <td>Equipamento:</td>
          <td>${request.installationEquipment}</td>
        </tr>
      `;
    } else {
      typeService = '';
    }
  } else {
    typeService = '';
  }

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
        </tr>`
      : '';
  const isAltPhone =
    request.clientId.alternativePhone &&
    Object.keys(request.clientId.alternativePhone).length > 0;
  const altPhone =
    isAltPhone && request.clientId.alternativePhone.length > 0
      ? `<tr><td>Telefone Alternativo</td><td>${formatPhoneValue(
          request.clientId.alternativePhone
        )}</td></tr>`
      : '';
  const isEmail =
    request.clientId.email && Object.keys(request.clientId.email).length > 0;
  const email =
    isEmail && request.clientId.email.length > 0
      ? `<tr><td>E-mail</td><td>${request.clientId.email}</td></tr>`
      : '';
  const userSite =
    request.clientId.userId && Object.keys(request.clientId.userId).length > 0
      ? `<tr><td>Usuário do Site?</td><td>Sim.</td></tr>`
      : `<tr><td>Usuário do Site?</td><td>Não.</td></tr>`;

  title.textContent = 'Alterar Requisição';

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
            <td>Tipo de Serviço</td>
            <td>${request.requestType}</td>
          </tr>
          ${typeService}
          ${reqStatus}
          ${status}
        </tbody>
         <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Endereço
            </th>
          </tr>
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
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Cliente
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
          ${email}
          ${userSite}
        </tbody>
      </table>
      <div id="updateRequestAction" class="form-center">
        <label class="label">Modificar Status:</label>
        <div class="data-items">
          <label class="radio-option label">
            <input type="radio" class="radio" name="update-status" value="Visita Técnica">
            <span class="span">Visita Técnica</span>
          </label>
          <label class="radio-option label">
            <input type="radio" class="radio" name="update-status" value="Orçamento">
            <span class="span">Orçamento</span>
          </label>
          <label class="radio-option label">
            <input type="radio" class="radio" name="update-status" value="Ordem de Serviço">
            <span class="span">Ordem de Serviço</span>
          </label>
          <label class="radio-option label">
            <input type="radio" class="radio" name="update-status" value="Finalizado">
            <span class="span">Finalizado</span>
          </label>
        </div>
  
        <div id="finished-container" class="hidden">
          <label class="label">Finalizar ${request.requestNumber}?</label>
          <div class="data-items">       
            <label class="label">Selecione uma causa:</label>
            <div class="data-items">
              <label class="label">
                <input type="checkbox" class="checkbox" name="finished" value="Solicitação não poderá ser atendida.">
                <span class="span">Serviço Inviável</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="schedule-Btn" class="hidden">Agendar</button>
      <button type="button" id="budget-Btn" class="hidden">Orçamento</button>
      <button type="button" id="order-Btn" class="hidden">Gerar O.S</button>
      <button type="button" id="finished-Btn" class="hidden">Finalizar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await listRequestModal();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('view-budgetNoClient-btn')) {
      const enterBudget = JSON.parse(event.target.dataset.request);
      await openBudgetClient(enterBudget);
      closeModalRegister();
    }
  });

  let selectedStatus = '';
  let finishedDescription = document.getElementById('finished');

  function handleStatusOptions() {
    const radioOptions = document.querySelectorAll('.radio-option');
    const divAction = document.getElementById('updateRequestAction');
    if (
      request.requestStatus === 'Ordem de Serviço Programada' ||
      request.requestStatus === 'Ordem de Serviço Realizada'
    ) {
      radioOptions.forEach((option) => {
        if (option.querySelector('input').value !== 'Finalizado') {
          option.style.display = 'none';
        }
      });
    } else if (
      request.requestStatus === 'Orçamento' ||
      request.requestStatus === 'Orçamento Reprovado'
    ) {
      radioOptions.forEach((option) => {
        if (option.querySelector('input').value !== 'Finalizado') {
          option.style.display = 'none';
        }
      });
    } else if (request.requestStatus === 'Orçamento Aprovado') {
      radioOptions.forEach((option) => {
        if (
          option.querySelector('input').value !== 'Finalizado' &&
          option.querySelector('input').value !== 'Ordem de Serviço'
        ) {
          option.style.display = 'none';
        }
      });
    } else if (request.requestStatus === 'Visita Técnica Programada') {
      radioOptions.forEach((option) => {
        if (option.querySelector('input').value !== 'Finalizado') {
          option.style.display = 'none';
        }
      });
    } else if (request.requestStatus === 'Visita Técnica Realizada') {
      radioOptions.forEach((option) => {
        if (
          option.querySelector('input').value !== 'Finalizado' &&
          option.querySelector('input').value !== 'Ordem de Serviço' &&
          option.querySelector('input').value !== 'Orçamento'
        ) {
          option.style.display = 'none';
        }
      });
    } else if (request.requestStatus === 'Finalizado') {
      divAction.classList.remove('form-center');
      divAction.classList.add('hidden');
    } else if (request.requestStatus === 'Pendente') {
      radioOptions.forEach((option) => {
        if (
          option.querySelector('input').value !== 'Visita Técnica' &&
          option.querySelector('input').value !== 'Orçamento' &&
          option.querySelector('input').value !== 'Finalizado'
        ) {
          option.style.display = 'none';
        }
      });
    } else if (request.requestStatus === 'Retorno') {
      radioOptions.forEach((option) => {
        if (
          option.querySelector('input').value !== 'Visita Técnica' &&
          option.querySelector('input').value !== 'Orçamento' &&
          option.querySelector('input').value !== 'Ordem de Serviço' &&
          option.querySelector('input').value !== 'Finalizado'
        ) {
          option.style.display = 'none';
        }
      });
    }
  }

  handleStatusOptions();

  function toggleType() {
    const finishedContainer = document.getElementById('finished-container');
    const radioInputs = document.querySelectorAll(
      'input[name="update-status"]'
    );

    radioInputs.forEach((input) => {
      input.addEventListener('change', async () => {
        if (input.value === 'Visita Técnica' && input.checked) {
          finishedContainer.classList.remove('form-center');
          finishedContainer.classList.add('hidden');
          selectedStatus = 'Visita Técnica';
          clearFinished();
          checked();
        } else if (input.value === 'Finalizado' && input.checked) {
          finishedContainer.classList.remove('hidden');
          finishedContainer.classList.add('form-center');
          selectedStatus = 'Finalizado';
          checked();
        } else if (input.value === 'Orçamento' && input.checked) {
          finishedContainer.classList.remove('form-center');
          finishedContainer.classList.add('hidden');
          selectedStatus = 'Orçamento';
          clearAll();
          checked();
        } else if (input.value === 'Ordem de Serviço' && input.checked) {
          finishedContainer.classList.remove('form-center');
          finishedContainer.classList.add('hidden');
          selectedStatus = 'Ordem de Serviço';
          clearAll();
          checked();
        }
      });
    });
  }

  function clearFinished() {
    finishedDescription = '';
    const checkboxes = document.querySelectorAll('input[name="finished"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  }

  function clearAll() {
    clearFinished();
  }

  toggleType();

  function setupSingleCheckboxSelection() {
    const checkboxes = document.querySelectorAll('input[name="finished"]');
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener('change', function () {
        if (this.checked) {
          checkboxes.forEach((cb) => {
            if (cb !== this) cb.checked = false;
          });
          finishedDescription = this.value;
        } else {
          finishedDescription = '';
        }
      });
    });
  }

  setupSingleCheckboxSelection();

  const scheduleBtn = document.getElementById('schedule-Btn');
  const budgetBtn = document.getElementById('budget-Btn');
  const orderBtn = document.getElementById('order-Btn');
  const finishedBtn = document.getElementById('finished-Btn');

  document.querySelectorAll('input[name="finished"]').forEach((checkbox) => {
    checkbox.addEventListener('change', checked);
  });

  function checked() {
    const isVisitFilled = selectedStatus === 'Visita Técnica';
    const isFinishedFilled = finishedDescription.trim() !== '';
    const isBudget = selectedStatus === 'Orçamento';
    const isOrder = selectedStatus === 'Ordem de Serviço';
    if (isVisitFilled) {
      scheduleBtn.classList.remove('hidden');
      scheduleBtn.classList.add('modal-content-btn-edit');
      budgetBtn.classList.remove('modal-content-btn-edit');
      orderBtn.classList.remove('modal-content-btn-edit');
      finishedBtn.classList.remove('modal-content-btn-edit');
      budgetBtn.classList.add('hidden');
      orderBtn.classList.add('hidden');
      finishedBtn.classList.add('hidden');
    } else if (isBudget) {
      budgetBtn.classList.remove('hidden');
      budgetBtn.classList.add('modal-content-btn-edit');
      scheduleBtn.classList.remove('modal-content-btn-edit');
      orderBtn.classList.remove('modal-content-btn-edit');
      finishedBtn.classList.remove('modal-content-btn-edit');
      scheduleBtn.classList.add('hidden');
      orderBtn.classList.add('hidden');
      finishedBtn.classList.add('hidden');
    } else if (isFinishedFilled) {
      finishedBtn.classList.remove('hidden');
      finishedBtn.classList.add('modal-content-btn-edit');
      budgetBtn.classList.remove('modal-content-btn-edit');
      orderBtn.classList.remove('modal-content-btn-edit');
      scheduleBtn.classList.remove('modal-content-btn-edit');
      budgetBtn.classList.add('hidden');
      orderBtn.classList.add('hidden');
      scheduleBtn.classList.add('hidden');
    } else if (isOrder) {
      orderBtn.classList.remove('hidden');
      orderBtn.classList.add('modal-content-btn-edit');
      budgetBtn.classList.remove('modal-content-btn-edit');
      scheduleBtn.classList.remove('modal-content-btn-edit');
      finishedBtn.classList.remove('modal-content-btn-edit');
      budgetBtn.classList.add('hidden');
      scheduleBtn.classList.add('hidden');
      finishedBtn.classList.add('hidden');
    } else {
      scheduleBtn.classList.add('hidden');
      budgetBtn.classList.add('hidden');
      orderBtn.classList.add('hidden');
      finishedBtn.classList.add('hidden');
    }
  }

  scheduleBtn.onclick = async () => {
    showModalNewSchedule(request);
  };

  budgetBtn.onclick = async () => {
    await showModalNewBudget(request);
  };

  orderBtn.onclick = async () => {
    await showModalNewOrder(request);
  };

  finishedBtn.onclick = async () => {
    if (!finishedDescription) {
      return showModalAlert(
        'Alert',
        'Causa do Fechamento!',
        'Selecione uma causa do Fechamento da REQ.',
        closeModal
      );
    }
    const dataRequestSendUpdate = {
      requestStatus: selectedStatus,
      feedback: finishedDescription,
    };

    await sendUpdateRequest(dataRequestSendUpdate, request._id);
  };
}

async function sendUpdateRequest(dataSend, requestId) {
  try {
    const requestdataUpdate = await updateRequest(dataSend, requestId);
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
          await listRequestModal();
          closeModalDetails();
        }
      );
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }
}

async function showModalNewOrder(request) {
  let officers = [];
  try {
    const listOfficers = await listAllOfficers();
    if (listOfficers.status === 401) {
      showModalAlert('Next', listOfficers.title, listOfficers.msg, async () => {
        await exitSession();
      });
    } else if (listOfficers.status === 403) {
      showModalAlert('Alert', listOfficers.title, listOfficers.msg, closeModal);
      return;
    } else if (listOfficers.status === 400) {
      showModalAlert('Next', listOfficers.title, listOfficers.msg, async () => {
        await requestDetails(request);
        closeModalDetails();
      });
    } else if (listOfficers.status === 200) {
      const level = listOfficers.level;
      await openSession(level);
      officers = [...listOfficers.listOfficer];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  const technician = officers.filter((tec) => tec.officerType === 'Técnico');

  if (technician.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Técnico Cadastrado!',
      'Cadastre Colaborador Nível Técnico para atribuir a uma Ordem de Serviço.',
      async () => {
        await newOfficer();
      }
    );
  }

  let servicesItem;
  const isServiceIds =
    request.serviceIds && Object.keys(request.serviceIds).length > 0
      ? true
      : false;

  const isbudgetServices =
    request.budgetId && Object.keys(request.budgetId.serviceIds).length > 0
      ? true
      : false;
  if (isServiceIds) {
    servicesItem = request.serviceIds;
  } else if (isbudgetServices) {
    servicesItem = request.budgetId.serviceIds;
  } else if (isServiceIds && isbudgetServices) {
    servicesItem = request.serviceIds;
  } else {
    servicesItem = '';
  }

  const servicesTableRows = generateServiceTableRows(servicesItem);
  function generateServiceTableRows(services) {
    let rows = '';
    services.forEach((service) => {
      rows += `
          <tr>
            <td colspan="2" style="text-align: center;">${service.serviceName}</td>
          </tr>
        `;
    });
    return rows;
  }

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Ordem de Serviço';
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
            <td>Tipo de Serviço</td>
            <td>${request.requestType}</td>
          </tr>
        </tbody>
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Serviços
            </th>
          </tr>
        </thead>
        <tbody>
        ${servicesTableRows}
        </tbody>
      </table>

      <label class="label">Técnico para o Serviço:</label>
      <select class="select" id="selectTechnician">
        <option value="">Técnicos</option>
        ${technician
          .map(
            (tec) => `<option value="${tec._id}">${tec.userId.name}</option>`
          )
          .join('')}
      </select>

      <div class="form-content">
        <label class="label">Agendar Serviço para:</label>
        <div class="form-group">
          <input class="form-group-input" type="date" id="dateVisit" placeholder="">
          <label class="form-group-label" for="">Data:</label>
        </div>
        <div class="form-group">
          <input class="form-group-input" type="time" id="timeVisit" min="08:00" max="18:00" placeholder="">
          <label class="form-group-label" for="">Horário:</label>
        </div>
      </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="sendOrder" class="hidden">Enviar</button>
    </div>
  `;

  btnReturn.onclick = async function () {
    await requestDetails(request);
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  let visitDate = document.getElementById('dateVisit');
  let visitTime = document.getElementById('timeVisit');

  function isSchedulingDateValid(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate() + 1,
      selectedDate.getHours() + 3,
      selectedDate.getMinutes(),
      selectedDate.getSeconds(),
      selectedDate.getMilliseconds() - 1
    );

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds()
    );

    const day = selectedDateOnly.getDay();
    if (day === 0 || day === 6) {
      showModalAlert(
        'Alert',
        'Data Inválida!',
        'Marque um dia de segunda a sexta.',
        closeModal
      );
      document.getElementById('dateVisit').value = '';
      return false;
    }

    if (selectedDateOnly < todayOnly) {
      showModalAlert(
        'Alert',
        'Data Inválida!',
        'Não é possível agendar para dias e horários passados.',
        closeModal
      );
      document.getElementById('dateVisit').value = '';
      return false;
    }
    return true;
  }

  function isSchedulingTimeValid(time) {
    const [hour, minute] = time.split(':').map(Number);
    if (hour < 8 || (hour === 18 && minute > 0) || hour > 18) {
      showModalAlert(
        'Alert',
        'Horário Inválido!',
        'Insira um horário de 08:00 às 18:00',
        closeModal
      );
      return false;
    }

    const selectedDate = document.getElementById('dateVisit').value;
    const todayOnly = new Date().toISOString().split('T')[0];
    if (selectedDate) {
      if (selectedDate === todayOnly) {
        const today = new Date();
        const selectedDateOnly = new Date(
          `${selectedDate}T${String(hour).padStart(2, '0')}:${String(
            minute
          ).padStart(2, '0')}:00`
        );
        if (selectedDateOnly < today) {
          showModalAlert(
            'Alert',
            'Horário Inválido!',
            'Horário selecionado já passou para o dia de hoje.',
            closeModal
          );
          return false;
        }
      }
    }
    return true;
  }

  document
    .getElementById('dateVisit')
    .setAttribute('min', new Date().toISOString().split('T')[0]);

  document.getElementById('dateVisit').addEventListener('input', function () {
    isSchedulingDateValid(this.value);
  });

  document.getElementById('timeVisit').addEventListener('input', function () {
    const time = this.value;
    if (!isSchedulingTimeValid(time)) {
      this.value = '';
    }
  });

  visitDate.addEventListener('input', checked);
  visitTime.addEventListener('input', checked);
  const sendBtn = document.getElementById('sendOrder');
  function checked() {
    const isVisitFilled = visitDate.value && visitTime.value;
    if (isVisitFilled) {
      sendBtn.classList.remove('hidden');
      sendBtn.classList.add('modal-content-btn-ok');
    } else {
      sendBtn.classList.remove('modal-content-btn-ok');
      sendBtn.classList.add('hidden');
    }
  }
  const isBudget =
    request.budgetId && Object.keys(request.budgetId._id).length > 0;
  const budget = isBudget ? request.budgetId._id : '';
  const isEnvironment =
    request.environmentId && Object.keys(request.environmentId._id).length > 0;
  const environment = isEnvironment ? request.environmentId._id : '';
  const requestId = request._id;
  const orderStatus = 'Programado';
  const services = servicesItem;
  const serviceIds = services.map((service) => service._id);
  const dataOrderSend = {
    requestId: requestId,
    orderStatus: orderStatus,
    serviceIds: serviceIds,
  };

  sendBtn.onclick = async () => {
    const technician = document.getElementById('selectTechnician');
    if (technician.value === '') {
      return showModalAlert(
        'Alert',
        'Técnico',
        'Selecione um Técnico para o Serviço.',
        closeModal
      );
    }
    if (!visitDate.value || !visitTime.value) {
      return showModalAlert(
        'Alert',
        'Campos obrigatórios',
        'Preencha a data e o horário do Serviço.',
        closeModal
      );
    }
    if (budget !== '') {
      dataOrderSend.budgetId = budget;
    }
    if (environment !== '') {
      dataOrderSend.environmentId = environment;
    }
    dataOrderSend.officerId = technician.value;
    dataOrderSend.date = visitDate.value;
    dataOrderSend.time = visitTime.value;

    try {
      const orderRegister = await registerOrder(dataOrderSend);
      if (orderRegister.status === 401) {
        showModalAlert(
          'Next',
          orderRegister.title,
          orderRegister.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (orderRegister.status === 403) {
        window.location.reload();
      } else if (
        orderRegister.status === 400 ||
        orderRegister.status === 409 ||
        orderRegister.status === 500
      ) {
        showModalAlert(
          'Alert',
          orderRegister.title,
          orderRegister.msg,
          closeModal
        );
        return;
      } else if (orderRegister.status === 201) {
        const level = orderRegister.level;
        await openSession(level);
        showModalAlert(
          'Next',
          orderRegister.title,
          orderRegister.msg,
          async () => {
            await listRequestModal();
            closeModalDetails();
          }
        );
      }
    } catch (error) {
      console.error('Erro ao gerar Orçamento:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  };
}

async function showModalNewBudget(request) {
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

  const isInstallation = request.requestType === 'Instalação';

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  const reqType = request.requestType;
  let typeService;
  const isServiceIds =
    request.serviceIds && Object.keys(request.serviceIds).length > 0;

  const isMaintenanceProblem =
    request.maintenanceProblem &&
    Object.keys(request.maintenanceProblem).length > 0;

  const isEquipmentInstallation =
    request.installationEquipment &&
    Object.keys(request.installationEquipment).length > 0;

  const servicesTableRows = generateServiceTableRows(request.serviceIds);
  function generateServiceTableRows(services) {
    let rows = '';
    services.forEach((service) => {
      rows += ` ${service.serviceName}, `;
    });
    const tableServices = `
       <tr>
         <td>Serviços</td>
         <td>${rows}</td>
       </tr>
     `;
    return tableServices;
  }

  if (reqType === 'Manutenção') {
    if (isServiceIds) {
      typeService = servicesTableRows;
    } else if (isMaintenanceProblem) {
      typeService = `
         <tr>
           <td>Problemas relatados:</td>
           <td>${request.maintenanceProblem}</td>
         </tr>
       `;
    } else {
      typeService = '';
    }
  } else if (reqType === 'Instalação') {
    if (isEquipmentInstallation && isServiceIds) {
      typeService = `
         <tr>
           <td>Equipamento:</td>
           <td>${request.installationEquipment}</td>
         </tr>
         ${servicesTableRows}
       `;
    } else if (isEquipmentInstallation && !isServiceIds) {
      typeService = `
         <tr>
           <td>Equipamento:</td>
           <td>${request.installationEquipment}</td>
         </tr>
       `;
    } else {
      typeService = '';
    }
  } else {
    typeService = '';
  }

  title.textContent = 'Orçamento';
  content.innerHTML = `
    <div class="form-center">
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2">Requisição Nº: ${request.requestNumber}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tipo de Serviço:</td>
            <td>${request.requestType}</td>
          </tr>
          ${typeService}
        </tbody>
      </table>

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

      <div class="form-center">
        <div class="data-items">
          <label class="label">
            Total Serviços (R$): <span class="span" id="servicePrice">R$ 0,00</span>
          </label>
        </div>
      </div>

      <div id="equipmentSection" class="hidden">
        <div class="form-center">
          <label class="label">Incluir Equipamento ao Orçamento?</label>
          <div class="data-items">
            <label class="label">
              <input type="radio" class="radio" name="insert-equipment" value="Sim">
              <span class="span">Sim</span>
            </label>
            <label class="label">
              <input type="radio" class="radio" name="insert-equipment" value="Não">
              <span class="span">Não</span>
            </label>
          </div>
        </div>
        <div id="insertValueEquipment" class="hidden">
          <div class="form-group">
            <input class="form-group-input" type="text" id="equipment" placeholder="">
            <label class="form-group-label" for="">Equipamento para Instalação:</label>
          </div>
          <div class="form-group">
            <input class="form-group-input" type="text" id="equipmentPrice" value="R$ 0,00" placeholder="">
            <label class="form-group-label" for="">Valor do Equipamento (R$):</label>
          </div>
        </div>
      </div>

      <label class="label">Aplicar desconto ao Orçamento?</label>

      <div class="form-content">
        <div class="form-group">
          <input class="form-group-input" type="text" id="rebate" value="R$ 0,00" placeholder="">
          <label class="form-group-label" for="">Valor do desconto (R$):</label>
        </div>
        <div class="data-items">
          <label class="label" style="background-color: var(--color-2); color: var(--color-1); width: 100%; text-align: center; padding: 0.5em 1em;">
            Resumo Total
          </label>
          <label class="label" style="background-color: var(--color-2); color: var(--color-1); width: 100%; padding: 0.5em 1em;">
            Serviços: <span class="span" style:"color: var(--color-1);" id="totalServicesBudget"></span>
          </label>
          <label class="label" style="background-color: var(--color-2); color: var(--color-1); width: 100%; padding: 0.5em 1em;">
            Equipamentos: <span class="span" style:"color: var(--color-1);" id="totalEquipmentBudget"></span>
          </label>
          <label class="label" style="background-color: var(--color-2); color: var(--color-1); width: 100%; padding: 0.5em 1em;">
            Desconto: <span class="span" style:"color: var(--color-1);" id="rebateBudget"></span>
          </label>
          <label class="label" style="background-color: var(--color-2); color: var(--color-1); width: 100%; padding: 0.5em 1em;">
            Orçamento Total: <span class="span" style:"color: var(--color-1);" id="totalBudget"></span>
          </label>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="sendBudget" class="modal-content-btn-ok">Enviar</button>
    </div>
  `;

  btnReturn.onclick = async function () {
    await requestDetails(request);
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  function toggleTypeService() {
    const typeService = document.querySelectorAll('input[name="service-type"]');
    const equipmentDiv = document.getElementById('equipmentSection');
    typeService.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.value === 'Instalação' && input.checked) {
          equipmentDiv.classList.remove('hidden');
          equipmentDiv.classList.add('form-center');
        } else if (input.value === 'Manutenção' && input.checked) {
          equipmentDiv.classList.remove('form-center');
          equipmentDiv.classList.add('hidden');
        }
      });
    });
  }

  toggleTypeService();

  function toggleInputValueEquipment() {
    const radioInsertEquipment = document.querySelectorAll(
      'input[name="insert-equipment"]'
    );
    const equipmentValueDiv = document.getElementById('insertValueEquipment');
    radioInsertEquipment.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.value === 'Sim' && input.checked) {
          equipmentValueDiv.classList.remove('hidden');
          equipmentValueDiv.classList.add('form-center');
        } else if (input.value === 'Não' && input.checked) {
          equipmentValueDiv.classList.remove('form-center');
          equipmentValueDiv.classList.add('hidden');
          clearEquipment();
        }
      });
    });
  }

  toggleInputValueEquipment();

  function clearEquipment() {
    document.getElementById('equipmentPrice').value = 'R$ 0,00';
    document.getElementById('equipment').value = '';
    updateTotal();
  }

  function parseCurrency(value) {
    return parseFloat(value.replace('R$', '').replace(',', '.').trim()) || 0;
  }

  function updateTotal() {
    const serviceCheckboxes = document.querySelectorAll(
      '.service-checkbox:checked'
    );

    let serviceTotal = 0;

    let equipmentTotal = parseCurrency(
      document.getElementById('equipmentPrice').value
    );
    let rebateBudgetTotal = parseCurrency(
      document.getElementById('rebate').value
    );

    serviceCheckboxes.forEach((checkbox) => {
      serviceTotal += parseFloat(checkbox.value);
    });

    document.getElementById('servicePrice').textContent = `R$ ${serviceTotal
      .toFixed(2)
      .replace('.', ',')}`;
    document.getElementById(
      'totalServicesBudget'
    ).textContent = `R$ ${serviceTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById(
      'totalEquipmentBudget'
    ).textContent = `R$ ${equipmentTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById(
      'rebateBudget'
    ).textContent = `R$ ${rebateBudgetTotal.toFixed(2).replace('.', ',')}`;

    let total = serviceTotal + equipmentTotal;

    if (rebateBudgetTotal >= total) {
      rebateBudgetTotal = 0;
      document.getElementById('rebate').value = 'R$ 0,00';
      showModalAlert(
        'Alert',
        'Descontos!',
        'O desconto não pode ser igual ou maior que o valor total!',
        closeModal
      );
      return;
    } else {
      total -= rebateBudgetTotal;
    }

    document.getElementById('totalBudget').textContent = `R$ ${total
      .toFixed(2)
      .replace('.', ',')}`;
  }

  document
    .getElementById('equipmentPrice')
    .addEventListener('input', formatAndUpdate);
  document
    .getElementById('equipmentPrice')
    .addEventListener('blur', updateTotal);

  document.getElementById('rebate').addEventListener('input', formatAndUpdate);
  document.getElementById('rebate').addEventListener('blur', updateTotal);

  function formatAndUpdate(event) {
    let priceValue = event.target.value.replace(/[^0-9]/g, '');
    if (!priceValue) priceValue = '0';
    priceValue = (parseInt(priceValue) / 100).toFixed(2);
    event.target.value = `R$ ${priceValue.replace('.', ',')}`;
    updateTotal();
  }

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
        <input type="checkbox" class="service-checkbox checkbox" value="${
          service.servicePrice
        }" data-serviceId="${service._id}">
        <span class="span" style="color: var(--color-2);">${
          service.serviceName
        }</span> |
        <span class="span" style="color: var(--color-2);">${service.servicePrice.toLocaleString(
          'pt-BR',
          { style: 'currency', currency: 'BRL' }
        )}</span>
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
        updateTotal();
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

    document.getElementById('totalService').value = 'R$ 0,00';
    document.getElementById('rebate').value = 'R$ 0,00';

    updateTotal();
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

  document
    .getElementById('sendBudget')
    .addEventListener('click', async (event) => {
      const serviceType = document.querySelector(
        'input[name="service-type"]:checked'
      );
      const inputEquipment = document.querySelector(
        'input[name="insert-equipment"]'
      );
      const InputValueEquipment = parseFloat(
        document
          .getElementById('equipmentPrice')
          .value.replace('R$', '')
          .replace(',', '.')
      );
      const InputNameEquipment = document
        .getElementById('equipment')
        .value.trim();
      const dataBudget = {
        requestId: request._id,
      };

      if (!serviceType) {
        showModalAlert(
          'Alert',
          'Tipo de Serviço',
          'Selecione um tipo de serviço',
          closeModal
        );
        return;
      }
      dataBudget.serviceType = serviceType.value;
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
      dataBudget.serviceIds = selectedServiceIds;
      if (inputEquipment.checked && inputEquipment.value === 'Sim') {
        if (InputNameEquipment === '') {
          showModalAlert(
            'Alert',
            'Nome do Equipamento!',
            'Insira um nome, marca e tipo para o equipamento de instalação.',
            closeModal
          );
          return;
        }
        if (InputValueEquipment <= 0) {
          showModalAlert(
            'Alert',
            'Valor do Equipamento!',
            'Insira um valor para o equipamento de instalação.',
            closeModal
          );
          return;
        }
        const equipmentPrice = parseFloat(
          document
            .getElementById('totalEquipmentBudget')
            .textContent.replace('R$', '')
            .replace(',', '.')
        );
        dataBudget.equipment = InputNameEquipment;
        dataBudget.equipmentPrice = equipmentPrice;
      }

      const servicePrice = parseFloat(
        document
          .getElementById('totalServicesBudget')
          .textContent.replace('R$', '')
          .replace(',', '.')
      );
      dataBudget.servicePrice = servicePrice;
      const totalPrice = parseFloat(
        document
          .getElementById('totalBudget')
          .textContent.replace('R$', '')
          .replace(',', '.')
      );

      if (totalPrice < 0) {
        showModalAlert(
          'Alert',
          'Valor do Orçamento!',
          'O valor total com desconto não pode ser negativo.',
          closeModal
        );
        return;
      }

      const rebate =
        parseFloat(
          document
            .getElementById('rebateBudget')
            .textContent.replace(/[^\d,]/g, '')
            .replace(',', '.')
        ) || 0;
      dataBudget.budgetRebate = rebate;
      dataBudget.budgetPrice = totalPrice;
      dataBudget.budgetStatus = 'Pendente';

      try {
        const budgetRegister = await registerBudget(dataBudget);
        if (budgetRegister.status === 401) {
          showModalAlert(
            'Next',
            budgetRegister.title,
            budgetRegister.msg,
            async () => {
              await exitSession();
            }
          );
        } else if (budgetRegister.status === 403) {
          window.location.reload();
        } else if (
          budgetRegister.status === 400 ||
          budgetRegister.status === 409 ||
          budgetRegister.status === 500
        ) {
          showModalAlert(
            'Alert',
            budgetRegister.title,
            budgetRegister.msg,
            closeModal
          );
          return;
        } else if (budgetRegister.status === 201) {
          const level = budgetRegister.level;
          await openSession(level);
          showModalAlert(
            'Next',
            budgetRegister.title,
            budgetRegister.msg,
            async () => {
              await listRequestModal();
              closeModalDetails();
            }
          );
        }
      } catch (error) {
        console.error('Erro ao gerar Orçamento:', error);
        showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
        return;
      }
    });
}

async function openBudgetClient(request) {
  let budget = request.budgetId;

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  const isEquipment =
    budget.equipment && Object.keys(budget.equipment).length > 0;
  const equipment =
    isEquipment && budget.equipment.length > 0
      ? `
          <thead>
            <tr>
              <th colspan="2" style="text-align: center;">
                Equipamento para instalação
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="2">${budget.equipment}</td>
            </tr>
            <tr>
              <td>Valor do Equipamento:</td>
              <td style="text-align: center;">R$ ${budget.equipmentPrice
                .toFixed(2)
                .replace('.', ',')}</td>
            </tr>
          </tbody>
        `
      : '';
  const equipmentBudget =
    isEquipment && budget.equipment.length > 0
      ? `<tr>
          <td>Equipamento (+)</td>
          <td style="text-align: center;">R$ ${budget.equipmentPrice
            .toFixed(2)
            .replace('.', ',')}</td>
        </tr>`
      : '';
  const servicesTableRows = generateServiceTableRows(budget.serviceIds);
  function generateServiceTableRows(services) {
    let rows = '';
    services.forEach((service) => {
      rows += `
          <tr>
            <td>${service.serviceName}</td>
            <td style="text-align: center;">R$ ${service.servicePrice
              .toFixed(2)
              .replace('.', ',')}</td>
          </tr>
        `;
    });
    return rows;
  }
  title.textContent = 'Aprovação de Orçamento';

  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Número do Orçamento: ${budget.budgetNumber}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tipo de Serviço:</td>
          <td>${budget.serviceType}</td>
        </tr>
      </tbody>
      ${equipment}
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Serviços
          </th>
        </tr>
      </thead>
      <tbody>
        ${servicesTableRows}
      </tbody>
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Orçamento (R$)
          </th>
        </tr>
        <tbody>
          ${equipmentBudget}
          <tr>
            <td>Serviços (+)</td>
            <td style="text-align: center;">R$ ${budget.servicePrice
              .toFixed(2)
              .replace('.', ',')}</td>
          </tr>
          <tr>
            <td>Descontos (-)</td>
            <td style="text-align: center;">R$ ${budget.budgetRebate
              .toFixed(2)
              .replace('.', ',')}</td>
          </tr>
          <tr>
            <td>Total Orçamento (=)</td>
            <td style="text-align: center;">R$ ${budget.budgetPrice
              .toFixed(2)
              .replace('.', ',')}</td>
          </tr>
        </tbody>
      </thead>
    </table>

    <div class="data-items">
      <label class="label">
        <input type="radio" class="radio" name="validateBudget" value="Aprovado">
        <span class="span">Aprovar</span>
      </label>
      <label class="label">
        <input type="radio" class="radio" name="validateBudget" value="Reprovado">
        <span class="span">Reprovar</span>
      </label>
    </div>
  `;
  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="sendBudgetBtn" class="hidden"></button>
    </div>
  `;
  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await requestDetails(request);
  };
  btnClose.onclick = async function () {
    closeModalDetails();
  };

  function toggleBtn() {
    const radioValidate = document.querySelectorAll(
      'input[name="validateBudget"]'
    );
    const sendBtn = document.getElementById('sendBudgetBtn');
    radioValidate.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.value === 'Aprovado' && input.checked) {
          sendBtn.classList.remove('hidden');
          sendBtn.classList.add('modal-content-btn-ok');
          sendBtn.textContent = 'Aprovar';
        } else if (input.value === 'Reprovado' && input.checked) {
          sendBtn.classList.remove('hidden');
          sendBtn.classList.add('modal-content-btn-cancel');
          sendBtn.textContent = 'Reprovar';
        }
      });
    });
  }
  toggleBtn();

  document
    .getElementById('sendBudgetBtn')
    .addEventListener('click', async () => {
      const budgetValue = document.querySelector(
        'input[name="validateBudget"]:checked'
      );
      const sendData = {};
      if (budgetValue.value === 'Aprovado') {
        sendData.budgetStatus = 'Aprovado';
        sendData.feedback = `Orçamento Aprovado pela GTA em ${normalizeDate(
          new Date()
        )}`;
      } else if (budgetValue.value === 'Reprovado') {
        sendData.budgetStatus = 'Reprovado';
        sendData.feedback = `Orçamento Reprovado pela GTA em ${normalizeDate(
          new Date()
        )}`;
      } else {
        showModalAlert(
          'Alert',
          'Validação de Orçamento',
          'Por favor, valide o Orçamento para enviar',
          closeModal
        );
        return;
      }

      try {
        const budgetData = await updateBudget(sendData, budget._id);
        if (budgetData.status === 401) {
          showModalAlert('Next', budgetData.title, budgetData.msg, async () => {
            await exitSession();
          });
        } else if (
          budgetData.status === 400 ||
          budgetData.status === 409 ||
          budgetData.status === 500
        ) {
          showModalAlert('Alert', budgetData.title, budgetData.msg, closeModal);
        } else if (budgetData.status === 200) {
          const level = budgetData.level;
          showModalAlert('Next', budgetData.title, budgetData.msg, async () => {
            await openSession(level);
            await listAllRequest();
            closeModalDetails();
          });
        }
      } catch (error) {
        showModalAlert('Alert', 'Erro de Conexão', error.message, closeModal);
      }
    });
}

async function showModalNewSchedule(request) {
  let officers = [];
  try {
    const listOfficers = await listAllOfficers();
    if (listOfficers.status === 401) {
      showModalAlert('Next', listOfficers.title, listOfficers.msg, async () => {
        await exitSession();
      });
    } else if (listOfficers.status === 403) {
      showModalAlert('Alert', listOfficers.title, listOfficers.msg, closeModal);
      return;
    } else if (listOfficers.status === 400) {
      showModalAlert('Next', listOfficers.title, listOfficers.msg, async () => {
        await requestDetails(request);
        closeModalDetails();
      });
    } else if (listOfficers.status === 200) {
      const level = listOfficers.level;
      await openSession(level);
      officers = [...listOfficers.listOfficer];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  const technician = officers.filter((tec) => tec.officerType === 'Técnico');

  if (technician.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Técnico Cadastrado!',
      'Cadastre Colaborador Nível Técnico para atribuir a uma Ordem de Serviço.',
      async () => {
        await requestDetails(request);
        closeModalDetails();
      }
    );
  }

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Visita Técnica';
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
      </table>

      <label class="label">Técnico para o Serviço:</label>
      <select class="select" id="selectTechnician">
        <option value="">Técnicos</option>
        ${technician
          .map(
            (tec) => `<option value="${tec._id}">${tec.userId.name}</option>`
          )
          .join('')}
      </select>

      <div class="form-content">
        <label class="label">Agendar Serviço para:</label>
        <div class="form-group">
          <input class="form-group-input" type="date" id="dateVisit" placeholder="">
          <label class="form-group-label" for="">Data:</label>
        </div>
        <div class="form-group">
          <input class="form-group-input" type="time" id="timeVisit" min="08:00" max="18:00" placeholder="">
          <label class="form-group-label" for="">Horário:</label>
        </div>
      </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="sendOrder" class="hidden">Enviar</button>
    </div>
  `;

  btnReturn.onclick = async function () {
    await requestDetails(request);
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  let visitDate = document.getElementById('dateVisit');
  let visitTime = document.getElementById('timeVisit');

  function isSchedulingDateValid(date) {
    const selectedDate = new Date(date);
    const today = new Date();
    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate() + 1,
      selectedDate.getHours() + 3,
      selectedDate.getMinutes(),
      selectedDate.getSeconds(),
      selectedDate.getMilliseconds() - 1
    );

    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds(),
      today.getMilliseconds()
    );

    const day = selectedDateOnly.getDay();
    if (day === 0 || day === 6) {
      showModalAlert(
        'Alert',
        'Data Inválida!',
        'Marque um dia de segunda a sexta.',
        closeModal
      );
      document.getElementById('dateVisit').value = '';
      return false;
    }

    if (selectedDateOnly < todayOnly) {
      showModalAlert(
        'Alert',
        'Data Inválida!',
        'Não é possível agendar para dias e horários passados.',
        closeModal
      );
      document.getElementById('dateVisit').value = '';
      return false;
    }
    return true;
  }

  function isSchedulingTimeValid(time) {
    const [hour, minute] = time.split(':').map(Number);
    if (hour < 8 || (hour === 18 && minute > 0) || hour > 18) {
      showModalAlert(
        'Alert',
        'Horário Inválido!',
        'Insira um horário de 08:00 às 18:00',
        closeModal
      );
      return false;
    }

    const selectedDate = document.getElementById('dateVisit').value;
    const todayOnly = new Date().toISOString().split('T')[0];
    if (selectedDate) {
      if (selectedDate === todayOnly) {
        const today = new Date();
        const selectedDateOnly = new Date(
          `${selectedDate}T${String(hour).padStart(2, '0')}:${String(
            minute
          ).padStart(2, '0')}:00`
        );
        if (selectedDateOnly < today) {
          showModalAlert(
            'Alert',
            'Horário Inválido!',
            'Horário selecionado já passou para o dia de hoje.',
            closeModal
          );
          return false;
        }
      }
    }
    return true;
  }

  document
    .getElementById('dateVisit')
    .setAttribute('min', new Date().toISOString().split('T')[0]);

  document.getElementById('dateVisit').addEventListener('input', function () {
    isSchedulingDateValid(this.value);
  });

  document.getElementById('timeVisit').addEventListener('input', function () {
    const time = this.value;
    if (!isSchedulingTimeValid(time)) {
      this.value = '';
    }
  });

  visitDate.addEventListener('input', checked);
  visitTime.addEventListener('input', checked);
  const sendBtn = document.getElementById('sendOrder');
  function checked() {
    const isVisitFilled = visitDate.value && visitTime.value;
    if (isVisitFilled) {
      sendBtn.classList.remove('hidden');
      sendBtn.classList.add('modal-content-btn-ok');
    } else {
      sendBtn.classList.remove('modal-content-btn-ok');
      sendBtn.classList.add('hidden');
    }
  }

  sendBtn.onclick = async () => {
    const technician = document.getElementById('selectTechnician');
    if (technician.value === '') {
      return showModalAlert(
        'Alert',
        'Técnico',
        'Selecione um Técnico para o Serviço.',
        closeModal
      );
    }
    if (!visitDate.value || !visitTime.value) {
      return showModalAlert(
        'Alert',
        'Campos obrigatórios',
        'Preencha a data e o horário do Serviço.',
        closeModal
      );
    }

    const dataRequestSendUpdate = {
      requestStatus: 'Visita Técnica Programada',
      officerId: technician.value,
      dateVisit: visitDate.value,
      timeVisit: visitTime.value,
    };

    await sendUpdateRequest(dataRequestSendUpdate, request._id);
  };
}
