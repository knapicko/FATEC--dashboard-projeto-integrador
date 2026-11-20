// Login da landing page do ConsertaJá.
// Usa o mesmo projeto Supabase (e a mesma sessão salva no navegador) do dashboard:
// quem entra aqui já chega logado em /dashboard/, e vice-versa.
// A autorização segue a mesma regra do dashboard: só contas presentes em public.admin_users.
import { createClient } from '@supabase/supabase-js';

const env = import.meta.env || {};
const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const $ = (id) => document.getElementById(id);
const loginBtn = $('loginBtn');
const dashBtn = $('dashBtn');
const avatarBtn = $('avatarBtn');
const avatarInitial = $('avatarInitial');
const acctMenu = $('acctMenu');
const acctEmail = $('acctEmail');
const logoutBtn = $('logoutBtn');
const modal = $('authModal');
const card = modal.querySelector('.auth-card');
const form = $('authForm');
const emailInput = $('authEmail');
const passInput = $('authPass');
const errBox = $('authErr');
const submitBtn = $('authSubmit');
const eyeBtn = $('eyeBtn');
const toastEl = $('toast');
const toastText = $('toastText');

let session = null;
let authorized = false;
let lastFocus = null;
let toastTimer = 0;
let checkSeq = 0;

function displayError(error) {
  return error instanceof Error ? error.message : String(error?.message ?? error);
}

async function isAdmin(userId) {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`Não foi possível verificar o cadastro administrativo. Detalhe: ${error.message}`);
  return Boolean(data);
}

function render({ animate = false } = {}) {
  const logged = Boolean(session && authorized);
  loginBtn.hidden = logged;
  avatarBtn.hidden = !logged;
  dashBtn.hidden = !logged;
  if (!logged) closeMenu();
  if (logged) {
    const email = session.user.email ?? '';
    acctEmail.textContent = email;
    avatarInitial.textContent = (email.trim()[0] || 'A').toUpperCase();
    if (animate) {
      dashBtn.classList.remove('pop');
      void dashBtn.offsetWidth;
      dashBtn.classList.add('pop');
    }
  }
}

async function syncSession(nextSession, opts) {
  const seq = ++checkSeq;
  session = nextSession;
  if (!nextSession) {
    authorized = false;
    render();
    return;
  }
  try {
    const ok = await isAdmin(nextSession.user.id);
    if (seq !== checkSeq) return;
    authorized = ok;
  } catch {
    if (seq !== checkSeq) return;
    authorized = false;
  }
  render(opts);
}

/* ---------- modal ---------- */
function openModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  modal.classList.remove('closing');
  card.classList.remove('ready', 'shake');
  document.body.style.overflow = 'hidden';
  errBox.hidden = true;
  if (!supabase) {
    showError('Login indisponível: configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local.', false);
    submitBtn.disabled = true;
  }
  setTimeout(() => emailInput.focus(), 60);
}

function closeModal() {
  if (modal.hidden || modal.classList.contains('closing')) return;
  modal.classList.add('closing');
  setTimeout(() => {
    modal.hidden = true;
    modal.classList.remove('closing');
    document.body.style.overflow = '';
    passInput.value = '';
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }, 280);
}

function showError(message, shake = true) {
  errBox.textContent = message;
  errBox.hidden = false;
  if (shake) {
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }
}

function setBusy(busy) {
  submitBtn.disabled = busy;
  submitBtn.classList.toggle('busy', busy);
  submitBtn.querySelector('span').textContent = busy ? 'Entrando…' : 'Entrar';
}

function toast(message) {
  toastText.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 3800);
}

/* ---------- menu da conta ---------- */
function openMenu() { acctMenu.hidden = false; avatarBtn.setAttribute('aria-expanded', 'true'); }
function closeMenu() { acctMenu.hidden = true; avatarBtn.setAttribute('aria-expanded', 'false'); }

/* ---------- eventos ---------- */
loginBtn.addEventListener('click', openModal);
modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
card.addEventListener('animationend', (e) => {
  if (e.animationName === 'cardIn') card.classList.add('ready');
  if (e.animationName === 'shake') card.classList.remove('shake');
});

eyeBtn.addEventListener('click', () => {
  const show = passInput.type === 'password';
  passInput.type = show ? 'text' : 'password';
  eyeBtn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
  eyeBtn.querySelector('use').setAttribute('href', show ? '#i-eyeoff' : '#i-eye');
});

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if (acctMenu.hidden) openMenu(); else closeMenu();
});
document.addEventListener('click', (e) => { if (!acctMenu.hidden && !acctMenu.contains(e.target)) closeMenu(); });
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  closeMenu();
  closeModal();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!supabase) return;
  const email = emailInput.value.trim();
  const password = passInput.value;
  if (!email || !password) {
    showError('Informe e-mail e senha.');
    return;
  }
  errBox.hidden = true;
  setBusy(true);
  checkSeq++; // evita que o listener de sessão sobrescreva este fluxo
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const ok = await isAdmin(data.session.user.id);
    if (!ok) {
      await supabase.auth.signOut();
      session = null;
      authorized = false;
      render();
      showError('Esta conta não está autorizada a acessar o painel. Confira o cadastro em public.admin_users.');
      return;
    }
    session = data.session;
    authorized = true;
    closeModal();
    render({ animate: true });
    toast('Login realizado! Acesse o painel pelo botão ao lado.');
  } catch (error) {
    showError(`Não foi possível entrar: ${displayError(error)}`);
  } finally {
    setBusy(false);
  }
});

logoutBtn.addEventListener('click', async () => {
  closeMenu();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    toast(`Não foi possível sair da conta: ${error.message}`);
    return;
  }
  session = null;
  authorized = false;
  render();
  toast('Você saiu da conta.');
});

/* ---------- sessão ---------- */
if (supabase) {
  supabase.auth.getSession()
    .then(({ data }) => syncSession(data.session))
    .catch(() => syncSession(null));

  // Mantém a landing sincronizada com login/logout feito no dashboard (outra aba) ou expiração da sessão.
  // As chamadas ao Supabase ficam fora do callback, como recomenda a documentação do supabase-js.
  supabase.auth.onAuthStateChange((event, nextSession) => {
    if (event === 'INITIAL_SESSION') return;
    if (event === 'SIGNED_IN' && session && nextSession && session.user.id === nextSession.user.id) {
      session = nextSession;
      return;
    }
    setTimeout(() => void syncSession(nextSession), 0);
  });
}
