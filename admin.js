// ============================================================
// PANDA CARD — ADMIN.JS (Role-aware)
// Owner: solforeyx@gmail.com — full access, no password
// Staff: staff@gmail.com — Treasury, Withdrawals, Cards only
// ============================================================

const SUPABASE_URL = 'https://dxxhlaxdudtiktplwvbq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4eGhsYXhkdWR0aWt0cGx3dmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIzNDUzNzIsImV4cCI6MjEwNzkyMTM3Mn0.tSFal0bYl1jO-EMjwq_9A0KLfD0YLLqO0F7kgXeZ2aI';

const ROLE_MAP = {
  'solforeyx@gmail.com': 'owner',
  'staff@gmail.com': 'staff'
};

const ALLOWED_PAGES = {
  'owner': ['index.html', 'money.html', 'withdrawals.html', 'upload-card.html', 'users.html', 'announcements.html', 'config.html'],
  'staff': ['index.html', 'money.html', 'withdrawals.html', 'upload-card.html']
};

let sbClient = null;
let currentRole = null;

document.addEventListener('DOMContentLoaded', () => {
  sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.sbClient = sbClient;

  sbClient.auth.onAuthStateChange(async (event, session) => {
    if (!session || !session.user) {
      currentRole = null;
      showLogin();
      return;
    }

    const email = (session.user.email || '').toLowerCase();
    const role = ROLE_MAP[email];

    if (!role) {
      showToast('Access Denied: Not an admin account.', 'error');
      await sbClient.auth.signOut();
      return;
    }

    currentRole = role;
    window.currentRole = role;

    // Page-level guard: staff cannot open owner-only pages
    const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const allowed = ALLOWED_PAGES[role] || [];
    if (!allowed.includes(page)) {
      window.location.href = 'index.html';
      return;
    }

    applyRoleUI();
    showDashboard(session.user);

    if (typeof window.loadPageData === 'function') {
      try { window.loadPageData(); } catch (e) { console.error(e); }
    }
  });
});

function applyRoleUI() {
  // Hide nav links the current role cannot access
  document.querySelectorAll('[data-roles]').forEach(el => {
    const roles = (el.getAttribute('data-roles') || '').split(',').map(s => s.trim());
    if (roles.includes(currentRole)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });
}

function showLogin() {
  document.querySelectorAll('.login-screen').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.app-layout').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.admin-dashboard').forEach(el => el.classList.add('hidden'));
}

function showDashboard(user) {
  document.querySelectorAll('.login-screen').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.app-layout').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.admin-dashboard').forEach(el => el.classList.remove('hidden'));
  document.querySelectorAll('.current-admin-email').forEach(el => {
    el.textContent = user.email;
  });
}

async function adminLogin() {
  const emailEl = document.getElementById('adminEmail');
  const passwordEl = document.getElementById('adminPassword');
  const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
  const password = passwordEl ? passwordEl.value : '';

  if (!email || !password) {
    return showToast('Email and password are required.', 'error');
  }
  if (!ROLE_MAP[email]) {
    return showToast('Access Denied: Not an admin account.', 'error');
  }

  const { error } = await sbClient.auth.signInWithPassword({ email, password });
  if (error) {
    return showToast('Login Failed: ' + error.message, 'error');
  }
  // onAuthStateChange handles the rest.
}

async function adminLogout() {
  await sbClient.auth.signOut();
}

// Back button: direct navigation for both roles. Roles handle security.
function goToDashboard() {
  window.location.href = 'index.html';
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#10B981' : '#FFD700';
  const fg = type === 'info' ? '#000' : '#fff';
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 12px 18px; border-radius: 8px; font-size: 13px;
    font-weight: 600; color: ${fg}; background: ${bg};
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    max-width: 320px; opacity: 0;
    transition: opacity 0.2s ease;
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

function formatMoney(amount) {
  const n = Number(amount || 0);
  return '₦' + n.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-NG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.adminLogin = adminLogin;
window.adminLogout = adminLogout;
window.goToDashboard = goToDashboard;
window.showToast = showToast;
window.formatMoney = formatMoney;
window.formatDate = formatDate;
window.escapeHTML = escapeHTML;