/**
 * Global App Script
 * Manages user session state, navbar rendering, cart badge, and notification toasts.
 */

let currentUser = null;

// Initialize app on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await updateCartBadge();
});

// Check authentication
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      renderNavbarUser(data.user);
    } else {
      currentUser = null;
      renderNavbarGuest();
    }
  } catch (err) {
    console.warn('Auth check error:', err);
    renderNavbarGuest();
  }
}

// Render Navbar for logged in user
function renderNavbarUser(user) {
  const container = document.getElementById('navAuthContainer');
  if (!container) return;

  const isAdmin = user.role === 'admin';

  container.innerHTML = `
    <li class="nav-item dropdown">
      <a class="nav-link dropdown-toggle d-flex align-items-center gap-2 fw-semibold" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        <span class="user-avatar-circle">${user.name.charAt(0).toUpperCase()}</span>
        <span>${escapeHtml(user.name)}</span>
        ${isAdmin ? '<span class="badge bg-danger ms-1" style="font-size: 0.65rem;">ADMIN</span>' : ''}
      </a>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
        <li><h6 class="dropdown-header text-truncate" style="max-width: 200px;">${escapeHtml(user.email)}</h6></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="/orders"><i class="bi bi-bag-check me-2 text-primary"></i>My Orders</a></li>
        <li><a class="dropdown-item" href="/track"><i class="bi bi-geo-alt me-2 text-primary"></i>Track Order</a></li>
        ${isAdmin ? `
          <li><hr class="dropdown-divider"></li>
          <li><h6 class="dropdown-header text-danger">Administration</h6></li>
          <li><a class="dropdown-item text-danger fw-semibold" href="/admin"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>
          <li><a class="dropdown-item" href="/admin/orders"><i class="bi bi-diagram-3 me-2 text-primary"></i>DFA Order Management</a></li>
          <li><a class="dropdown-item" href="/admin/products"><i class="bi bi-box-seam me-2 text-primary"></i>Product Catalog</a></li>
        ` : ''}
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item text-secondary" href="javascript:void(0)" onclick="handleLogout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
      </ul>
    </li>
  `;
}

// Render Navbar for guest
function renderNavbarGuest() {
  const container = document.getElementById('navAuthContainer');
  if (!container) return;

  container.innerHTML = `
    <li class="nav-item">
      <a class="nav-link btn btn-outline-primary btn-sm px-3 me-2" href="/login">Log In</a>
    </li>
    <li class="nav-item">
      <a class="btn btn-primary btn-sm px-3 text-white" href="/register">Sign Up</a>
    </li>
  `;
}

// Update Cart Badge
async function updateCartBadge() {
  try {
    const res = await fetch('/api/cart');
    const data = await res.json();
    if (data.success && data.cart) {
      const badge = document.getElementById('navCartBadge');
      if (badge) {
        const count = data.cart.totalItems || 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
      }
    }
  } catch (err) {
    console.warn('Cart count error:', err);
  }
}

// Handle Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Logged out successfully', 'info');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
}

// Toast Notification Utility
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  const bgClasses = {
    success: 'bg-success text-white',
    error: 'bg-danger text-white',
    warning: 'bg-warning text-dark',
    info: 'bg-primary text-white'
  };

  const icons = {
    success: 'bi-check-circle-fill',
    error: 'bi-exclamation-octagon-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill'
  };

  const toastId = 'toast_' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center ${bgClasses[type] || bgClasses.info} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icons[type] || icons.info} fs-5"></i>
          <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close ${type === 'warning' ? '' : 'btn-close-white'} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  const toastEl = document.getElementById(toastId);
  const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 });
  bsToast.show();

  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
