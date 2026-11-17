const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`
  : '/api';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('dfaToken');
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  const payload = await response.json();

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${response.status})`);
  }

  return payload;
}

export function readCart() {
  const cart = JSON.parse(localStorage.getItem('dfaCart') || '[]');
  return Array.isArray(cart) ? cart : [];
}

export function writeCart(cart) {
  localStorage.setItem('dfaCart', JSON.stringify(cart));
  window.dispatchEvent(new Event('dfa-cart-change'));
}

export function addToCart(product) {
  const cart = readCart();
  const id = product._id || product.id;
  const existing = cart.find((item) => item.product === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      product: id,
      name: product.name,
      image: product.image || product.imageUrl || '',
      price: Number(product.price),
      quantity: 1,
    });
  }

  writeCart(cart);
}
