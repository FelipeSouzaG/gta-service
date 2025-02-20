import {
  registerOfficer,
  listAllUsers,
  listAllOfficers,
  getAddressOfficerId,
} from '../js/services.js';
import {
  formatPhoneValue,
  formatRegister,
  formatName,
  validateName,
  validateRegister,
  validatePhone,
  setupValidation,
  formatPostalCode,
} from '../js/validation.js';
import { newAddress } from './Address.js';
import {
  showModalAlert,
  closeModal,
  closeModalRegister,
  closeModalDetails,
  exitSession,
  openSession,
} from '../js/modals.js';

document.addEventListener('DOMContentLoaded', async function () {
  document
    .getElementById('listOfficerMobile')
    .addEventListener('click', async () => {
      await listOfficerModal();
    });
  document
    .getElementById('listOfficerDesktop')
    .addEventListener('click', async () => {
      await listOfficerModal();
    });
});

async function listOfficerModal() {
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
      officers = [];
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

  if (officers.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Colaborador Cadastrado!',
      'Por favor, faça cadastros de colaboradores para listar.',
      async () => {
        await newOfficer();
        closeModalRegister();
      }
    );
  }

  let filteredOfficers = officers;

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Lista de Colaboradores';
  content.innerHTML = `
    <div class="form-center-item">
      <select class="select" id="filter-officer-type">
        <option value="">Tipo de Colaborador: Todos</option>
        <option value="Técnico">Técnico</option>
        <option value="Secretário">Secretário</option>
        <option value="Gestor">Gestor</option>
      </select>
    </div>

    <table class="details-table">
      <thead>
        <tr>
          <th>Registro - Nome</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody id="officer-list">
        ${renderOfficerRows(filteredOfficers)}
      </tbody>
    </table>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="newOfficer" class="modal-content-btn-enable">Novo</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = () => closeModalRegister();

  const officerTypeFilter = document.getElementById('filter-officer-type');

  officerTypeFilter.addEventListener('change', filterOfficers);

  function filterOfficers() {
    const selectedTypes = document.getElementById('filter-officer-type').value;

    const filteredOfficers = officers.filter(
      (officer) => !selectedTypes || officer.officerType === selectedTypes
    );

    document.getElementById('officer-list').innerHTML =
      renderOfficerRows(filteredOfficers);
  }

  const newOfficerBtn = document.getElementById('newOfficer');
  newOfficerBtn.addEventListener('click', newOfficer);
}

function renderOfficerRows(officers) {
  return officers
    .map(
      (officer) => `
        <tr>
          <td>
          ${officer.officerNumber}-${officer.userId.name}
          </td>
          <td>
            <div class="center">
              ${officer.officerType}
              <i class="view-officer-details-btn
                bi bi-person-lines-fill endBtn"
                data-officer='${JSON.stringify(officer)}'>
              </i>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-officer-details-btn')) {
    const officer = JSON.parse(event.target.dataset.officer);
    await openOfficerDetails(officer);
    closeModalRegister();
  }
});

export async function openOfficerDetails(officer) {
  let address;
  try {
    const addressOfficer = await getAddressOfficerId(officer._id);
    if (addressOfficer.status === 401) {
      showModalAlert(
        'Next',
        addressOfficer.title,
        addressOfficer.msg,
        async () => {
          await exitSession();
        }
      );
    } else if (addressOfficer.status === 403) {
      showModalAlert(
        'Alert',
        addressOfficer.title,
        addressOfficer.msg,
        closeModal
      );
      return;
    } else if (addressOfficer.status === 400) {
      address = '';
    } else if (addressOfficer.status === 200) {
      const level = addressOfficer.level;
      await openSession(level);
      const addresses = addressOfficer.addresses;
      address = addresses[0];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Dados do Colaborador';

  const isRegister =
    officer.register && Object.keys(officer.register).length > 0;
  const isCpf =
    isRegister && officer.register.length === 11
      ? `
          <tr>
            <td>CPF:</td>
            <td>${formatRegister(officer.register)}</td>
          </tr>
        `
      : '';
  const isCnpj =
    isRegister && officer.register.length === 14
      ? `
        <tr>
          <td>CNPJ:</td>
          <td>${formatRegister(officer.register)}</td>
        </tr>
      `
      : '';
  const addressOfficer =
    address && Object.keys(address).length > 0
      ? `<table class="details-table">
        <thead>
          <tr>
            <th colspan="2" style="text-align: center;">
              Endereço
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="2">${address.street}</td>
          </tr>
          <tr>
            <td>Número:</td>
            <td>${address.number}</td>
          </tr>
          <tr>
            <td>Bairro:</td>
            <td>${address.district}</td>
          </tr>
          <tr>
            <td>Cidade:</td>
            <td>${address.city} / ${address.state}</td>
          </tr>
          <tr>
            <td>CEP:</td>
            <td>${formatPostalCode(address.postalCode)}</td>
          </tr>
        </tbody>
      </table>`
      : `<div class="button-client-table">
        <i class="officer-address-btn
          bi bi-geo-alt tabBtn"
          data-address='${JSON.stringify(officer)}'>
        </i>
      </div>`;
  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2">
            ${officer.userId.name}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Registro:</td>
          <td>${officer.officerNumber}</td>
        </tr>
        ${isCpf}
        ${isCnpj}
        <tr>
          <td>Telefone:</td>
          <td>${formatPhoneValue(officer.phone)}</td>
        </tr>
         <tr>
          <td>E-mail:</td>
          <td>${officer.userId.email}</td>
        </tr>
        <tr>
          <td>Função:</td>
          <td>
            ${officer.officerType}
          </td>
        </tr>
        <tr>
          <td>Nível:</td>
          <td>
            ${officer.officerLevel}
          </td>
        </tr>
      </tbody>
    </table>
    ${addressOfficer}
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="editBtn" class="modal-content-btn-edit">Editar</button>
      <button type="button" id="deleteBtn" class="modal-content-btn-cancel">Excluir</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await listOfficerModal();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}

document.addEventListener('click', async function (event) {
  if (event.target.classList.contains('officer-address-btn')) {
    const officer = JSON.parse(event.target.dataset.address);
    await newAddress(officer);
  }
});

export async function newOfficer() {
  let users = [];
  try {
    const listUsers = await listAllUsers();
    if (listUsers.status === 401) {
      showModalAlert('Next', listUsers.title, listUsers.msg, async () => {
        await exitSession();
      });
    } else if (listUsers.status === 403) {
      showModalAlert('Alert', listUsers.title, listUsers.msg, closeModal);
      return;
    } else if (listUsers.status === 400) {
      users = [];
    } else if (listUsers.status === 200) {
      const level = listUsers.level;
      await openSession(level);
      users = [...listUsers.userList];
    }
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  const filteredUsers = users.filter((user) => user.level === 'Usuário');
  listUserRegisted();
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Cadastro de Colaborador';

  content.innerHTML = `
    <div class="form-content">
      <div class="form-center">
        <select id="user-officer" class="select">
          <option value="">Usuário do Colaborador</option>
          ${filteredUsers
            .map(
              (user) =>
                `<option value="${user._id}" data-name="${user.name}" data-email="${user.email}">
                  ${user.name} - ${user.email}
                </option>`
            )
            .join('')}
        </select>
      </div>

      <div id="selectUser" class="hidden">
        <label class="label">Nome: <span id="nameUser" class="span"><span></label>
        <label class="label">E-mail: <span id="emailUser" class="span"><span></label>
      </div>

      <div id="divOfficerType" class="hidden">
        <label class="label">Marque o tipo de Colaborador</label>
        <div class="radio-container">
          <label class="label">
            <input type="radio" class="radio" name="officerType" value="Técnico">
            <span class="span">Técnico</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="officerType" value="Secretário">
            <span class="span">Secretário</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="officerType" value="Gestor">
            <span class="span">Gestor</span>
          </label>
        </div>
      </div>

      <div id="divOfficerLevel" class="hidden">
        <label class="label">Marque o nível do Colaborador</label>
        <div class="radio-container">
          <label class="label">
            <input type="radio" class="radio" name="officerLevel" value="Junior">
            <span class="span">Junior</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="officerLevel" value="Pleno">
            <span class="span">Pleno</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="officerLevel" value="Sênior">
            <span class="span">Sênior</span>
          </label>
        </div>
      </div>

      <div id="otherData" class="hidden">
        <div class="form-group">
          <input class="form-group-input" type="text" id="register" maxlength="18" placeholder="">
          <label class="form-group-label" for="">CPF / CNPJ:</label>
          <i class="bi bi-123 toggle-icon-input"></i>
        </div>
        <div class="form-group">
          <input class="form-group-input" type="text" id="phone" required>
          <label class="form-group-label" for="">Telefone:</label>
          <i class="bi bi-phone toggle-icon-input"></i>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="registerOfficerBtn" class="modal-content-btn-ok">Salvar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await listOfficerModal();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  function listUserRegisted() {
    if (filteredUsers.length < 1) {
      showModalAlert(
        'Next',
        'Não há usuários',
        'Peça ao Colaborador para se registrar no site.',
        () => {
          closeModalDetails();
        }
      );
    }
  }

  const selectElement = document.getElementById('user-officer');
  const nameSpan = document.getElementById('nameUser');
  const emailSpan = document.getElementById('emailUser');
  const divDataUser = document.getElementById('selectUser');
  const divOfficerType = document.getElementById('divOfficerType');
  const officerTypeRadio = document.querySelectorAll(
    'input[name="officerType"]'
  );
  const divOfficerLevel = document.getElementById('divOfficerLevel');
  const officerLevelRadio = document.querySelectorAll(
    'input[name="officerLevel"]'
  );
  const otherData = document.getElementById('otherData');

  function toggleSelect() {
    selectElement.addEventListener('change', () => {
      clearOfficerType();
      changeOfficerUser();
      const selectedValue = selectElement.value;

      if (selectedValue !== '') {
        const selectedOption =
          selectElement.options[selectElement.selectedIndex];
        const userName = selectedOption.getAttribute('data-name');
        const userEmail = selectedOption.getAttribute('data-email');
        nameSpan.textContent = userName || '';
        emailSpan.textContent = userEmail || '';
        divDataUser.classList.remove('hidden');
        divDataUser.classList.add('form-center');
        divOfficerType.classList.remove('hidden');
        divOfficerType.classList.add('form-center');
      } else {
        nameSpan.textContent = '';
        emailSpan.textContent = '';
        divDataUser.classList.remove('form-center');
        divDataUser.classList.add('hidden');
        divOfficerType.classList.remove('form-center');
        divOfficerType.classList.add('hidden');
      }
    });
  }

  toggleSelect();

  function toggleUser() {
    officerTypeRadio.forEach((input) => {
      input.addEventListener('change', () => {
        clearOfficerLevel();
        changeOfficerType();
        if (input.value !== '') {
          divOfficerLevel.classList.remove('hidden');
          divOfficerLevel.classList.add('form-center');
        } else if (input.value === '') {
          divOfficerLevel.classList.remove('form-center');
          divOfficerLevel.classList.add('hidden');
        }
      });
    });
  }

  toggleUser();

  function toggleLevel() {
    officerLevelRadio.forEach((input) => {
      input.addEventListener('change', () => {
        clearOtherData();
        if (input.value !== '') {
          otherData.classList.remove('hidden');
          otherData.classList.add('form-center');
        } else if (input.value === '') {
          otherData.classList.remove('form-center');
          otherData.classList.add('hidden');
        }
      });
    });
  }

  toggleLevel();

  function clearOfficerType() {
    document
      .querySelectorAll('input[name="officerType"]')
      .forEach((typeInput) => {
        typeInput.checked = false;
      });
    clearOfficerLevel();
  }

  function clearOfficerLevel() {
    document
      .querySelectorAll('input[name="officerLevel"]')
      .forEach((levelInput) => {
        levelInput.checked = false;
      });
    clearOtherData();
  }

  function clearOtherData() {
    document.getElementById('register').value = '';
    document.getElementById('phone').value = '';
  }

  function changeOfficerUser() {
    divOfficerLevel.classList.remove('form-center');
    divOfficerLevel.classList.add('hidden');
    changeOfficerType();
  }

  function changeOfficerType() {
    otherData.classList.remove('form-center');
    otherData.classList.add('hidden');
  }

  const register = document.getElementById('register');
  const phone = document.getElementById('phone');

  setupValidation(register, validateRegister, formatRegister);
  setupValidation(phone, validatePhone, formatPhoneValue);

  const sendDataOfficerBtn = document.getElementById('registerOfficerBtn');

  sendDataOfficerBtn.addEventListener('click', async () => {
    const data = {};

    const selectUser = document.getElementById('user-officer');
    const selectedOption = selectUser.options[selectUser.selectedIndex];
    const officerType = document.querySelector(
      'input[name="officerType"]:checked'
    );
    const officerLevel = document.querySelector(
      'input[name="officerLevel"]:checked'
    );
    const phone = document.getElementById('phone').value.replace(/\D/g, '');
    const cpfCnpj = document
      .getElementById('register')
      .value.replace(/\D/g, '');

    if (!selectedOption || !selectedOption.value) {
      showModalAlert(
        'Alert',
        'Usuário registrado!',
        'Por favor, selecione um usuário registrado pelo Colaborador.',
        closeModal
      );
      return;
    }

    if (!officerType) {
      showModalAlert(
        'Alert',
        'Tipo de Usuário!',
        'Por favor, selecione a função do colaborador.',
        closeModal
      );
      return;
    }

    if (!officerLevel) {
      showModalAlert(
        'Alert',
        'Nível de Usuário!',
        'Por favor, selecione o nível da função do colaborador.',
        closeModal
      );
      return;
    }

    if (!cpfCnpj) {
      showModalAlert(
        'Alert',
        `CPF ou CNPJ!`,
        `Por favor, digite o CPF do Colaborador.`,
        closeModal
      );
      return;
    }

    if (cpfCnpj && !validateRegister(cpfCnpj)) {
      const register = cpfCnpj.length === 11 ? 'CPF' : 'CNPJ';
      showModalAlert(
        'Alert',
        `${register} Inválido!`,
        `Por favor, digite um ${register} válido.`,
        closeModal
      );
      return;
    }

    if (!phone) {
      showModalAlert(
        'Alert',
        'Telefone!',
        'Por favor, digite o telefone para contato!',
        closeModal
      );
      return;
    }

    if (!validatePhone(phone)) {
      showModalAlert(
        'Alert',
        'Telefone!',
        'Digite o Telefone do cliente no formato (DDD)+Número',
        closeModal
      );
      return;
    }

    data.officerId = selectedOption.value;
    data.register = cpfCnpj;
    data.phone = phone;
    data.officerType = officerType.value;
    data.officerLevel = officerLevel.value;

    try {
      const officerRegister = await registerOfficer(data);
      if (officerRegister.status === 401) {
        showModalAlert(
          'Next',
          officerRegister.title,
          officerRegister.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (officerRegister.status === 403) {
        window.location.reload();
      } else if (
        officerRegister.status === 400 ||
        officerRegister.status === 409 ||
        officerRegister.status === 500
      ) {
        showModalAlert(
          'Alert',
          officerRegister.title,
          officerRegister.msg,
          closeModal
        );
        return;
      } else if (officerRegister.status === 201) {
        const level = officerRegister.level;
        await openSession(level);
        showModalAlert(
          'Next',
          officerRegister.title,
          officerRegister.msg,
          async () => {
            await listOfficerModal();
            closeModalDetails();
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados de endereço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  });
}
