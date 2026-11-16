/**
 * Shopping Cart Management Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadCart();
});

async function loadCart() {
  const activeCartRow = document.getElementById('activeCartRow');
  const emptyContainer = document.getElementById('emptyCartContainer');

  try {
    const res = await fetch('/api/cart');
    const data = await res.json();

    if (data.success && data.cart && data.cart.items.length > 0) {
      if (emptyContainer) emptyContainer.style.display = 'none';
      if (activeCartRow) activeCartRow.style.display = 'flex';

      renderCartItems(data.cart.items);
      renderCartSummary(data.cart);
    } else {
      if (activeCartRow) activeCartRow.style.display = 'none';
      if (emptyContainer) emptyContainer.style.display = 'block';
      await loadQuickAddRecommendations();
    }
  } catch (err) {
    console.error('Error loading cart:', err);
    showToast('Failed to load cart items.', 'error');
  }
}

function renderCartItems(items) {
  const tbody = document.getElementById('cartTableBody');
  if (!tbody) return;

  tbody.innerHTML = items.map(item => `
    <tr class="align-middle">
      <td style="width: 80px;">
        <img src="${escapeHtml(item.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200')}" 
             alt="${escapeHtml(item.name)}" 
             class="rounded-3 shadow-sm" 
             style="width: 65px; height: 65px; object-fit: cover;">
      </td>
      <td>
        <h6 class="mb-1 fw-bold text-dark text-truncate" style="max-width: 320px;" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h6>
        <span class="text-primary fw-semibold">$${item.price.toFixed(2)}</span>
      </td>
      <td>
        <div class="qty-stepper">
          <button class="qty-btn" onclick="updateItemQuantity('${item.productId}', ${item.quantity - 1})" title="Decrease">-</button>
          <input type="text" class="qty-val" value="${item.quantity}" readonly>
          <button class="qty-btn" onclick="updateItemQuantity('${item.productId}', ${item.quantity + 1})" title="Increase">+</button>
        </div>
      </td>
      <td class="text-end fw-bold text-dark fs-6">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
      <td class="text-end" style="width: 50px;">
        <button class="btn btn-outline-danger btn-sm rounded-circle p-1" style="width: 32px; height: 32px;" onclick="removeItem('${item.productId}')" title="Remove Item">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderCartSummary(cart) {
  const subtotalEl = document.getElementById('summarySubtotal');
  const shippingEl = document.getElementById('summaryShipping');
  const taxEl = document.getElementById('summaryTax');
  const totalEl = document.getElementById('summaryTotal');

  if (subtotalEl) subtotalEl.textContent = `$${cart.subtotal.toFixed(2)}`;
  if (shippingEl) {
    if (cart.shippingFee === 0) {
      shippingEl.innerHTML = '<span class="text-success fw-bold">FREE</span>';
    } else {
      shippingEl.textContent = `$${cart.shippingFee.toFixed(2)}`;
    }
  }
  if (taxEl) taxEl.textContent = `$${cart.tax.toFixed(2)}`;
  if (totalEl) totalEl.textContent = `$${cart.totalAmount.toFixed(2)}`;
}

async function updateItemQuantity(productId, quantity) {
  try {
    const res = await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (data.success) {
      await loadCart();
      await updateCartBadge();
    } else {
      showToast(data.error || 'Failed to update quantity', 'warning');
    }
  } catch (err) {
    showToast('Network error updating cart', 'error');
  }
}

async function removeItem(productId) {
  try {
    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Item removed from cart', 'info');
      await loadCart();
      await updateCartBadge();
    }
  } catch (err) {
    showToast('Failed to remove item', 'error');
  }
}

async function clearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) return;
  try {
    const res = await fetch('/api/cart/clear', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Cart cleared', 'info');
      await loadCart();
      await updateCartBadge();
    }
  } catch (err) {
    showToast('Failed to clear cart', 'error');
  }
}

async function loadQuickAddRecommendations() {
  const container = document.getElementById('quickAddProductsContainer');
  if (!container) return;

  try {
    const res = await fetch('/api/products?featured=true');
    const data = await res.json();

    if (data.success && Array.isArray(data.products) && data.products.length > 0) {
      container.innerHTML = data.products.slice(0, 4).map(p => `
        <div class="col-md-6 col-lg-3">
          <div class="card card-custom h-100 p-3">
            <div class="product-img-wrapper rounded-3 mb-2" style="padding-top: 60%;">
              <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" class="product-img">
            </div>
            <h6 class="fw-bold text-dark text-truncate mb-1" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h6>
            <div class="text-primary fw-bold mb-2">$${p.price.toFixed(2)}</div>
            <button class="btn btn-outline-primary btn-sm w-100 mt-auto" onclick="quickAdd('${p._id || p.id}', '${escapeHtml(p.name)}')">
              <i class="bi bi-cart-plus me-1"></i> Add to Cart
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading recommendations:', err);
  }
}

async function quickAdd(productId, name) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: 1 })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Added "${name}" to cart!`, 'success');
      await loadCart();
      await updateCartBadge();
    } else {
      showToast(data.error || 'Could not add item.', 'warning');
    }
  } catch (err) {
    showToast('Network error adding item.', 'error');
  }
}
