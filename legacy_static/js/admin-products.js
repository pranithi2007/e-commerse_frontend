/**
 * Admin Product Management Script
 */

let adminProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadAdminProducts();

  // New product form
  const newProductForm = document.getElementById('newProductForm');
  if (newProductForm) {
    newProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSaveProduct();
    });
  }
});

async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary spinner-border-sm me-2"></div>Loading products...</td></tr>';

  try {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (data.success && Array.isArray(data.products)) {
      adminProducts = data.products;
      renderAdminProducts(adminProducts);
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Failed to load products.</td></tr>';
    }
  } catch (err) {
    console.error('Error loading products:', err);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error loading products.</td></tr>';
  }
}

function renderAdminProducts(products) {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No products found. Click "Add New Product" to create one.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="align-middle">
      <td style="width: 70px;">
        <img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" class="rounded shadow-sm" style="width: 50px; height: 50px; object-fit: cover;">
      </td>
      <td>
        <div class="fw-bold text-dark">${escapeHtml(p.name)}</div>
        <small class="text-muted text-truncate d-inline-block" style="max-width: 250px;">${escapeHtml(p.description)}</small>
      </td>
      <td>
        <span class="badge bg-light text-dark border">${escapeHtml(p.category)}</span>
      </td>
      <td class="fw-bold text-primary">$${p.price.toFixed(2)}</td>
      <td>
        <span class="badge ${p.stock > 10 ? 'bg-success' : p.stock > 0 ? 'bg-warning text-dark' : 'bg-danger'}">
          ${p.stock} units
        </span>
      </td>
      <td>
        ${p.featured ? '<span class="badge bg-primary">Featured</span>' : '<span class="badge bg-light text-muted">Standard</span>'}
      </td>
      <td class="text-end">
        <div class="btn-group">
          <button class="btn btn-sm btn-outline-primary" onclick="openEditProductModal('${p._id || p.id}')">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${p._id || p.id}', '${escapeHtml(p.name)}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Add New Product';
  document.getElementById('productIdInput').value = '';
  document.getElementById('productNameInput').value = '';
  document.getElementById('productCategoryInput').value = 'Electronics';
  document.getElementById('productPriceInput').value = '';
  document.getElementById('productStockInput').value = '25';
  document.getElementById('productImageUrlInput').value = '';
  document.getElementById('productDescInput').value = '';
  document.getElementById('productFeaturedInput').checked = false;

  const modalEl = document.getElementById('productFormModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function openEditProductModal(id) {
  const p = adminProducts.find(item => (item._id || item.id) === id);
  if (!p) return;

  document.getElementById('productModalTitle').textContent = 'Edit Product';
  document.getElementById('productIdInput').value = p._id || p.id;
  document.getElementById('productNameInput').value = p.name;
  document.getElementById('productCategoryInput').value = p.category;
  document.getElementById('productPriceInput').value = p.price;
  document.getElementById('productStockInput').value = p.stock;
  document.getElementById('productImageUrlInput').value = p.imageUrl || '';
  document.getElementById('productDescInput').value = p.description || '';
  document.getElementById('productFeaturedInput').checked = Boolean(p.featured);

  const modalEl = document.getElementById('productFormModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function handleSaveProduct() {
  const id = document.getElementById('productIdInput').value;
  const name = document.getElementById('productNameInput').value.trim();
  const category = document.getElementById('productCategoryInput').value;
  const price = parseFloat(document.getElementById('productPriceInput').value);
  const stock = parseInt(document.getElementById('productStockInput').value, 10);
  const imageUrl = document.getElementById('productImageUrlInput').value.trim();
  const description = document.getElementById('productDescInput').value.trim();
  const featured = document.getElementById('productFeaturedInput').checked;

  if (!name || isNaN(price) || isNaN(stock)) {
    showToast('Please fill in product name, price, and stock properly.', 'warning');
    return;
  }

  const payload = {
    name,
    category,
    price,
    stock,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    description,
    featured
  };

  try {
    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message || 'Product saved successfully!', 'success');
      const modalEl = document.getElementById('productFormModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
      await loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to save product.', 'error');
    }
  } catch (err) {
    showToast('Network error saving product.', 'error');
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Are you sure you want to delete product "${name}"?`)) return;

  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Product deleted successfully.', 'info');
      await loadAdminProducts();
    } else {
      showToast(data.error || 'Failed to delete product.', 'error');
    }
  } catch (err) {
    showToast('Network error deleting product.', 'error');
  }
}
