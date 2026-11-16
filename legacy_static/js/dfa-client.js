/**
 * Client-Side DFA Order Tracking & State Machine Visualizer
 */

let currentTrackingOrder = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if order ID is present in path e.g. /track/ORD-DFA-1001 or URL param ?id=
  const pathParts = window.location.pathname.split('/');
  let orderId = null;

  if (pathParts.length > 2 && pathParts[1] === 'track' && pathParts[2]) {
    orderId = pathParts[2];
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id') || urlParams.get('orderId');
  }

  if (orderId) {
    const searchInput = document.getElementById('trackingOrderIdInput');
    if (searchInput) searchInput.value = orderId;
    await fetchAndRenderTracking(orderId);
  }

  // Bind track search form
  const trackForm = document.getElementById('trackOrderForm');
  if (trackForm) {
    trackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const val = document.getElementById('trackingOrderIdInput').value.trim();
      if (val) {
        await fetchAndRenderTracking(val);
      }
    });
  }
});

async function fetchAndRenderTracking(orderId) {
  const loadingEl = document.getElementById('trackingLoading');
  const detailsEl = document.getElementById('trackingDetailsContainer');
  const notFoundEl = document.getElementById('trackingNotFound');

  if (loadingEl) loadingEl.style.display = 'block';
  if (detailsEl) detailsEl.style.display = 'none';
  if (notFoundEl) notFoundEl.style.display = 'none';

  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    const data = await res.json();

    if (loadingEl) loadingEl.style.display = 'none';

    if (data.success && data.order) {
      currentTrackingOrder = data.order;
      if (detailsEl) detailsEl.style.display = 'block';
      renderOrderTracking(data.order);
    } else {
      if (notFoundEl) {
        notFoundEl.style.display = 'block';
        const msg = notFoundEl.querySelector('.not-found-message');
        if (msg) msg.textContent = data.error || `Order "${orderId}" could not be found.`;
      }
    }
  } catch (err) {
    console.error('Tracking fetch error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (notFoundEl) notFoundEl.style.display = 'block';
  }
}

function renderOrderTracking(order) {
  // Basic Info
  const orderNumEl = document.getElementById('trackOrderNumber');
  const orderDateEl = document.getElementById('trackOrderDate');
  const orderTotalEl = document.getElementById('trackOrderTotal');
  const customerNameEl = document.getElementById('trackCustomerName');
  const addressEl = document.getElementById('trackShippingAddress');

  if (orderNumEl) orderNumEl.textContent = order.orderNumber;
  if (orderDateEl) orderDateEl.textContent = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  if (orderTotalEl) orderTotalEl.textContent = `$${order.totalAmount.toFixed(2)}`;
  if (customerNameEl) customerNameEl.textContent = order.customer?.name || order.shippingAddress?.fullName;
  if (addressEl && order.shippingAddress) {
    addressEl.textContent = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}`;
  }

  // DFA State Stepper Visualization
  renderDfaStepper(order);

  // DFA State Machine Graph Nodes
  renderDfaGraph(order.currentState);

  // Audit History Timeline
  renderAuditTimeline(order.history || []);

  // Customer Cancel Button (only allowed if in S0 or S1)
  const cancelBtnContainer = document.getElementById('customerCancelContainer');
  if (cancelBtnContainer) {
    if (['S0', 'S1'].includes(order.currentState)) {
      cancelBtnContainer.innerHTML = `
        <button class="btn btn-outline-danger btn-sm" onclick="handleCustomerCancel('${order._id || order.id}')">
          <i class="bi bi-x-circle me-1"></i> Cancel Order (DFA S6 Transition)
        </button>
      `;
    } else {
      cancelBtnContainer.innerHTML = '';
    }
  }
}

function renderDfaStepper(order) {
  const currentState = order.currentState; // S0..S6
  const cancelledBanner = document.getElementById('cancelledBannerContainer');
  const normalStepperContainer = document.getElementById('normalStepperContainer');
  const progressLine = document.getElementById('stepperProgressLine');

  const stepOrder = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
  const currentIndex = stepOrder.indexOf(currentState);

  if (currentState === 'S6') {
    // Cancelled State: Show special Alert Banner
    if (cancelledBanner) {
      cancelledBanner.style.display = 'block';
      cancelledBanner.innerHTML = `
        <div class="dfa-cancelled-banner">
          <div class="dfa-cancelled-icon">
            <i class="bi bi-x-lg"></i>
          </div>
          <div>
            <h5 class="text-danger fw-bold mb-1">
              Order Cancelled (DFA State S6)
            </h5>
            <p class="mb-0 text-muted" style="font-size: 0.95rem;">
              This order reached the terminal state <strong>S6 – Cancelled</strong>. 
              In accordance with formal DFA rules, cancelled orders are absorbing and cannot be modified or resumed.
            </p>
          </div>
        </div>
      `;
    }
    // Dim the normal stepper
    if (normalStepperContainer) normalStepperContainer.style.opacity = '0.5';
    if (progressLine) progressLine.style.width = '0%';
  } else {
    if (cancelledBanner) cancelledBanner.style.display = 'none';
    if (normalStepperContainer) normalStepperContainer.style.opacity = '1';

    // Calculate progress line percentage: 0 to 100%
    const percentage = currentIndex >= 0 ? (currentIndex / (stepOrder.length - 1)) * 100 : 0;
    if (progressLine) progressLine.style.width = `${percentage}%`;

    // Update each step element
    stepOrder.forEach((stateId, idx) => {
      const stepEl = document.getElementById(`step-${stateId}`);
      if (!stepEl) return;

      stepEl.classList.remove('completed', 'active');
      const circleEl = stepEl.querySelector('.dfa-step-circle');

      if (idx < currentIndex) {
        stepEl.classList.add('completed');
        if (circleEl) circleEl.innerHTML = '<i class="bi bi-check-lg fs-5"></i>';
      } else if (idx === currentIndex) {
        stepEl.classList.add('active');
        if (circleEl) circleEl.innerHTML = `<span class="dfa-step-state-tag">${stateId}</span>`;
      } else {
        if (circleEl) circleEl.innerHTML = `<span class="dfa-step-state-tag">${stateId}</span>`;
      }
    });
  }

  // Update Current State Banner Info
  const stateMeta = window.DFAOrderValidator ? window.DFAOrderValidator.getStateMetadata(currentState) : null;
  const currentBadgeEl = document.getElementById('currentStateBadge');
  const currentDescEl = document.getElementById('currentStateDesc');

  if (currentBadgeEl && stateMeta) {
    currentBadgeEl.className = `badge ${stateMeta.badgeClass} fs-6 px-3 py-2`;
    currentBadgeEl.innerHTML = `<i class="bi ${stateMeta.icon} me-1"></i> [${stateMeta.id}] ${stateMeta.label}`;
  }
  if (currentDescEl && stateMeta) {
    currentDescEl.textContent = stateMeta.description;
  }
}

function renderDfaGraph(activeStateId) {
  const container = document.getElementById('dfaGraphContainer');
  if (!container || !window.DFAOrderValidator) return;

  const states = window.DFAOrderValidator.getAllStates();

  container.innerHTML = states.map(s => {
    const isCurrent = s.id === activeStateId;
    const isTerminal = s.isTerminal;

    return `
      <div class="dfa-node node-${s.id.toLowerCase()} ${isCurrent ? 'current-node' : ''} ${isTerminal ? 'terminal-node' : ''}">
        <div class="dfa-node-state">${s.id}</div>
        <div class="dfa-node-label">${escapeHtml(s.label)}</div>
        ${isCurrent ? '<span class="badge bg-primary position-absolute top-0 start-50 translate-middle" style="font-size: 0.65rem;">CURRENT</span>' : ''}
        ${isTerminal ? '<span class="badge bg-secondary position-absolute bottom-0 start-50 translate-middle-x mb-1" style="font-size: 0.6rem;">TERMINAL</span>' : ''}
      </div>
    `;
  }).join('');
}

function renderAuditTimeline(history) {
  const timelineEl = document.getElementById('dfaHistoryTimeline');
  if (!timelineEl) return;

  if (history.length === 0) {
    timelineEl.innerHTML = '<li class="text-muted">No state transition history recorded yet.</li>';
    return;
  }

  timelineEl.innerHTML = history.map(item => {
    const isDelivered = item.toState === 'S5';
    const isCancelled = item.toState === 'S6';
    let markerClass = '';
    if (isDelivered) markerClass = 'terminal';
    if (isCancelled) markerClass = 'cancelled';

    return `
      <li class="timeline-item">
        <div class="timeline-marker ${markerClass}"></div>
        <div class="timeline-content">
          <div class="timeline-title">
            <span>Transition: <strong>${escapeHtml(item.fromState)}</strong> &rarr; <strong>${escapeHtml(item.toState)}</strong></span>
            <span class="badge bg-light text-dark border ms-auto">${escapeHtml(item.actionLabel || item.action)}</span>
          </div>
          <p class="mb-1 text-secondary" style="font-size: 0.88rem;">${escapeHtml(item.note || 'Status transitioned successfully.')}</p>
          <div class="d-flex justify-content-between align-items-center mt-2 pt-1 border-top border-light">
            <small class="text-muted"><i class="bi bi-person me-1"></i>${escapeHtml(item.changedBy || 'System')}</small>
            <small class="timeline-time"><i class="bi bi-clock me-1"></i>${new Date(item.timestamp).toLocaleString()}</small>
          </div>
        </div>
      </li>
    `;
  }).reverse().join('');
}

async function handleCustomerCancel(orderId) {
  const reason = prompt('Please provide a reason for cancelling this order:');
  if (reason === null) return; // User pressed Cancel

  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      await fetchAndRenderTracking(orderId);
    } else {
      showToast(`DFA Error: ${data.error}`, 'error');
    }
  } catch (err) {
    showToast('Failed to cancel order due to network error.', 'error');
  }
}
