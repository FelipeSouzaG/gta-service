import {
  closeModal,
  closeModalRegister,
  showModalAlert,
  openSession,
  exitSession,
} from '../js/modals.js';
import { userLogoff, userSection, userUpdate } from '../js/services.js';
import {
  formatName,
  validateEmail,
  validateName,
  validatePassword,
} from '../js/validation.js';

document.addEventListener('DOMContentLoaded', async function () {
  document.getElementById('dataUserMobile').addEventListener('click', () => {
    showModalUser();
  });

  document.getElementById('dataUserDesktop').addEventListener('click', () => {
    showModalUser();
  });
  document.getElementById('logoutMobile').addEventListener('click', () => {
    showModalLogoff();
  });

  document.getElementById('logoutDesktop').addEventListener('click', () => {
    showModalLogoff();
  });

  document.getElementById('exit-session').addEventListener('click', () => {
    showModalLogoff();
  });
});

async function showModalUser() {
  let userData;
  try {
    const dataUserSection = await userSection();
    if (dataUserSection.status === 401) {
      showModalAlert(
        'Next',
        dataUserSection.title,
        dataUserSection.msg,
        async () => {
          await exitSession();
        }
      );
    } else if (
      dataUserSection.status === 404 ||
      dataUserSection.status === 400
    ) {
      showModalAlert(
        'Alert',
        dataUserSection.title,
        dataUserSection.msg,
        closeModal
      );
      return;
    } else if (dataUserSection.status === 200) {
      const level = dataUserSection.level;
      await openSession(level);
      userData = dataUserSection;
    }
  } catch (error) {
    showModalAlert('Alert', 'Erro de Conexão!', error, closeModal);
    return;
  }

  const modal = document.getElementById('modal-register');
  const title = document.getElementById('modal-register-title');
  const content = document.getElementById('modal-register-main');
  const btnClose = document.getElementById('close-register');
  const footer = document.getElementById('modal-register-footer');

  title.textContent = 'Dados da Conta';
  content.innerHTML = `
    <form id="formRegister" class="form">
      <div id="nameClient" class="requirements-content">
        <div class="form-group">
          <input class="form-group-input" type="text" id="name" name="name" placeholder="">
          <label class="form-group-label" for="">Nome e Sobre nome:</label>
          <i class="bi bi-person toggle-icon-input"></i>
        </div>
        <div id="nameHelp" class="requirements hidden"></div>
      </div>
      <div class="requirements-content">
        <div class="form-group">
          <input class="form-group-input" type="text" id="email" name="email" autocomplete="username" required>
          <label class="form-group-label" for="">E-mail:</label>
          <i class="bi bi-envelope toggle-icon-input"></i>
        </div>
        <div id="emailHelp" class="requirements hidden"></div>
      </div>
      <div class="requirements-content">
        <div class="form-group">
          <input class="form-group-input" type="password" id="password" class="icon-input"  name="password" autocomplete="new-password" required>
          <label class="form-group-label" for="">Nova senha:</label>
          <button type="button" id="togglePassword">
            <i class="bi bi-eye toggle-icon-input"></i>
          </button>
        </div>
        <ul id="passwordRequirements" class="requirements hidden">
          <li class="requirement" data-requirement="length">8 Caracteres</li>
          <li class="requirement" data-requirement="uppercase">Letra Maiúscula</li>
          <li class="requirement" data-requirement="lowercase">Letra Minúscula</li>
          <li class="requirement" data-requirement="number">Número</li>
          <li class="requirement" data-requirement="special">Caractere Especial</li>
        </ul>
      </div>
      <div class="form-group">
        <input class="form-group-input" type="password" id="currentPassword" class="icon-input"  name="currentPassword" autocomplete="new-password" required>
        <label class="form-group-label" for="">Senha atual:</label>
        <button type="button" id="toggleCurrentPassword">
          <i class="bi bi-eye toggle-icon-input"></i>
        </button>
      </div>
    </form>
  `;
  footer.innerHTML = `
    <div class="modal-user-footer">
      <button id="submit" class="modal-content-btn-ok">Enviar</button>
    </div>
  `;

  modal.style.display = 'block';

  btnClose.onclick = function () {
    closeModalRegister();
  };

  const nameInput = document.getElementById('name');
  const nameHelp = document.getElementById('nameHelp');

  const emailInput = document.getElementById('email');
  const emailHelp = document.getElementById('emailHelp');

  const passwordInput = document.getElementById('password');
  const requirements = document.querySelectorAll('.requirement');
  const requirement = document.getElementById('passwordRequirements');
  const togglePasswordButton = document.getElementById('togglePassword');

  const currentPasswordInput = document.getElementById('currentPassword');
  const toggleCurrentPasswordButton = document.getElementById(
    'toggleCurrentPassword'
  );

  togglePasswordButton.addEventListener('click', () => {
    const type =
      passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    togglePasswordButton.innerHTML =
      type === 'password'
        ? '<i class="bi bi-eye toggle-icon-input">'
        : '<i class="bi bi-eye-slash toggle-icon-input"></i>';
  });

  toggleCurrentPasswordButton.addEventListener('click', () => {
    const type =
      currentPasswordInput.getAttribute('type') === 'password'
        ? 'text'
        : 'password';
    currentPasswordInput.setAttribute('type', type);
    toggleCurrentPasswordButton.innerHTML =
      type === 'password'
        ? '<i class="bi bi-eye toggle-icon-input">'
        : '<i class="bi bi-eye-slash toggle-icon-input"></i>';
  });

  nameInput.addEventListener('input', function () {
    const nameValue = nameInput.value.trim();
    if (nameInput.value !== '') {
      nameHelp.classList.remove('hidden');
    }
    if (validateName(nameValue)) {
      nameHelp.textContent = 'Nome válido!';
      nameHelp.style.color = 'var(--color-valid)';
      nameInput.classList.add('valid');
      nameInput.classList.remove('invalid');
    } else {
      nameHelp.textContent = 'Digite nome e sobrenome.';
      nameHelp.style.color = 'var(--color-invalid)';
      nameInput.classList.add('invalid');
      nameInput.classList.remove('valid');
    }
  });

  nameInput.addEventListener('blur', function () {
    nameInput.value = formatName(nameInput.value);
  });

  emailInput.addEventListener('input', function () {
    const emailValue = emailInput.value.trim();
    if (emailInput.value !== '') {
      emailHelp.classList.remove('hidden');
    }
    if (validateEmail(emailValue)) {
      emailHelp.textContent = 'E-mail válido!';
      emailHelp.style.color = 'var(--color-valid)';
      emailInput.classList.add('valid');
      emailInput.classList.remove('invalid');
    } else {
      emailHelp.textContent = 'Digite um e-mail válido';
      emailHelp.style.color = 'var(--color-invalid)';
      emailInput.classList.add('invalid');
      emailInput.classList.remove('valid');
    }
  });

  function checkPasswordRequirements(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@$!%*?&#]/.test(password),
    };

    requirements.forEach((requirement) => {
      const key = requirement.dataset.requirement;
      if (checks[key]) {
        requirement.style.color = 'var(--color-valid)';
        requirement.classList.add('valid');
      } else {
        requirement.style.color = 'var(--color-invalid)';
        requirement.classList.remove('valid');
      }
    });
  }

  passwordInput.addEventListener('input', function () {
    if (passwordInput.value !== '') {
      requirement.classList.remove('hidden');
    }

    const password = passwordInput.value;
    checkPasswordRequirements(password);

    if (
      password &&
      Array.from(requirements).every((req) => req.classList.contains('valid'))
    ) {
      passwordInput.classList.add('valid');
      passwordInput.classList.remove('invalid');
    } else {
      passwordInput.classList.add('invalid');
      passwordInput.classList.remove('valid');
    }
  });

  const name = document.getElementById('name');
  const email = document.getElementById('email');

  name.value = userData.name;
  email.value = userData.email;

  const send = document.getElementById('submit');
  send.addEventListener('click', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const data = {};

    if (name === '') {
      showModalAlert(
        'Alert',
        'Nome e Sobrenome!',
        'Por favor, digite seu Nome.',
        closeModal
      );
      return;
    }

    if (!validateName(name)) {
      showModalAlert(
        'Alert',
        'Nome Inválido!',
        'Por favor, digite seu nome e sobrenome.',
        closeModal
      );
      return;
    }
    if (email === '') {
      showModalAlert(
        'Alert',
        'E-mail!',
        'Por favor, digite seu e-mail.',
        closeModal
      );
      return;
    }
    if (!validateEmail(email)) {
      showModalAlert(
        'Alert',
        'E-mail inválido!',
        'E-mail informado inválido.',
        closeModal
      );
      return;
    }
    if (password === '') {
      showModalAlert(
        'Alert',
        'Senha!',
        'Por favor, digite sua nova senha.',
        closeModal
      );
      return;
    }
    if (!validatePassword(password)) {
      showModalAlert(
        'Alert',
        'Senha inválida!',
        'Requisitos mínimo de segurança de senha inválido.',
        closeModal
      );
      return;
    }

    if (currentPassword === '') {
      showModalAlert(
        'Alert',
        'Senha!',
        'Por favor, digite a senha atual.',
        closeModal
      );
      return;
    }
    if (!validatePassword(currentPassword)) {
      showModalAlert(
        'Alert',
        'Senha inválida!',
        'Senha atual inválida',
        closeModal
      );
      return;
    }
    data.name = name;
    data.email = email;
    data.password = password;
    data.currentPassword = currentPassword;
    try {
      const dataUserUpdate = await userUpdate(data);
      if (dataUserUpdate.status === 404 || dataUserUpdate.status === 401) {
        showModalAlert(
          'Next',
          dataUserUpdate.title,
          dataUserUpdate.msg,
          async () => {
            await exitSession();
          }
        );
      } else if (
        dataUserUpdate.status === 400 ||
        dataUserUpdate.status === 409
      ) {
        showModalAlert(
          'Alert',
          dataUserUpdate.title,
          dataUserUpdate.msg,
          closeModal
        );
        return;
      } else if (dataUserUpdate.status === 200) {
        const level = dataUserUpdate.level;
        showModalAlert(
          'Next',
          dataUserUpdate.title,
          dataUserUpdate.msg,
          async () => {
            await openSession(level);
            closeModalRegister();
          }
        );
      }
    } catch (error) {
      showModalAlert('Alert', 'Erro de conexão!!', error, closeModal);
      return;
    }
  });
}

function showModalLogoff() {
  showModalAlert(
    'Confirm',
    'Confirmar Logout!',
    'Deseja mesmo sair?',
    async () => {
      try {
        const logoff = await userLogoff();
        if (logoff.status === 201 && logoff.redirectUrl) {
          showModalAlert(
            'Next',
            'Sessão Encerrada!',
            'Logout realizado com sucesso! Até maís.',
            () => {
              localStorage.removeItem('returnModal');
              localStorage.removeItem('session');
              localStorage.removeItem('sessionExpiration');
              window.location.href = logoff.redirectUrl;
            }
          );
        }
      } catch (error) {
        showModalAlert('Alert', 'Erro de conexão!!', error, closeModal);
        return;
      }
    }
  );
}
