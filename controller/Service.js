import {
  closeModal,
  closeModalDetails,
  closeModalRegister,
  exitSession,
  openSession,
  showModalAlert,
} from '../js/modals.js';
import { listAllService, createService } from '../js/services.js';

document.addEventListener('DOMContentLoaded', async function () {
  document
    .getElementById('listServiceMobile')
    .addEventListener('click', showModalServiceList);
  document
    .getElementById('listServiceDesktop')
    .addEventListener('click', showModalServiceList);
});

async function showModalServiceList() {
  let services;

  try {
    const listServiceData = await listAllService();
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
      showModalAlert(
        'Next',
        listServiceData.title,
        listServiceData.msg,
        async () => {
          await showModalNewService();
          closeModalRegister();
        }
      );
    } else if (listServiceData.status === 200) {
      const level = listServiceData.level;
      await openSession(level);
      services = [...listServiceData.listService];
    }
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  let filteredServices = services;

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Serviços GTA';
  content.innerHTML = `
      <div class="form-center"
        <label class="label">Tipo de Serviço:</label>
        <select id="filter-service-type" class="select">
          <option value="">Selecione o Tipo</option>
          <option value="Instalação">Instalação</option>
          <option value="Manutenção">Manutenção</option>
        </select>
      </div>

      <table class="details-table">
        <thead>
          <tr>
            <th>Tipo de Serviço</th>
            <th>Nome</th>
          </tr>
        </thead>
        <tbody id="service-list">
          ${renderServiceRows(filteredServices)}
        </tbody>
      </table>
    `;

  footer.innerHTML = `
      <div class="modal-user-footer">
        <button type="button" id="newService" class="modal-content-btn-enable">+Serviços</button>
      </div>
    `;

  modal.style.display = 'block';

  btnClose.onclick = () => closeModalRegister();

  const serviceTypeFilter = document.getElementById('filter-service-type');

  serviceTypeFilter.addEventListener('change', filterServices);

  function filterServices() {
    const selectedType = document.getElementById('filter-service-type').value;

    const filteredServices = services.filter(
      (service) => !selectedType || service.serviceType === selectedType
    );

    document.getElementById('service-list').innerHTML =
      renderServiceRows(filteredServices);
  }

  document
    .getElementById('newService')
    .addEventListener('click', showModalNewService);
}

function renderServiceRows(services) {
  return services
    .map(
      (service) => `
          <tr>
            <td>
              <div class="center">
                ${service.serviceType}
              </div>
            </td>
            <td>
              <div class="center">
                ${service.serviceName}
                <i class="client-service-btn
                  bi bi-tools endBtn" 
                  data-service='${JSON.stringify(service)}'>
                </i>
              </div>
            </td>
          </tr>
        `
    )
    .join('');
}

document.addEventListener('click', async function (event) {
  if (event.target.classList.contains('client-service-btn')) {
    const service = JSON.parse(event.target.dataset.service);
    await openServiceDetails(service);
    closeModalRegister();
  }
});

async function openServiceDetails(service) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Detalhes do Serviço';
  content.innerHTML = `
      <table class="details-table">
        <thead>
          <tr>
            <th colspan="2">
              Nome do Serviço: ${service.serviceName}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tipo do Serviço:</td>
            <td>${service.serviceType}</td>
          </tr>
          <tr>
            <td>Descrição:</td>
            <td> ${service.serviceDescription}</td>
          </tr>
          <tr>
            <td>Valor do Serviço:</td>
            <td>R$ ${service.servicePrice.toFixed(2).replace('.', ',')}</td>
          </tr>
        </tbody>
      </table>
    `;

  footer.innerHTML = `
      <div class="modal-user-footer">
        <button type="button" id="editBtn" class="modal-content-btn-edit">Editar</button>
        <button type="button" id="deleteBtn" class="modal-content-btn-cancel">Excluir</button>
      </div>
    `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await showModalServiceList();
    closeModalDetails();
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };
  /*
    const editService = document.getElementById('editBtn');
    editService.onclick = async function () {
      await showModalEditService(service);
      closeModalDetails();
    };

    const deleteService = document.getElementById('deleteBtn');
    deleteService.onclick = async function () {
      await showModalDeleteService(service);
      closeModalDetails();
    };
*/
}

export async function showModalNewService() {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Cadastrar Serviço';
  content.innerHTML = `
      <div class="form-content">
        <div class="form-center">
          <label class="label">Tipo de Serviço</label>
          <div class="radio-container">
            <label class="label">
              <input type="radio" class="radio" name="service-type" value="Instalação">
              <span class="span">Instalação</span>
            </label>
            <label class="label">
              <input type="radio" class="radio" name="service-type" value="Manutenção">
              <span class="span">Manutenção</span>
            </label>
          </div>
        </div>

        <div class="form-group">
          <input class="form-group-input" type="text" id="nameService" required maxlength="20">
          <label class="form-group-label" for="">Nome do Serviço:</label>
          <i class="bi bi-phone toggle-icon-input"></i>
        </div>

        <div class="form-group">
          <input class="form-group-input" type="text" id="descriptionService" required maxlength="255">
          <label class="form-group-label" for="">Descrição do Serviço:</label>
          <i class="bi bi-phone toggle-icon-input"></i>
        </div>

        <div class="form-group">
          <input class="form-group-input" type="text" id="price" required value="R$ 0,00">
          <label class="form-group-label" for="">Valor (R$):</label>
          <i class="bi bi-phone toggle-icon-input"></i>
        </div>
      </div>
    `;

  footer.innerHTML = `
      <div class="modal-user-footer">
        <button type="button" id="saveService" class="modal-content-btn-ok">Cadastrar</button>
      </div>
    `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await showModalServiceList();
    closeModalDetails();
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  const price = document.getElementById('price');
  price.addEventListener('input', () => {
    let priceValue = price.value.replace(/[^0-9]/g, '');
    if (!priceValue) priceValue = '0';
    priceValue = (parseInt(priceValue) / 100).toFixed(2);
    price.value = `R$ ${priceValue.replace('.', ',')}`;
  });

  document.getElementById('saveService').addEventListener('click', async () => {
    const type = document.querySelector('input[name="service-type"]:checked');
    const name = document.getElementById('nameService').value.trim();
    const description = document
      .getElementById('descriptionService')
      .value.trim();
    const priceValue = price.value.replace('R$ ', '').replace(',', '.');

    if (!type) {
      showModalAlert(
        'Alert',
        'Tipo de Serviço',
        'Marque o tipo de serviço.',
        closeModal
      );
      return;
    }
    if (!name) {
      showModalAlert(
        'Alert',
        'Nome do Serviço',
        'Escreva um nome para o serviço.',
        closeModal
      );
      return;
    }
    if (!description) {
      showModalAlert(
        'Alert',
        'Descrição do Serviço',
        'Escreva a atividade a ser realizada.',
        closeModal
      );
      return;
    }
    if (parseFloat(priceValue) <= 0) {
      showModalAlert(
        'Alert',
        'Valor do Serviço',
        'Digite um valor para o serviço.',
        closeModal
      );
      return;
    }

    const service = {
      serviceType: type.value,
      serviceName: name,
      serviceDescription: description,
      servicePrice: parseFloat(priceValue),
    };

    try {
      const serviceRegister = await createService(service);
      if (serviceRegister.status === 401) {
        showModalAlert(
          'Next',
          serviceRegister.title,
          serviceRegister.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (serviceRegister.status === 403) {
        window.location.reload();
      } else if (
        serviceRegister.status === 400 ||
        serviceRegister.status === 409 ||
        serviceRegister.status === 500
      ) {
        showModalAlert(
          'Alert',
          serviceRegister.title,
          serviceRegister.msg,
          closeModal
        );
        return;
      } else if (serviceRegister.status === 201) {
        const level = serviceRegister.level;
        await openSession(level);
        showModalAlert(
          'Next',
          serviceRegister.title,
          serviceRegister.msg,
          async () => {
            await showModalServiceList();
            closeModalDetails();
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados de serviços:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  });
}
