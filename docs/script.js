const menuButton = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const toast = document.querySelector('.toast');
let toastTimer;

/** Exibe uma confirmação breve na interface. */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, 1800);
}

/** Oculta a confirmação de cópia. */
function hideToast() {
  toast.classList.remove('visible');
}

/** Copia um comando para a área de transferência. */
async function copyCommand(button) {
  const command = button.dataset.copy;
  if (!command) return;

  try {
    await navigator.clipboard.writeText(command);
    showToast('Comando copiado.');
  } catch {
    showToast('Selecione e copie o comando.');
  }
}

/** Trata cliques no botão de cópia. */
function onCopyClick(event) {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return;
  void copyCommand(event.currentTarget);
}

/** Abre ou fecha o menu de navegação para telas estreitas. */
function toggleMenu() {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  siteNav.classList.toggle('open', !isOpen);
}

/** Fecha o menu após navegar para uma seção em telas estreitas. */
function onNavigationClick(event) {
  if (!(event.target instanceof HTMLAnchorElement) || window.innerWidth > 700) return;
  menuButton.setAttribute('aria-expanded', 'false');
  siteNav.classList.remove('open');
}

if (menuButton && siteNav) {
  menuButton.addEventListener('click', toggleMenu);
  siteNav.addEventListener('click', onNavigationClick);
}

/** Liga os botões de cópia aos comandos exibidos na página. */
function registerCopyButtons() {
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', onCopyClick);
  }
}

/** Alterna os exemplos para refletir se o projeto gerado inclui PostgreSQL. */
function onConfigTabClick(event) {
  if (!(event.currentTarget instanceof HTMLButtonElement)) return;
  const selectedConfig = event.currentTarget.dataset.configTab;
  if (!selectedConfig) return;

  for (const button of document.querySelectorAll('[data-config-tab]')) {
    const isSelected = button === event.currentTarget;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  }
  for (const panel of document.querySelectorAll('[data-config-panel]')) {
    const isVisible = panel.dataset.configPanel === selectedConfig;
    panel.hidden = !isVisible;
    panel.setAttribute('aria-hidden', String(!isVisible));
  }
}

/** Liga o seletor de configuração aos exemplos correspondentes. */
function registerConfigTabs() {
  for (const button of document.querySelectorAll('[data-config-tab]')) {
    button.addEventListener('click', onConfigTabClick);
  }
}

registerCopyButtons();
registerConfigTabs();
