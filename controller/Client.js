import {
  registerClient,
  listAllUsers,
  listAllClients,
} from '../js/services.js';
import {
  formatPhoneValue,
  formatRegister,
  formatName,
  validateName,
  validateRegister,
  validatePhone,
  validateEmail,
  setupValidation,
} from '../js/validation.js';
import {
  showModalAlert,
  closeModal,
  closeModalRegister,
  closeModalDetails,
  exitSession,
  openSession,
} from '../js/modals.js';
import { openListAddressClient } from './Address.js';

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('listClientMobile').addEventListener('click', () => {
    listClientModal();
  });
  document.getElementById('listClientDesktop').addEventListener('click', () => {
    listClientModal();
  });
});

export async function listClientModal() {
  let clients = [];
  try {
    const listClients = await listAllClients();
    if (listClients.status === 401) {
      showModalAlert('Next', listClients.title, listClients.msg, async () => {
        await exitSession();
      });
    } else if (listClients.status === 403) {
      showModalAlert('Alert', listClients.title, listClients.msg, closeModal);
      return;
    } else if (listClients.status === 400) {
      clients = [];
    } else if (listClients.status === 200) {
      const level = listClients.level;
      await openSession(level);
      clients = [...listClients.clientList];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  if (clients.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Cliente Cadastrado!',
      'Por favor, faça cadastros de clientes para listar.',
      async () => {
        await newClientModal();
        closeModalRegister();
      }
    );
  }
  //////////////////////////////////

  let filteredClients = clients;

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const footer = document.getElementById('modal-register-footer');
  const btnClose = document.getElementById('close-register');

  title.textContent = 'Lista de Clientes';
  content.innerHTML = `
    <div class="form-center-item">
      <select class="select" id="filter-client-type">
        <option value="">Tipo de Cliente: Todos</option>
        <option value="Novo">Novo</option>
        <option value="Comum">Comum</option>
        <option value="Contrato">Contrato</option>
      </select>
    </div>

    <table class="details-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody id="client-list">
        ${renderClientsRows(filteredClients)}
      </tbody>
    </table>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="newClient" class="modal-content-btn-enable">+Cliente</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = () => closeModalRegister();

  const clientsTypeFilter = document.getElementById('filter-client-type');

  clientsTypeFilter.addEventListener('change', filterAddressClients);

  function filterAddressClients() {
    const selectedTypes = document.getElementById('filter-client-type').value;

    const filteredClients = clients.filter(
      (client) => !selectedTypes || client.clientType === selectedTypes
    );

    document.getElementById('client-list').innerHTML =
      renderClientsRows(filteredClients);
  }

  const newclient = document.getElementById('newClient');
  newclient.addEventListener('click', async () => {
    await newClientModal();
    closeModalRegister();
  });
}

function renderClientsRows(clients) {
  return clients
    .map(
      (client) => `
        <tr>
          <td>
            ${client.name}
          </td>
          <td>
            <div class="center">
              ${client.clientType}
              <i class="view-client-details-btn
                bi bi-person-lines-fill endBtn"
                data-client='${JSON.stringify(client)}'>
              </i>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-client-details-btn')) {
    const client = JSON.parse(event.target.dataset.client);
    await openClientDetails(client);
    closeModalRegister();
  }
});

export async function openClientDetails(client) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Dados do Cliente';
  const isUser = client.userId && Object.keys(client.userId).length > 0;
  const userSite = isUser == true ? `<td>Sim</td>` : `<td>Não</td>`;
  const isRegister = client.register && Object.keys(client.register).length > 0;
  const isCpf =
    isRegister && client.register.length === 11
      ? `
          <tr>
            <td>CPF:</td>
            <td>${formatRegister(client.register)}</td>
          </tr>
        `
      : '';
  const isCnpj =
    isRegister && client.register.length === 14
      ? `
        <tr>
          <td>CNPJ:</td>
          <td>${formatRegister(client.register)}</td>
        </tr>
      `
      : '';
  const isPhoneAlternative =
    client.alternativePhone && Object.keys(client.alternativePhone).length > 0;
  const phoneAlternative =
    isPhoneAlternative && client.alternativePhone.length > 0
      ? `
        <tr>
          <td>Telefone Alternativo:</td>
          <td>${formatPhoneValue(client.alternativePhone)}</td>
        </tr>
      `
      : '';
  const isEmail = client.email && Object.keys(client.email).length > 0;
  const email =
    isEmail && client.email.length > 0
      ? `
        <tr>
          <td>Email:</td>
          <td>${client.email}</td>
        </tr>
      `
      : '';
  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2">
            Cliente: ${client.clientNumber}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Nome:</td>
          <td>${client.name}</td>
        </tr>
        ${isCpf}
        ${isCnpj}
        <tr>
          <td>Telefone:</td>
          <td>${formatPhoneValue(client.phone)}</td>
        </tr>
        ${phoneAlternative}
        ${email}
        <tr>
          <td>Usuário do site?</td>
          ${userSite}
        </tr>
        <tr>
          <td>Tipo:</td>
          <td>
            <div class="center">
              ${client.clientType}
               <i id="clientTypeCheck" class="client-type-btn
                bi bi-filetype-pdf endBtn hidden"
                data-type='${JSON.stringify(client)}'>
              </i>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="button-client-table">
      <i class="client-address-btn
        bi bi-geo-alt tabBtn"
        data-address='${JSON.stringify(client)}'>
      </i>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="editBtn" class="modal-content-btn-edit">Editar</button>
      <button type="button" id="deleteBtn" class="modal-content-btn-cancel">Excluir</button>
    </div>
  `;

  function checkClient() {
    const check = document.getElementById('clientTypeCheck');
    if (client.clientType === 'Comum' || client.clientType === 'Contrato') {
      check.classList.remove('hidden');
    } else {
      check.classList.add('hidden');
    }
  }

  checkClient();

  modal.style.display = 'block';

  btnReturn.onclick = async function () {
    await listClientModal();
    closeModalDetails();
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };

  document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('client-address-btn')) {
      const client = JSON.parse(event.target.dataset.address);
      await openListAddressClient(client);
    }
  });
}

async function newClientModal() {
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

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Cadastro de Cliente';

  content.innerHTML = `
    <div class="form-content">
      <div class="form-center">
        <label class="label">Associar o cadastro a um Usúario?</label>
        <div class="radio-container">
          <label class="label">
            <input type="radio" class="radio" name="isUser" value="yes">
            <span class="span">SIM</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="isUser" value="no">
            <span class="span">NÃO</span>
          </label>
        </div>
      </div>

      <div id="selectUser" class="hidden">
        <select id="user-client" class="select">
          <option value="">Selecione o Usuário</option>
          ${filteredUsers
            .map(
              (user) =>
                `<option value="${user._id}">
                  ${user.name} - ${user.email}
                </option>`
            )
            .join('')}
        </select>
      </div>

      <div id="otherData" class="hidden">
        <div id="nameClient" class="hidden">
          <input class="form-group-input" type="text" id="name" placeholder="">
          <label class="form-group-label" for="">Nome do Cliente:</label>
          <i class="bi bi-person toggle-icon-input"></i>
        </div>

        <div class="form-group">
          <input class="form-group-input" type="text" id="phone" required>
          <label class="form-group-label" for="">Telefone:</label>
          <i class="bi bi-phone toggle-icon-input"></i>
        </div>
        
        <div class="form-group">
          <input class="form-group-input" type="text" id="register" maxlength="18" placeholder="">
          <label class="form-group-label" for="">CPF / CNPJ:</label>
          <i class="bi bi-123 toggle-icon-input"></i>
        </div>
        
        <div class="form-group">
          <input class="form-group-input" type="text" id="phoneAlternative" placeholder="">
          <label class="form-group-label" for="">Telefone Alternativo:</label>
          <i class="bi bi-telephone toggle-icon-input"></i>
        </div>
        <div id="emailClient" class="hidden">
          <input class="form-group-input" type="text" id="email" placeholder="">
          <label class="form-group-label" for="">E-mail:</label>
          <i class="bi bi-envelope toggle-icon-input"></i>
        </div>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="registerClient" class="modal-content-btn-ok">Salvar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = function () {
    closeModalDetails();
  };

  btnReturn.onclick = async function () {
    await listClientModal();
    closeModalDetails();
  };

  function listUserRegisted() {
    if (filteredUsers.length < 1) {
      showModalAlert(
        'Alert',
        'Nunhum Usúario!',
        'Não há usuários registrados ou solicite ao Cliente para se registrar.',
        closeModal
      );
      disableYesAndSelectNo();
    }
  }

  function disableYesAndSelectNo() {
    const yesRadio = document.querySelector(
      'input[name="isUser"][value="yes"]'
    );
    const noRadio = document.querySelector('input[name="isUser"][value="no"]');

    if (yesRadio && noRadio) {
      yesRadio.disabled = true;
      noRadio.checked = true;
      noRadio.dispatchEvent(new Event('change'));
    }
  }

  function toggleUser() {
    const isUserData = document.querySelectorAll('input[name="isUser"]');
    const selectUserContainer = document.getElementById('selectUser');
    const nameClientContainer = document.getElementById('nameClient');
    const emailClientContainer = document.getElementById('emailClient');
    const selectUser = document.getElementById('user-client');
    const emailUser = document.getElementById('email');
    const nameUser = document.getElementById('name');
    const divOtherDatas = document.getElementById('otherData');
    isUserData.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.value === 'yes' && input.checked) {
          selectUserContainer.classList.remove('hidden');
          selectUserContainer.classList.add('form-center');
          nameClientContainer.classList.remove('form-group');
          nameClientContainer.classList.add('hidden');
          emailClientContainer.classList.remove('form-group');
          emailClientContainer.classList.add('hidden');
          divOtherDatas.classList.remove('form-center');
          divOtherDatas.classList.add('hidden');
          nameUser.value = '';
          emailUser.value = '';
          listUserRegisted();
        } else if (input.value === 'no' && input.checked) {
          selectUserContainer.classList.remove('form-center');
          selectUserContainer.classList.add('hidden');
          nameClientContainer.classList.remove('hidden');
          nameClientContainer.classList.add('form-group');
          emailClientContainer.classList.remove('hidden');
          emailClientContainer.classList.add('form-group');
          divOtherDatas.classList.remove('hidden');
          divOtherDatas.classList.add('form-center');
          selectUser.value = '';
        }
      });
    });
  }

  toggleUser();

  function toggleSelect() {
    const valueSelect = document.getElementById('selectUser');
    const divOtherDatas = document.getElementById('otherData');
    valueSelect.addEventListener('change', (e) => {
      if (e.value !== '') {
        divOtherDatas.classList.remove('hidden');
        divOtherDatas.classList.add('form-center');
      } else {
        divOtherDatas.classList.remove('form-center');
        divOtherDatas.classList.add('hidden');
      }
    });
  }

  toggleSelect();

  const register = document.getElementById('register');
  const nameInput = document.getElementById('name');
  const phone = document.getElementById('phone');
  const phoneAlternative = document.getElementById('phoneAlternative');
  const emailInput = document.getElementById('email');

  nameInput.addEventListener('input', function () {
    const valid = validateName(nameInput.value);
    if (valid) {
      nameInput.classList.add('valid');
      nameInput.classList.remove('invalid');
    } else {
      nameInput.classList.add('invalid');
      nameInput.classList.remove('valid');
    }
    if (nameInput.value === '') {
      nameInput.classList.remove('valid');
      nameInput.classList.remove('invalid');
      nameInput.classList.add('form-group-input');
    }
  });

  nameInput.addEventListener('blur', function () {
    nameInput.value = formatName(nameInput.value);
  });

  setupValidation(register, validateRegister, formatRegister);
  setupValidation(phone, validatePhone, formatPhoneValue);
  setupValidation(phoneAlternative, validatePhone, formatPhoneValue);
  setupValidation(emailInput, validateEmail);

  const sendDataClient = document.getElementById('registerClient');

  sendDataClient.addEventListener('click', async () => {
    const data = {};

    const isUserData = [
      ...document.querySelectorAll('input[name="isUser"]'),
    ].find((input) => input.checked)?.value;

    const selectUser = document.getElementById('user-client');
    const selectedOption = selectUser.options[selectUser.selectedIndex];

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.replace(/\D/g, '');
    const cpfCnpj =
      document.getElementById('register').value.replace(/\D/g, '') || null;
    const phoneAlternative =
      document.getElementById('phoneAlternative').value.replace(/\D/g, '') ||
      null;
    const email = document.getElementById('email').value.trim() || null;

    if (!isUserData) {
      showModalAlert(
        'Alert',
        'Usuário registrado!',
        'Por favor, selecione se o novo Cliente já é um usuário registrado ou não.',
        closeModal
      );
      return;
    } else if (isUserData === 'yes') {
      if (selectedOption.value === '') {
        showModalAlert(
          'Alert',
          'Selecione o Usuário!',
          'Por favor, selecione um usuário registrado!',
          closeModal
        );
        return;
      }
      data.clientUserId = selectedOption.value;
    } else if (isUserData === 'no') {
      if (!name) {
        showModalAlert(
          'Alert',
          'Nome',
          'Por favor, digite o nome do Cliente.',
          closeModal
        );
        return;
      } else {
        if (!validateName(name)) {
          showModalAlert(
            'Alert',
            'Nome Inválido',
            'Digite Nome e Sobrenome do Cliente',
            closeModal
          );
          return;
        }
        data.name = name;
      }
      if (email) {
        if (!validateEmail(email)) {
          showModalAlert(
            'Alert',
            'E-mail Inválido!',
            'Digite o E-mail do cliente no formato dominio@mail.com.',
            closeModal
          );
          return;
        }
        data.email = email;
      }
    }

    if (phone) {
      if (!validatePhone(phone)) {
        showModalAlert(
          'Alert',
          'Telefone!',
          'Digite o Telefone do cliente no formato (DDD)+Número',
          closeModal
        );
        return;
      }
      data.phone = phone;
    } else {
      showModalAlert(
        'Alert',
        'Telefone!',
        'Por favor, digite o telefone do Cliente!',
        closeModal
      );
      return;
    }

    if (cpfCnpj) {
      if (!validateRegister(cpfCnpj)) {
        const register = cpfCnpj.length === 11 ? 'CPF' : 'CNPJ';
        showModalAlert(
          'Alert',
          `${register} Inválido!`,
          `Por favor, digite um ${register} válido.`,
          closeModal
        );
        return;
      }
      data.register = cpfCnpj;
    }
    if (phoneAlternative) {
      if (!validatePhone(phoneAlternative)) {
        showModalAlert(
          'Alert',
          'Telefone Alternativo!',
          'Digite o Telefone Alternativo do cliente no formato (DDD)+Número',
          closeModal
        );
        return;
      }
      data.alternativePhone = phoneAlternative;
    }
    try {
      const clientRegister = await registerClient(data);
      if (clientRegister.status === 401) {
        showModalAlert(
          'Next',
          clientRegister.title,
          clientRegister.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (clientRegister.status === 403) {
        window.location.reload();
      } else if (
        clientRegister.status === 400 ||
        clientRegister.status === 409 ||
        clientRegister.status === 500
      ) {
        showModalAlert(
          'Alert',
          clientRegister.title,
          clientRegister.msg,
          closeModal
        );
        return;
      } else if (clientRegister.status === 201) {
        const level = clientRegister.level;
        await openSession(level);
        showModalAlert(
          'Next',
          clientRegister.title,
          clientRegister.msg,
          async () => {
            await listClientModal();
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
