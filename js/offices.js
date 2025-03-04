import { userSection } from './services.js';
import {
  showModalAlert,
  closeModal,
  openSession,
  exitSession,
} from './modals.js';
import { listRequestModal } from '../controller/Request.js';
import { showModalServicesList } from '../controller/jobs.js';

document.addEventListener('DOMContentLoaded', async function () {
  const session = localStorage.getItem('session');
  const sessionExpiration = localStorage.getItem('sessionExpiration');

  const userCheck = async () => {
    if (session) {
      if (sessionExpiration && new Date() > new Date(sessionExpiration)) {
        showModalAlert(
          'Next',
          'Sessão expirada!',
          'Por favor, faça login novamente.',
          async () => {
            await exitSession();
          }
        );
      }
      if (window.innerWidth >= 1025) {
        if (session === 'Gestor') {
          document
            .querySelector('.request-client-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.request-officer-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.data-user-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.request-service-desktop')
            .classList.remove('hidden');
        }
        if (session === 'Secretário') {
          document
            .querySelector('.request-service-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.request-client-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.request-officer-desktop')
            .classList.remove('hidden');
          document
            .querySelector('.data-user-desktop')
            .classList.remove('hidden');
        }
        if (session === 'Técnico') {
          document.querySelector('.officer-desktop').classList.remove('hidden');
          document
            .querySelector('.data-user-desktop')
            .classList.remove('hidden');
        }
      } else {
        if (session === 'Gestor') {
          document
            .querySelector('.request-service-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.request-client-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.request-officer-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.data-user-mobile')
            .classList.remove('hidden');
        }
        if (session === 'Secretário') {
          document
            .querySelector('.request-service-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.request-client-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.request-officer-mobile')
            .classList.remove('hidden');
          document
            .querySelector('.data-user-mobile')
            .classList.remove('hidden');
        }
        if (session === 'Técnico') {
          document.querySelector('.officer-mobile').classList.remove('hidden');
          document
            .querySelector('.data-user-mobile')
            .classList.remove('hidden');
        }
      }
    } else {
      try {
        const dataUserSection = await userSection();
        if (dataUserSection.status === 200) {
          const level = dataUserSection.level;
          showModalAlert(
            'Next',
            dataUserSection.title,
            dataUserSection.msg,
            async () => {
              await openSession(level);
              window.location.reload();
            }
          );
        }
        if (
          dataUserSection.status === 401 ||
          dataUserSection.status === 404 ||
          dataUserSection.status === 400
        ) {
          showModalAlert(
            'Next',
            dataUserSection.title,
            dataUserSection.msg,
            async () => {
              await exitSession();
            }
          );
        }
      } catch (error) {
        console.error('Falha ao buscar usuário no servidor.');
        showModalAlert('OK', 'Erro de Conexão', error, closeModal);
      }
    }
  };

  await userCheck();

  const SESSION_TIME = 5 * 60 * 1000; // 5 minutos
  let sessionInterval;

  const sessionTimer = document.getElementById('session-timer');
  const progressCircle = document.getElementById('progress-circle');
  const renewButton = document.getElementById('renew-session');

  // Verifica se o usuário está logado (session presente)
  function isUserLoggedIn() {
    return localStorage.getItem('session') !== null;
  }

  // Inicializa o temporizador
  async function initializeSessionTimer() {
    const expiration = localStorage.getItem('sessionExpiration');

    if (!expiration) {
      return; // Se não há tempo de expiração, não faz sentido mostrar o temporizador
    }

    const now = new Date();
    if (new Date(expiration) <= now) {
      await exitSession(); // Se o tempo já expirou, encerra a sessão
      return;
    }
    sessionTimer.style.display = 'flex'; // Exibe o botão
    updateTimer(); // Atualiza o progresso visual imediatamente

    // Inicia o intervalo para atualização do timer
    sessionInterval = setInterval(updateTimer, 1000);
  }

  // Atualiza o progresso do timer
  async function updateTimer() {
    const expiration = new Date(localStorage.getItem('sessionExpiration'));
    const now = new Date();
    const remainingTime = expiration - now;

    // Atualiza o progresso visual
    const progress = Math.max((remainingTime / SESSION_TIME) * 100, 0);
    progressCircle.style.background = `linear-gradient(to top, 
    var(--color-2) ${progress}%, 
    var(--color-trans-2) ${progress}%
  )`;

    // Faz logout automático se o tempo acabar
    if (remainingTime <= 0) {
      document.getElementById('renew-session').classList.add('hidden');
      document.getElementById('exit-session').classList.add('hidden');
      userCheck();
    }
  }

  // Renova a sessão ao clicar no botão
  async function renewSession() {
    try {
      const response = await userSection();
      if (response.status === 200) {
        const level = response.level; // Supõe que a resposta contém o nível
        await openSession(level); // Renova o tempo da sessão
        updateTimer();
      } else if (response.status === 401) {
        await exitSession();
      }
    } catch (error) {
      console.error('Erro de conexão ao renovar sessão:', error);
    }
  }

  // Verifica o estado do usuário e inicializa o botão
  if (isUserLoggedIn()) {
    initializeSessionTimer();
  } else {
    sessionTimer.style.display = 'none'; // Oculta o botão se o usuário não estiver logado
  }

  // Adiciona o evento de clique ao botão de renovação
  renewButton.addEventListener('click', renewSession);

  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('menu');
  const submenuButtons = document.querySelectorAll('.submenu-btn');
  const toggleButtons = document.querySelectorAll('.toggle-button');
  const mainSections = document.querySelectorAll('.section-content');
  const bannerSection = document.querySelector('.banner');
  const labels = document.querySelectorAll('label[for]');

  function closeAllSubmenus() {
    const submenus = document.querySelectorAll('.submenu');
    submenus.forEach((submenu) => {
      submenu.parentElement.classList.remove('open');
      const icon = submenu.previousElementSibling.querySelector('.icon');
      if (icon) {
        icon.textContent = '+';
      }
    });
  }

  hamburger.addEventListener('click', () => {
    if (menu.classList.contains('show')) {
      closeAllSubmenus();
    }
    menu.classList.toggle('show');
  });

  submenuButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const parentItem = button.parentElement;
      const icon = button.querySelector('.icon');
      const isOpen = parentItem.classList.contains('open');

      closeAllSubmenus();

      if (!isOpen) {
        parentItem.classList.add('open');
        icon.textContent = '-';
      } else {
        parentItem.classList.remove('open');
        icon.textContent = '+';
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (
      !menu.contains(event.target) &&
      !hamburger.contains(event.target) &&
      menu.classList.contains('show')
    ) {
      closeAllSubmenus();
      menu.classList.remove('show');
    }
  });

  async function openModals() {
    if (session === 'Secretário' || session === 'Gestor') {
      await listRequestModal();
    }
    if (session === 'Técnico') {
      await showModalServicesList();
    }
  }

  await openModals();
});
