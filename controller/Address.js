import { allAddresses, createAddress } from '../js/services.js';
import {
  showModalAlert,
  returnModal,
  closeModal,
  closeModalDetails,
  exitSession,
  openSession,
} from '../js/modals.js';
import { openClientDetails } from './Client.js';
import { listEnvironmentAddressClient } from './Environment.js';
import { openOfficerDetails } from './Officers.js';
import { formatPostalCode } from '../js/validation.js';
let clientData;
let addressData;
export async function openListAddressClient(client) {
  clientData = client;

  let addressClient = [];

  try {
    const listAddressClient = await allAddresses(client._id);
    if (listAddressClient.status === 401) {
      showModalAlert(
        'Next',
        listAddressClient.title,
        listAddressClient.msg,
        async () => {
          await exitSession();
        }
      );
    } else if (listAddressClient.status === 403) {
      showModalAlert(
        'Alert',
        listAddressClient.title,
        listAddressClient.msg,
        closeModal
      );
      return;
    } else if (listAddressClient.status === 400) {
      addressClient = [];
    } else if (listAddressClient.status === 200) {
      const level = listAddressClient.level;
      await openSession(level);
      addressClient = [...listAddressClient.listAddress];
    }
  } catch (error) {
    console.error('Erro ao buscar dados de endereço:', error);
    showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
    return;
  }

  let addressClientfiltered = addressClient;

  if (addressClientfiltered.length === 0) {
    showModalAlert(
      'Next',
      'Nenhum Endereço Cadastrado!',
      'Por favor, cadastre endereço para esse cliente.',
      async () => {
        await newAddress(client);
      }
    );
  }

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Endereços do Cliente';

  content.innerHTML = `
      <div class="form-center-item">
        <label class="label">Cliente: ${client.name}</label>
        <select class="select" id="filter-address-type">
          <option value="">Tipo de Endereço: Todos</option>
          <option value="Residencial">Residencial</option>
          <option value="Empresarial">Empresarial</option>
        </select>
      </div>
      <table class="details-table">
        <thead>
          <tr>
            <th>Endereço - Tipo</th>
          </tr>
        </thead>
        <tbody id="address-list">
          ${renderAddressClientsRows(addressClientfiltered)}
        </tbody>
      </table>
    `;

  footer.innerHTML = `
      <div class="modal-user-footer">
        <button type="button" id="newAddressClient" class="modal-content-btn-enable">+Endereço</button>
      </div>
    `;

  modal.style.display = 'block';

  btnClose.onclick = () => {
    closeModalDetails();
  };

  btnReturn.onclick = async () => await openClientDetails(client);

  const addressTypeFilter = document.getElementById('filter-address-type');

  addressTypeFilter.addEventListener('change', () => {
    filterAddressClients();
  });

  function filterAddressClients() {
    const selectedTypes = document.getElementById('filter-address-type').value;

    const filteredAddress = addressClientfiltered.filter(
      (address) => !selectedTypes || address.addressType === selectedTypes
    );

    document.getElementById('address-list').innerHTML =
      renderAddressClientsRows(filteredAddress);
  }

  const newclient = document.getElementById('newAddressClient');
  newclient.addEventListener('click', async () => {
    await newAddress(client);
  });
}

function renderAddressClientsRows(addresses) {
  return addresses
    .map(
      (address) => `
        <tr>
          <td>
            <div class="center">
              ${address.street} - ${address.addressType}
              <i class="view-address-btn
                bi bi-geo-alt endBtn"
                data-address='${JSON.stringify(address)}'>
              </i>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('view-address-btn')) {
    const addressClientDetails = JSON.parse(event.target.dataset.address);
    addressData = addressClientDetails;
    await openDetailsClientAddressId(addressClientDetails);
  }
});

export async function openDetailsClientAddressId(address) {
  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  const isComplement =
    address.complement && Object.keys(address.complement).length > 0;
  const complement =
    isComplement && address.complement.length > 0
      ? `<tr>
          <td>Complemento:</td>
          <td>${address.complement}</td>
        </tr>`
      : '';
  title.textContent = 'Detalhamento do Endereço';

  content.innerHTML = `
    <table class="details-table">
      <thead>
        <tr>
          <th colspan="2" style="text-align: center;">
            Endereço ${address.addressType}
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
        ${complement}
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
    </table>
    <div class="button-client-table">
      <i class="client-environment-btn
        bi bi-thermometer-snow tabBtn"
        data-environment='${JSON.stringify(address)}'>
      </i>
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      
    </div>
  `;

  modal.style.display = 'block';

  document.addEventListener('click', async function (event) {
    if (event.target.classList.contains('client-environment-btn')) {
      const AddressClient = JSON.parse(event.target.dataset.environment);
      await listEnvironmentAddressClient(AddressClient);
    }
  });

  btnReturn.onclick = async function () {
    openListAddressClient(clientData);
  };

  btnClose.onclick = async function () {
    closeModalDetails();
  };
}

export async function newAddress(data) {
  const dataAddress = data;
  let addressDataType;
  if (dataAddress.clientNumber) {
    addressDataType = 'isClient';
  } else if (dataAddress.officerNumber) {
    addressDataType = 'isOfficer';
  } else {
    showModalAlert(
      'Next',
      'Não identificado!',
      'Dados do usuário não identificado',
      async () => {
        window.location.reload();
      }
    );
  }

  const userClient =
    addressDataType === 'isClient' ? `Cliente: ${data.name}` : '';
  const userOfficer =
    addressDataType === 'isOfficer' ? `Colaborador: ${data.userId.name}` : '';

  const modal = document.getElementById('modal-details');
  const title = document.getElementById('modal-details-title');
  const content = document.getElementById('modal-details-main');
  const btnClose = document.getElementById('close-details');
  const btnReturn = document.getElementById('arrow-details');
  const footer = document.getElementById('modal-details-footer');

  title.textContent = 'Cadastro de Endereço';
  content.innerHTML = `
    <div class="form-content">
      <label class="label">${userClient || userOfficer}</label>
      <div class="form-center">
        <label class="label"> Tipo de Endereço: </label>
        <div class="radio-container">
          <label class="label">
            <input type="radio" class="radio" name="addressType" value="Residencial">
            <span class="span">Residencial</span>
          </label>
          <label class="label">
            <input type="radio" class="radio" name="addressType" value="Empresarial">
            <span class="span">Empresarial</span>
          </label>
        </div>
      </div>
      <div id="divPostalCod" class="hidden" style="width: 50%;">
        <input class="form-group-input" type="tel" id="postalCode" name="postalCode" required maxlength="9" inputmode="numeric">
        <label class="form-group-label" for="">Digite o CEP:</label>
      </div>
      <div id="form-address-data" class="hidden">
        <div class="data-items">
          <label class="label">
            Endereço:
            <span id="street" class="span"></span>
          </label>
          <label class="label">
            Bairro:
            <span id="district" class="span"></span>
          </label>
          <label class="label">
            Cidade:
            <span id="city" class="span"></span> / 
            <span id="state" class="span"></span>
          </label>
        </div>
        <div class="form-center">
          <div class="form-group" style="width: 60%;">
            <input class="form-group-input" type="tel" id="number" name="number" required maxlength="9" inputmode="numeric">
            <label class="form-group-label" for="">Número:</label>
          </div>
          <div class="form-group" style="width: 60%;">
            <input class="form-group-input" type="text" id="complement" name="complement" maxlength="15" placeholder="">
            <label class="form-group-label" for="">Complemento:</label>
          </div>
        </div>
      </div>      
    </div>
  `;

  footer.innerHTML = `
    <div class="modal-user-footer">
      <button type="button" id="createBtn" class="modal-content-btn-disabled" disabled>Salvar</button>
    </div>
  `;

  btnReturn.onclick = async function () {
    if (addressDataType === 'isClient') {
      await openListAddressClient(data);
    } else if (addressDataType === 'isOfficer') {
      await openOfficerDetails(data);
    } else {
      closeModalDetails();
    }
  };

  btnClose.onclick = function () {
    closeModalDetails();
  };

  modal.style.display = 'block';

  function disableYesAndSelectNo() {
    const yesRadio = document.querySelector(
      'input[name="addressType"][value="Empresarial"]'
    );
    const noRadio = document.querySelector(
      'input[name="addressType"][value="Residencial"]'
    );

    if (addressDataType === 'isOfficer') {
      yesRadio.disabled = true;
      noRadio.checked = true;
      noRadio.dispatchEvent(new Event('change'));
      const postalCodeContainer = document.getElementById('divPostalCod');
      postalCodeContainer.classList.remove('hidden');
      postalCodeContainer.classList.add('form-group');
    }
  }

  disableYesAndSelectNo();

  function toggleAddressFields() {
    const addressTypeInputs = document.querySelectorAll(
      'input[name="addressType"]'
    );

    const postalCodeContainer = document.getElementById('divPostalCod');

    addressTypeInputs.forEach((input) => {
      input.addEventListener('change', () => {
        if (input.checked) {
          postalCodeContainer.classList.remove('hidden');
          postalCodeContainer.classList.add('form-group');
        }
      });
    });
  }

  toggleAddressFields();

  function validateAddressForm() {
    const createBtn = document.getElementById('createBtn');
    const street = document.getElementById('street').textContent.trim();
    const number = document.getElementById('number').value.trim();
    const district = document.getElementById('district').textContent.trim();
    const city = document.getElementById('city').textContent.trim();
    const state = document.getElementById('state').textContent.trim();
    const postalCode = document.getElementById('postalCode').value.trim();
    const addressType = document.querySelector(
      'input[name="addressType"]:checked'
    );

    const isFormValid =
      postalCode !== '' &&
      street !== '' &&
      district !== '' &&
      city !== '' &&
      state !== '' &&
      number !== '' &&
      !isNaN(number) &&
      parseInt(number) >= 1 &&
      addressType !== null;

    createBtn.disabled = !isFormValid;
    createBtn.className = isFormValid
      ? 'modal-content-btn-ok'
      : 'modal-content-btn-disabled';
  }

  function setupFormValidation() {
    const inputsToWatch = ['postalCode', 'number'];

    inputsToWatch.forEach((id) => {
      const input = document.getElementById(id);
      input.addEventListener('input', validateAddressForm);
    });

    const addressTypeInputs = document.querySelectorAll(
      'input[name="addressType"]'
    );
    addressTypeInputs.forEach((input) =>
      input.addEventListener('change', validateAddressForm)
    );

    ['street', 'district', 'city', 'state'].forEach((id) => {
      const element = document.getElementById(id);
      const observer = new MutationObserver(validateAddressForm);
      observer.observe(element, { childList: true, subtree: true });
    });
  }

  setupFormValidation();

  const createNewAddress = document.getElementById('createBtn');
  createNewAddress.addEventListener('click', async () => {
    const street = document.getElementById('street').textContent;
    const number = document.getElementById('number').value;
    const complement = document.getElementById('complement').value;
    const district = document.getElementById('district').textContent;
    const city = document.getElementById('city').textContent;
    const state = document.getElementById('state').textContent;
    const postalCode = document.getElementById('postalCode').value;
    const addressTypeInput = document.querySelector(
      'input[name="addressType"]:checked'
    );
    const addressType = addressTypeInput ? addressTypeInput.value : '';

    if (postalCode.trim() === '') {
      showModalAlert(
        'Alert',
        'CEP Obrigatório!!',
        'Digite o CEP do endereço.',
        closeModal
      );
      return;
    }
    if (
      street.trim() === '' ||
      district.trim() === '' ||
      city.trim() === '' ||
      state.trim() === ''
    ) {
      showModalAlert(
        'Alert',
        'Endereço Obrigatório!!',
        'Digite um CEP válido para carregar o endereço de entrega.',
        closeModal
      );
      return;
    }
    if (number.trim() === '' || isNaN(number) || parseInt(number) < 1) {
      showModalAlert(
        'Alert',
        'Número Inválido!!',
        'Digite um número válido para o endereço.',
        closeModal
      );
      return;
    }
    if (addressType === '') {
      showModalAlert(
        'Alert',
        'Tipo de Endereço!!',
        'Selecione um tipo de endereço.',
        closeModal
      );
      return;
    }

    const dataSend = {
      postalCode: postalCode,
      street: street,
      number: number,
      complement: complement,
      district: district,
      city: city,
      state: state,
      addressType: addressType,
    };

    if (addressDataType === 'isClient') {
      dataSend.clientId = data._id;
    } else if (addressDataType === 'isOfficer') {
      dataSend.officerId = data._id;
    }

    try {
      const addressRegister = await createAddress(dataSend);
      if (addressRegister.status === 401) {
        showModalAlert(
          'Next',
          addressRegister.title,
          addressRegister.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (addressRegister.status === 403) {
        window.location.reload();
      } else if (
        addressRegister.status === 400 ||
        addressRegister.status === 409 ||
        addressRegister.status === 500
      ) {
        showModalAlert(
          'Alert',
          addressRegister.title,
          addressRegister.msg,
          closeModal
        );
        return;
      } else if (addressRegister.status === 201) {
        const level = addressRegister.level;
        await openSession(level);
        showModalAlert(
          'Next',
          addressRegister.title,
          addressRegister.msg,
          async () => {
            if (addressDataType === 'isClient') {
              await openListAddressClient(data);
            } else if (addressDataType === 'isOfficer') {
              await openOfficerDetails(data);
            } else {
              window.location.reload();
            }
          }
        );
      }
    } catch (error) {
      console.error('Erro ao buscar dados de endereço:', error);
      showModalAlert('Alert', 'Erro de Conexão!', error.message, closeModal);
      return;
    }
  });

  const postalCodeInput = document.getElementById('postalCode');
  const numberInput = document.getElementById('number');

  postalCodeInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
  });

  numberInput.addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
  });

  postalCodeInput.addEventListener('input', formatPostalCode);
  postalCodeInput.addEventListener('input', checkPostalCodeLength);
  numberInput.addEventListener('input', formatNumber);

  function formatPostalCode(event) {
    const input = event.target;
    input.value = input.value.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  function formatNumber(event) {
    const input = event.target;
    input.value = input.value.replace(/^0+/, '');
  }

  async function checkPostalCodeLength(event) {
    const input = event.target;
    const addressDataDiv = document.getElementById('form-address-data');
    const numberField = document.getElementById('number');
    const length = input.value.length;
    if (length === 9) {
      const isValid = await reqPostalCode(input.value);
      if (isValid) {
        input.style.backgroundColor = 'var(--color-valid)';
        input.style.color = 'var(--color-3)';
        addressDataDiv.classList.remove('hidden');
        addressDataDiv.classList.add('form-center');
        numberField.disabled = false;
        numberField.focus();
      } else {
        input.style.backgroundColor = 'var(--color-invalid)';
        input.style.color = 'var(--color-3)';
        addressDataDiv.classList.remove('form-center');
        addressDataDiv.classList.add('hidden');
      }
    } else {
      input.style.backgroundColor = '';
      input.style.color = '';
      addressDataDiv.classList.remove('form-center');
      addressDataDiv.classList.add('hidden');
    }
  }

  async function reqPostalCode(code) {
    try {
      const postalCodeQuery = await fetch(
        `https://viacep.com.br/ws/${code}/json/`
      );
      const postalCodeData = await postalCodeQuery.json();
      if (postalCodeData.erro) {
        return false;
      }
      document.getElementById('street').textContent = postalCodeData.logradouro;
      document.getElementById('district').textContent = postalCodeData.bairro;
      document.getElementById('city').textContent = postalCodeData.localidade;
      document.getElementById('state').textContent = postalCodeData.uf;
      return true;
    } catch (error) {
      showModalAlert('Alert', 'CEP inexistente!!', error, closeModal);
      return false;
    }
  }
}
