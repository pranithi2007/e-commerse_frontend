/**
 * Admin Order Management Script with DFA Transition Console
 */

let allOrders = [];
let activeOrderForTransition = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminOrders();

  // Search input handler
  const searchInput = document.getElementById('adminOrderSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      filterAndRenderOrders();
    });
  }
});

async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm me-2"></div>Loading orders...</td></tr>';

  try {
    const res = await fetch('/api/admin/orders');
    const data = await res.json();

    if (data.success && Array.isArray(data.orders)) {
      allOrders = data.orders;
      filterAndRenderOrders();
    } else {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${data.error || 'Failed to load orders.'}</td></tr>`;
    }
  } catch (err) {
    console.error('Error loading admin orders:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error loading orders. Please check your admin privileges.</td></tr>';
  }
}

let activeFilterState = 'ALL';

function setFilterState(state) {
  activeFilterState = state;
  // Update button active state
  document.querySelectorAll('.filter-state-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-state') === state);
  });
  filterAndRenderOrders();
}

function filterAndRenderOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  const searchVal = document.getElementById('adminOrderSearch')?.value.trim().toLowerCase() || '';

  let filtered = allOrders;

  if (activeFilterState !== 'ALL') {
    filtered = filtered.filter(o => o.currentState === activeFilterState);
  }

  if (searchVal) {
    filtered = filtered.filter(o => 
      o.orderNumber.toLowerCase().includes(searchVal) ||
      (o.customer?.name && o.customer.name.toLowerCase().includes(searchVal)) ||
      (o.customer?.email && o.customer.email.toLowerCase().includes(searchVal))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No orders match the selected criteria.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(order => {
    const isTerminal = order.currentState === 'S5' || order.currentState === 'S6';
    const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const badgeClasses = {
      S0: 'bg-primary',
      S1: 'bg-info text-dark',
      S2: 'bg-warning text-dark',
      S3: 'bg-secondary',
      S4: 'bg-indigo text-white',
      S5: 'bg-success',
      S6: 'bg-danger'
    };

    const badgeClass = badgeClasses[order.currentState] || 'bg-primary';

    return `
      <tr class="align-middle">
        <td>
          <a href="/track/${order.orderNumber}" class="fw-bold text-decoration-none text-primary" target="_blank">
            ${escapeHtml(order.orderNumber)}
          </a>
        </td>
        <td>
          <div class="fw-semibold">${escapeHtml(order.customer?.name || 'Customer')}</div>
          <small class="text-muted">${escapeHtml(order.customer?.email || '')}</small>
        </td>
        <td>
          <small class="text-muted">${dateFormatted}</small>
        </td>
        <td>
          <span class="badge ${badgeClass} px-2 py-1 fs-7">
            [${order.currentState}] ${escapeHtml(order.currentStateLabel)}
          </span>
          ${isTerminal ? '<small class="d-block text-secondary" style="font-size: 0.7rem;">(Terminal)</small>' : ''}
        </td>
        <td class="fw-bold">$${order.totalAmount.toFixed(2)}</td>
        <td>
          <span class="badge bg-light text-dark border">
            ${order.items ? order.items.length : 0} item(s)
          </span>
        </td>
        <td class="text-end">
          <div class="btn-group">
            <button class="btn btn-sm btn-primary d-flex align-items-center gap-1" onclick="openDfaTransitionModal('${order._id || order.id}')">
              <i class="bi bi-diagram-3"></i> DFA Transition
            </button>
            <a href="/track/${order.orderNumber}" class="btn btn-sm btn-outline-secondary" target="_blank" title="View Tracking">
              <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openDfaTransitionModal(orderId) {
  const order = allOrders.find(o => (o._id || o.id) === orderId);
  if (!order) return;

  activeOrderForTransition = order;

  // Set modal header details
  document.getElementById('modalOrderNumber').textContent = order.orderNumber;
  document.getElementById('modalCurrentState').textContent = `[${order.currentState}] ${order.currentStateLabel}`;
  document.getElementById('modalCurrentState').className = `badge bg-${order.currentState === 'S5' ? 'success' : order.currentState === 'S6' ? 'danger' : 'primary'} fs-6 px-3 py-2`;

  // Clear previous alerts
  document.getElementById('dfaTransitionAlert').style.display = 'none';

  // Render valid DFA transitions
  renderValidTransitionButtons(order);

  // Render audit history in modal
  renderModalAuditHistory(order.history || []);

  const modalEl = document.getElementById('dfaTransitionModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function renderValidTransitionButtons(order) {
  const validContainer = document.getElementById('validTransitionsContainer');
  const terminalNotice = document.getElementById('terminalStateNotice');
  const invalidTestSection = document.getElementById('invalidTestSection');

  if (!validContainer) return;

  const isTerminal = order.currentState === 'S5' || order.currentState === 'S6';

  if (isTerminal) {
    validContainer.style.display = 'none';
    if (terminalNotice) {
      terminalNotice.style.display = 'block';
      terminalNotice.innerHTML = `
        <div class="alert alert-warning d-flex align-items-center gap-2 mb-0">
          <i class="bi bi-shield-lock-fill fs-4 text-warning"></i>
          <div>
            <strong>Terminal Absorbing State (${order.currentState})</strong><br>
            Delivered orders (S5) and Cancelled orders (S6) cannot be modified under DFA rules. No further transitions are permitted.
          </div>
        </div>
      `;
    }
    if (invalidTestSection) invalidTestSection.style.display = 'block';
    return;
  }

  if (terminalNotice) terminalNotice.style.display = 'none';
  validContainer.style.display = 'block';
  if (invalidTestSection) invalidTestSection.style.display = 'block';

  // Fetch valid next transitions from client validator or order property
  const validTransitions = window.DFAOrderValidator 
    ? window.DFAOrderValidator.getValidNextTransitions(order.currentState)
    : (order.validNextTransitions || []);

  if (validTransitions.length === 0) {
    validContainer.innerHTML = '<p class="text-muted">No valid transitions available.</p>';
    return;
  }

  validContainer.innerHTML = `
    <h6 class="fw-bold text-dark mb-2">Valid Next Transitions Allowed by DFA &delta;(${order.currentState}, input):</h6>
    <div class="d-flex flex-wrap gap-2 mb-3">
      ${validTransitions.map(tr => {
        const isCancel = tr.targetState === 'S6';
        const btnClass = isCancel ? 'btn-outline-danger' : 'btn-success';
        return `
          <button class="btn ${btnClass} d-flex align-items-center gap-2 py-2 px-3 shadow-sm" onclick="executeDfaTransition('${tr.targetState}', '${tr.action}', '${escapeHtml(tr.actionLabel)}')">
            <i class="bi ${tr.icon || 'bi-arrow-right-circle'}"></i>
            <span><strong>${tr.actionLabel}</strong> &rarr; [${tr.targetState}] ${tr.targetLabel}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

async function executeDfaTransition(targetState, action, actionLabel) {
  if (!activeOrderForTransition) return;

  const noteInput = document.getElementById('transitionNoteInput');
  const note = noteInput ? noteInput.value.trim() : '';

  const alertBox = document.getElementById('dfaTransitionAlert');

  try {
    const res = await fetch(`/api/admin/orders/${activeOrderForTransition._id || activeOrderForTransition.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetState, action, note })
    });
    const data = await res.json();

    if (data.success) {
      if (alertBox) {
        alertBox.className = 'alert alert-success d-flex align-items-center gap-2 mb-3';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <i class="bi bi-check-circle-fill fs-4 text-success"></i>
          <div>
            <strong>DFA Transition Succeeded!</strong><br>
            ${data.message}
          </div>
        `;
      }
      showToast(data.message, 'success');

      // Update active order and reload
      activeOrderForTransition = data.order;
      if (noteInput) noteInput.value = '';

      // Update in memory array
      const idx = allOrders.findIndex(o => (o._id || o.id) === (data.order._id || data.order.id));
      if (idx > -1) allOrders[idx] = data.order;

      // Re-render modal states and table
      document.getElementById('modalCurrentState').textContent = `[${data.order.currentState}] ${data.order.currentStateLabel}`;
      document.getElementById('modalCurrentState').className = `badge bg-${data.order.currentState === 'S5' ? 'success' : data.order.currentState === 'S6' ? 'danger' : 'primary'} fs-6 px-3 py-2`;
      renderValidTransitionButtons(data.order);
      renderModalAuditHistory(data.order.history || []);
      filterAndRenderOrders();
    } else {
      if (alertBox) {
        alertBox.className = 'alert alert-danger d-flex align-items-center gap-2 mb-3';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <i class="bi bi-exclamation-triangle-fill fs-4 text-danger"></i>
          <div>
            <strong>DFA Rule Violation (Transition Rejected)</strong><br>
            ${data.error}
          </div>
        `;
      }
      showToast(data.error, 'error');
    }
  } catch (err) {
    showToast('Network error during transition execution', 'error');
  }
}

// Deliberate Invalid Transition Test Function
async function testDfaRejection() {
  if (!activeOrderForTransition) return;

  const targetSelect = document.getElementById('testInvalidStateSelect');
  const invalidTarget = targetSelect ? targetSelect.value : 'S5';
  const alertBox = document.getElementById('dfaTransitionAlert');

  try {
    const res = await fetch(`/api/admin/orders/${activeOrderForTransition._id || activeOrderForTransition.id}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetState: invalidTarget, note: 'Admin deliberate invalid transition test' })
    });
    const data = await res.json();

    if (!data.success && data.isDfaViolation) {
      // Correct behavior! DFA blocked the illegal transition
      if (alertBox) {
        alertBox.className = 'alert alert-danger d-flex align-items-start gap-2 mb-3';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <i class="bi bi-shield-x fs-4 text-danger mt-1"></i>
          <div>
            <strong class="text-danger">DFA Engine Blocked Illegal Transition (Test Passed):</strong><br>
            <code>${escapeHtml(data.error)}</code>
            <div class="mt-2 text-muted small">
              The Deterministic Finite Automaton strictly verified that &delta;(${data.currentState}, ${data.targetRequested}) is undefined. 
              The order state remains protected in <strong>[${data.currentState}] ${data.currentStateLabel}</strong>.
            </div>
          </div>
        `;
      }
      showToast('DFA successfully blocked illegal transition!', 'warning');
    } else if (data.success) {
      if (alertBox) {
        alertBox.className = 'alert alert-info d-flex align-items-center gap-2 mb-3';
        alertBox.style.display = 'flex';
        alertBox.innerHTML = `
          <i class="bi bi-info-circle-fill fs-4"></i>
          <div>
            <strong>Notice:</strong> This transition was actually valid under DFA rules!
          </div>
        `;
      }
      await loadAdminOrders();
    }
  } catch (err) {
    showToast('Error during DFA test', 'error');
  }
}

function renderModalAuditHistory(history) {
  const container = document.getElementById('modalAuditHistoryContainer');
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = '<p class="text-muted small">No transitions logged.</p>';
    return;
  }

  container.innerHTML = `
    <table class="table table-sm table-bordered mt-2" style="font-size: 0.8rem;">
      <thead class="table-light">
        <tr>
          <th>Timestamp</th>
          <th>Transition</th>
          <th>Action</th>
          <th>Operator</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        ${history.map(item => `
          <tr>
            <td>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
            <td><span class="badge bg-secondary">${item.fromState}</span> &rarr; <span class="badge bg-primary">${item.toState}</span></td>
            <td><strong>${escapeHtml(item.actionLabel || item.action)}</strong></td>
            <td>${escapeHtml(item.changedBy)}</td>
            <td class="text-truncate" style="max-width: 200px;">${escapeHtml(item.note)}</td>
          </tr>
        `).reverse().join('')}
      </tbody>
    </table>
  `;
}
