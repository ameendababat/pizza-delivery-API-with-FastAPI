const API_BASE = 'http://localhost:8000';

const state = {
  token: localStorage.getItem('token') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  username: localStorage.getItem('username') || null,
  isStaff: localStorage.getItem('isStaff') === 'true',
};

let refreshInterval = null;

// ── API ──
function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  const res = await fetch(apiUrl(path), { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

// ── Toast System ──
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── Loading Overlay ──
function showLoading() {
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ── Custom Confirm ──
function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    const titleEl = document.getElementById('confirm-title');
    modal.classList.remove('hidden');
    msgEl.textContent = message;
    titleEl.textContent = '⚠️ Confirm';

    function cleanup(result) {
      modal.classList.add('hidden');
      document.getElementById('confirm-ok').onclick = null;
      document.getElementById('confirm-cancel').onclick = null;
      document.getElementById('confirm-close').onclick = null;
      resolve(result);
    }

    document.getElementById('confirm-ok').onclick = () => cleanup(true);
    document.getElementById('confirm-cancel').onclick = () => cleanup(false);
    document.getElementById('confirm-close').onclick = () => cleanup(false);
    modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
  });
}

// ── Ripple Effect ──
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
  ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ── Auth ──
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (!username || !password) {
    errEl.textContent = 'Please fill in all fields';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.classList.add('btn-loading');
  btn.textContent = 'Logging in...';

  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    state.token = data.access_token;
    state.refreshToken = data.refresh_token;
    state.username = username;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);
    localStorage.setItem('username', username);
    await fetchUserInfo();
    showDashboard();
    showToast('Welcome back!', 'success');
  } catch (err) {
    errEl.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Login';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const username = document.getElementById('signup-username').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const isStaff = document.getElementById('signup-staff').checked;
  const errEl = document.getElementById('signup-error');
  errEl.textContent = '';

  if (!username || !email || !password) {
    errEl.textContent = 'Please fill in all fields';
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Password must be at least 6 characters';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.classList.add('btn-loading');
  btn.textContent = 'Creating account...';

  try {
    await api('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, is_staff: isStaff, is_active: true }),
    });
    document.getElementById('login-username').value = username;
    document.getElementById('login-password').value = password;
    switchTab('login');
    document.getElementById('signup-form').reset();
    showToast('Account created! Please log in.', 'success');
  } catch (err) {
    errEl.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Sign Up';
  }
}

async function fetchUserInfo() {
  try {
    const payload = JSON.parse(atob(state.token.split('.')[1]));
    state.isStaff = payload.is_staff || false;
    localStorage.setItem('isStaff', state.isStaff);
  } catch { }
}

// ── UI ──
function showDashboard() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('dashboard-section').classList.remove('hidden');
  document.getElementById('user-badge').innerHTML =
    `👤 ${state.username}${state.isStaff ? ' <span style="color:var(--warning)">(Staff)</span>' : ''}`;
  document.getElementById('admin-btn').classList.toggle('hidden', !state.isStaff);
  loadMyOrders();
  startAutoRefresh();
}

function showAuth() {
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('dashboard-section').classList.add('hidden');
  stopAutoRefresh();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`${tab}-form`).classList.add('active');
  document.getElementById('login-error').textContent = '';
  document.getElementById('signup-error').textContent = '';
}

function switchView(view) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(`view-${view}`);
  target.classList.add('active');
  target.style.animation = 'none';
  requestAnimationFrame(() => {
    target.style.animation = 'fadeSlideUp 0.35s ease';
  });
}

// ── Auto Refresh ──
function startAutoRefresh() {
  stopAutoRefresh();
  refreshInterval = setInterval(() => {
    const activeView = document.querySelector('.view.active');
    if (activeView) {
      if (activeView.id === 'view-my-orders') loadMyOrders(true);
      if (activeView.id === 'view-admin') loadAdminOrders(true);
    }
  }, 15000);
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// ── Orders ──
async function loadMyOrders(silent) {
  const el = document.getElementById('orders-list');
  if (!silent) {
    el.innerHTML = '<div class="loading-content"><div class="spinner"></div><p class="loading">Loading orders...</p></div>';
  }
  try {
    const orders = await api('/orders/user/orders');
    renderOrders(orders, el, false);
  } catch (err) {
    if (!silent) {
      el.innerHTML = `<p class="error-msg">${err.message}</p>`;
      showToast(err.message, 'error');
    }
  }
}

async function loadAdminOrders(silent) {
  const el = document.getElementById('admin-orders-list');
  if (!silent) {
    el.innerHTML = '<div class="loading-content"><div class="spinner"></div><p class="loading">Loading all orders...</p></div>';
  }
  try {
    const orders = await api('/orders/orders');
    renderOrders(orders, el, true);
  } catch (err) {
    if (!silent) {
      el.innerHTML = `<p class="error-msg">${err.message}</p>`;
      showToast(err.message, 'error');
    }
  }
}

function renderOrders(orders, container, admin) {
  if (!orders || orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <h3>No orders yet</h3>
        <p>Place your first pizza order to get started!</p>
      </div>`;
    return;
  }
  container.innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="info">
        <h4>🍕 ${o.pizza_size} Pizza &times; ${o.quantity}</h4>
        <p>Order #${String(o.id).slice(0, 8)}&hellip; &middot; <span class="status status-${o.order_status}">${o.order_status}</span></p>
      </div>
      <div class="order-actions">
        <button class="btn btn-sm btn-view" onclick="viewOrder('${o.id}')">👁 View</button>
        ${admin ? `
          <select onchange="updateStatus('${o.id}', this.value)">
            <option value="">Set status</option>
            <option value="PENDING">Pending</option>
            <option value="IN-TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        ` : `
          <button class="btn btn-sm btn-edit" onclick="viewOrder('${o.id}')">✏️ Edit</button>
        `}
        <button class="btn btn-sm btn-delete" onclick="deleteOrder('${o.id}')">🗑 Delete</button>
      </div>
    </div>
  `).join('');
}

async function handleNewOrder(e) {
  e.preventDefault();
  const size = document.getElementById('order-size').value;
  const quantity = parseInt(document.getElementById('order-quantity').value);
  const errEl = document.getElementById('order-error');
  const successEl = document.getElementById('order-success');
  errEl.textContent = '';
  successEl.textContent = '';

  if (!quantity || quantity < 1) {
    errEl.textContent = 'Quantity must be at least 1';
    return;
  }

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.classList.add('btn-loading');
  btn.textContent = 'Placing order...';

  try {
    await api('/orders/order', {
      method: 'POST',
      body: JSON.stringify({ pizza_size: size, quantity }),
    });
    successEl.textContent = 'Order placed successfully!';
    document.getElementById('order-form').reset();
    document.getElementById('order-quantity').value = 1;
    showToast('🎉 Order placed successfully!', 'success');
    setTimeout(() => { switchView('my-orders'); loadMyOrders(); }, 600);
  } catch (err) {
    errEl.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    btn.textContent = 'Place Order';
  }
}

async function updateStatus(id, status) {
  if (!status) return;
  showLoading();
  try {
    await api(`/orders/order/update/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ order_status: status }),
    });
    showToast(`Order status updated to ${status}`, 'success');
    loadAdminOrders();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function deleteOrder(id) {
  const confirmed = await showConfirm('Are you sure you want to delete this order?');
  if (!confirmed) return;
  showLoading();
  try {
    await api(`/orders/order/delete/${id}`, { method: 'DELETE' });
    showToast('Order deleted', 'success');
    loadMyOrders();
    if (state.isStaff) loadAdminOrders();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function viewOrder(id) {
  const modal = document.getElementById('order-modal');
  const body = document.getElementById('modal-body');
  modal.classList.remove('hidden');
  showLoading();
  try {
    const order = await api(`/orders/user/order/${id}`);
    body.innerHTML = `
      <p><strong>ID:</strong> ${order.id}</p>
      <p><strong>Pizza Size:</strong> ${order.pizza_size}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Status:</strong> <span class="status status-${order.order_status}">${order.order_status}</span></p>
      <div class="modal-actions">
        <label>New size:
          <select id="modal-size">
            <option value="SMALL" ${order.pizza_size === 'SMALL' ? 'selected' : ''}>Small</option>
            <option value="MEDIUM" ${order.pizza_size === 'MEDIUM' ? 'selected' : ''}>Medium</option>
            <option value="LARGE" ${order.pizza_size === 'LARGE' ? 'selected' : ''}>Large</option>
          </select>
        </label>
        <label>Qty:
          <input type="number" id="modal-qty" value="${order.quantity}" min="1">
        </label>
      </div>
      <button onclick="saveEdit('${order.id}')" class="btn btn-success" style="width:100%;margin-top:1rem">💾 Save Changes</button>
    `;
  } catch (err) {
    body.innerHTML = `<p class="error-msg">${err.message}</p>`;
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

async function saveEdit(id) {
  const size = document.getElementById('modal-size').value;
  const qty = parseInt(document.getElementById('modal-qty').value);
  if (!qty || qty < 1) {
    showToast('Quantity must be at least 1', 'error');
    return;
  }
  showLoading();
  try {
    await api(`/orders/orders/order/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ pizza_size: size, quantity: qty }),
    });
    closeModal();
    showToast('Order updated!', 'success');
    loadMyOrders();
    if (state.isStaff) loadAdminOrders();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    hideLoading();
  }
}

function closeModal() {
  document.getElementById('order-modal').classList.add('hidden');
}

// ── Event Listeners ──
document.addEventListener('DOMContentLoaded', () => {
  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Forms
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('signup-form').addEventListener('submit', handleSignup);
  document.getElementById('order-form').addEventListener('submit', handleNewOrder);

  // Ripple on all buttons
  document.querySelectorAll('button:not(.close-modal):not(.tab)').forEach(btn => {
    btn.addEventListener('click', addRipple);
  });

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
      if (btn.dataset.view === 'my-orders') loadMyOrders();
      if (btn.dataset.view === 'admin') loadAdminOrders();
      if (btn.dataset.view === 'new-order') {
        document.getElementById('order-error').textContent = '';
        document.getElementById('order-success').textContent = '';
      }
    });
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    const confirmed = await showConfirm('Are you sure you want to logout?');
    if (!confirmed) return;
    state.token = null;
    state.refreshToken = null;
    state.username = null;
    state.isStaff = false;
    localStorage.clear();
    showAuth();
    showToast('Logged out', 'info');
  });

  // Modal close
  document.querySelectorAll('.close-modal').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.getElementById('order-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.getElementById('confirm-modal').classList.add('hidden');
    }
  });

  // Check if already logged in
  if (state.token) {
    showLoading();
    fetchUserInfo().then(() => {
      showDashboard();
    }).catch(() => {
      localStorage.clear();
      showAuth();
    }).finally(() => {
      hideLoading();
    });
  }
});
