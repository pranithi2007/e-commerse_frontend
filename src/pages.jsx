import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { addToCart, apiRequest, readCart, writeCart } from './api.js';
import { useAuth } from './auth.js';

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const imageFor = (product) => product.image || product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

function useProducts(query = '') {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/products${query ? `?${query}` : ''}`)
      .then((result) => {
        if (active) setProducts(result.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [query]);

  return { products, error, loading };
}

function ProductCard({ product }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    addToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article className="product-card">
      <img className="product-image" src={imageFor(product)} alt={product.name} loading="lazy" />
      <div className="product-card-body">
        <div className="product-meta"><span>{product.category}</span><span>★ {product.rating || '4.5'}</span></div>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-card-bottom">
          <strong>{money(product.price)}</strong>
          <button className="button button-small" disabled={Number(product.stock) < 1} onClick={handleAdd} type="button">
            {Number(product.stock) < 1 ? 'Out of stock' : added ? 'Added' : 'Add to cart'}
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({ products, loading, error }) {
  if (loading) return <p className="notice">Loading products…</p>;
  if (error) return <p className="notice notice-error">{error}</p>;
  if (!products.length) return <p className="notice">No products found. Try a different search or category.</p>;
  return <div className="product-grid">{products.map((product) => <ProductCard key={product._id} product={product} />)}</div>;
}

export function HomePage() {
  const { products, error, loading } = useProducts('sort=rating');
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Shopping with verified order states</span>
          <h1>Every order has a clear next step.</h1>
          <p>Discover a curated catalog and follow each order from placement to delivery with DFA-validated transitions.</p>
          <div className="button-row">
            <Link className="button" to="/products">Browse products</Link>
            <Link className="button button-outline" to="/dfa-spec">How the DFA works</Link>
          </div>
        </div>
        <div className="hero-diagram" aria-label="Order progress: placed, confirmed, processing, shipped, delivered">
          <span>S0<br /><small>Placed</small></span><i>→</i><span>S1<br /><small>Confirmed</small></span><i>→</i><span>S2<br /><small>Processing</small></span><i>→</i><span>S5<br /><small>Delivered</small></span>
          <span className="terminal-state">S6 · Cancelled</span>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><span className="eyebrow">Customer favorites</span><h2>Featured products</h2></div>
          <Link to="/products">View the full catalog →</Link>
        </div>
        <ProductGrid products={products.slice(0, 4)} loading={loading} error={error} />
      </section>
      <section className="feature-grid">
        <article className="feature-card"><span>01</span><h3>Valid transitions only</h3><p>Order updates follow the rules of the state machine.</p></article>
        <article className="feature-card"><span>02</span><h3>Transparent tracking</h3><p>Review the current state and recorded transition history.</p></article>
        <article className="feature-card"><span>03</span><h3>Auditable lifecycle</h3><p>Each accepted transition is recorded with its triggering action.</p></article>
      </section>
    </>
  );
}

export function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('rating');
  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    return params.toString();
  }, [keyword, category, sort]);
  const { products, error, loading } = useProducts(query);
  const categories = ['Electronics', 'Fashion', 'Home & Kitchen', 'Sports & Fitness', 'Books & Media'];

  return (
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Shop the catalog</span><h1>Products</h1></div><span>{loading ? 'Loading…' : `${products.length} items`}</span></div>
      <div className="filter-bar">
        <label className="field-grow">Search<input onChange={(event) => setKeyword(event.target.value)} placeholder="Search products" value={keyword} /></label>
        <label>Category<select onChange={(event) => setCategory(event.target.value)} value={category}><option value="">All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Sort<select onChange={(event) => setSort(event.target.value)} value={sort}><option value="rating">Top rated</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
      </div>
      <ProductGrid products={products} loading={loading} error={error} />
    </section>
  );
}

export function AuthPage({ mode }) {
  const register = mode === 'register';
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const result = await apiRequest(`/auth/${register ? 'register' : 'login'}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      signIn(result.data);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-wrap">
      <form className="form-card" onSubmit={submit}>
        <span className="eyebrow">{register ? 'Join DFA Commerce' : 'Welcome back'}</span>
        <h1>{register ? 'Create your account' : 'Sign in'}</h1>
        {error && <p className="notice notice-error">{error}</p>}
        {register && <label>Full name<input autoComplete="name" name="name" required /></label>}
        <label>Email address<input autoComplete="email" name="email" required type="email" /></label>
        <label>Password<input autoComplete={register ? 'new-password' : 'current-password'} minLength={6} name="password" required type="password" /></label>
        <button className="button button-wide" disabled={busy} type="submit">{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'}</button>
        <p className="form-footnote">{register ? 'Already registered?' : 'New to DFA Commerce?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create an account'}</Link></p>
      </form>
    </section>
  );
}

export function CartPage({ checkout = false }) {
  const [cart, setCart] = useState(readCart);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  function updateCart(nextCart) {
    setCart(nextCart);
    writeCart(nextCart);
  }

  async function placeOrder(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const deliveryAddress = Object.fromEntries(form.entries());
    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          products: cart.map(({ product, quantity }) => ({ product, quantity })),
          deliveryAddress,
        }),
      });
      updateCart([]);
      navigate('/orders');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.length) return <section className="empty-state"><span className="eyebrow">Your cart</span><h1>{checkout ? 'Your cart is empty' : 'Nothing here yet'}</h1><p>Add products to your cart before checking out.</p><Link className="button" to="/products">Browse products</Link></section>;

  return (
    <section className="section narrow-section">
      <span className="eyebrow">{checkout ? 'Secure checkout' : 'Your selection'}</span>
      <h1>{checkout ? 'Delivery details' : 'Shopping cart'}</h1>
      {!checkout && <div className="cart-list">{cart.map((item) => (
        <article className="cart-item" key={item.product}>
          <img src={item.image || imageFor(item)} alt="" />
          <div className="cart-item-info"><strong>{item.name}</strong><span>{money(item.price)} each</span></div>
          <div className="quantity-controls">
            <button aria-label={`Decrease ${item.name} quantity`} onClick={() => updateCart(cart.map((line) => line.product === item.product ? { ...line, quantity: Math.max(1, line.quantity - 1) } : line))} type="button">−</button>
            <span>{item.quantity}</span>
            <button aria-label={`Increase ${item.name} quantity`} onClick={() => updateCart(cart.map((line) => line.product === item.product ? { ...line, quantity: line.quantity + 1 } : line))} type="button">+</button>
          </div>
          <strong>{money(item.price * item.quantity)}</strong>
          <button className="text-button" onClick={() => updateCart(cart.filter((line) => line.product !== item.product))} type="button">Remove</button>
        </article>
      ))}</div>}
      <div className="cart-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
      {checkout ? (
        <form className="form-card checkout-form" onSubmit={placeOrder}>
          {error && <p className="notice notice-error">{error}</p>}
          <label>Full name<input autoComplete="name" name="fullName" required /></label>
          <label>Address<input autoComplete="street-address" name="address" required /></label>
          <div className="form-row"><label>City<input autoComplete="address-level2" name="city" required /></label><label>Postal code<input autoComplete="postal-code" name="postalCode" required /></label></div>
          <div className="form-row"><label>Country<input autoComplete="country-name" defaultValue="India" name="country" required /></label><label>Phone<input autoComplete="tel" name="phone" required type="tel" /></label></div>
          <button className="button button-wide" disabled={busy} type="submit">{busy ? 'Placing order…' : `Place order · ${money(subtotal)}`}</button>
        </form>
      ) : <Link className="button button-wide" to="/checkout">Continue to checkout</Link>}
    </section>
  );
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/orders/my-orders')
      .then((result) => setOrders(result.data || []))
      .catch((requestError) => setError(requestError.message));
  }, []);

  return (
    <section className="section">
      <span className="eyebrow">Order history</span><h1>My orders</h1>
      {error && <p className="notice notice-error">{error}</p>}
      {!error && !orders.length ? <p className="notice">No orders yet. <Link to="/products">Start shopping</Link>.</p> : (
        <div className="order-list">{orders.map((order) => <article className="order-card" key={order._id}>
          <div><span className="eyebrow">{new Date(order.createdAt).toLocaleDateString()}</span><h2>Order {order._id}</h2><p>{order.products.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</p></div>
          <div className="order-state"><span className={`status status-${order.currentStatus?.code}`}>{order.currentStatus?.code} · {order.currentStatus?.name}</span><strong>{money(order.totalAmount)}</strong><Link to={`/track/${order._id}`}>Track order</Link></div>
        </article>)}</div>
      )}
    </section>
  );
}

export function TrackPage() {
  const { orderId: routeId } = useParams();
  const [orderId, setOrderId] = useState(routeId || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (routeId) setOrderId(routeId); }, [routeId]);

  async function track(event) {
    event?.preventDefault();
    if (!orderId.trim()) return;
    setBusy(true);
    setError('');
    setOrder(null);
    try {
      const result = await apiRequest(`/orders/${encodeURIComponent(orderId.trim())}`);
      setOrder(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { if (routeId) track(); }, [routeId]);

  const states = ['S0', 'S1', 'S2', 'S3', 'S4', 'S5'];
  const currentIndex = states.indexOf(order?.currentStatus?.code);

  return (
    <section className="section narrow-section">
      <span className="eyebrow">DFA state machine monitor</span><h1>Track an order</h1>
      <form className="track-form" onSubmit={track}><input aria-label="Order ID" onChange={(event) => setOrderId(event.target.value)} placeholder="Paste your order ID" value={orderId} /><button className="button" disabled={busy} type="submit">{busy ? 'Searching…' : 'Track'}</button></form>
      {error && <p className="notice notice-error">{error}</p>}
      {order && <article className="tracking-card">
        <div className="section-heading"><div><span className="eyebrow">Order {order._id}</span><h2>{order.currentStatus?.name}</h2></div><strong>{money(order.totalAmount)}</strong></div>
        {order.currentStatus?.code === 'S6' ? <p className="notice">This order was cancelled.</p> : (
          <div className="state-track">{states.map((state, index) => <div className={`state-step ${index <= currentIndex ? 'complete' : ''}`} key={state}><span>{state}</span><small>{['Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for delivery', 'Delivered'][index]}</small></div>)}</div>
        )}
        <h3>Transition history</h3>
        <ul className="history-list">{(order.transitionHistory || []).map((item, index) => <li key={`${item.timestamp}-${index}`}><strong>{item.previousState} → {item.nextState || 'Rejected'}</strong><span>{item.inputSymbol} · {item.validationResult}</span><small>{new Date(item.timestamp).toLocaleString()}</small></li>)}</ul>
      </article>}
    </section>
  );
}

export function DfaSpecPage() {
  const [definition, setDefinition] = useState(null);
  const [error, setError] = useState('');
  const [simulation, setSimulation] = useState(null);
  const [sequence, setSequence] = useState('CONFIRM, PROCESS, SHIP, OUT_FOR_DELIVERY, DELIVER');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest('/dfa/transitions')
      .then((result) => setDefinition(result.data))
      .catch((requestError) => setError(requestError.message));
  }, []);

  async function simulate(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await apiRequest('/dfa/simulate', {
        method: 'POST',
        body: JSON.stringify({ startState: 'S0', symbols: sequence.split(',').map((item) => item.trim()).filter(Boolean) }),
      });
      setSimulation(result.data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section">
      <span className="eyebrow">Formal order lifecycle</span><h1>DFA specification</h1>
      <p className="intro-copy">{definition?.description || 'M = (Q, Σ, δ, q0, F) defines the valid transitions in an order lifecycle.'}</p>
      {error && <p className="notice notice-error">{error}</p>}
      <div className="state-grid">{(definition?.Q || []).map((state) => <article className="feature-card" key={state.code}><span>{state.code}{state.isTerminal ? ' · terminal' : ''}</span><h3>{state.name}</h3><p>{state.description}</p></article>)}</div>
      <h2 className="subheading">Transition table</h2>
      <div className="table-wrap"><table><thead><tr><th>Current state</th><th>Valid actions</th></tr></thead><tbody>{Object.entries(definition?.delta || {}).map(([state, transitions]) => <tr key={state}><td>{state}</td><td>{Object.entries(transitions).map(([symbol, next]) => `${symbol} → ${next}`).join(' · ') || 'No outgoing transitions'}</td></tr>)}</tbody></table></div>
      <form className="simulation-form" onSubmit={simulate}><label>Simulate comma-separated actions<input onChange={(event) => setSequence(event.target.value)} value={sequence} /></label><button className="button" disabled={busy} type="submit">{busy ? 'Simulating…' : 'Simulate'}</button></form>
      {simulation && <p className={`notice ${simulation.isFinalAccepted ? 'notice-success' : ''}`}>{simulation.isFinalAccepted ? 'Sequence accepted in final state.' : simulation.haltReason || `Sequence ended in ${simulation.endState}.`}</p>}
    </section>
  );
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  async function loadOrders() {
    try {
      const result = await apiRequest('/orders?limit=100');
      setOrders(result.data || []);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => { loadOrders(); }, []);

  async function advance(order, inputSymbol) {
    setBusyId(order._id);
    setError('');
    try {
      await apiRequest(`/orders/${order._id}/status`, { method: 'PUT', body: JSON.stringify({ inputSymbol }) });
      await loadOrders();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Administration</span><h1>Order transitions</h1></div><Link className="button button-outline" to="/admin/products">Manage products</Link></div>
      {error && <p className="notice notice-error">{error}</p>}
      <div className="order-list">{orders.map((order) => {
        const transitions = { S0: ['CONFIRM', 'CANCEL'], S1: ['PROCESS', 'CANCEL'], S2: ['SHIP', 'CANCEL'], S3: ['OUT_FOR_DELIVERY'], S4: ['DELIVER'] }[order.currentStatus?.code] || [];
        return <article className="admin-row" key={order._id}><div><strong>{order._id}</strong><span>{order.userId?.name || 'Customer'} · {money(order.totalAmount)}</span></div><span className={`status status-${order.currentStatus?.code}`}>{order.currentStatus?.code} · {order.currentStatus?.name}</span><div className="button-row">{transitions.map((symbol) => <button className="button button-small" disabled={busyId === order._id} key={symbol} onClick={() => advance(order, symbol)} type="button">{symbol.replaceAll('_', ' ')}</button>)}</div></article>;
      })}</div>
    </section>
  );
}

export function AdminProductsPage() {
  const [refresh, setRefresh] = useState(0);
  const { products, error, loading } = useProducts(refresh ? `_refresh=${refresh}` : '');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    setSaveError('');
    const form = new FormData(event.currentTarget);
    const product = Object.fromEntries(form.entries());
    product.price = Number(product.price);
    product.stock = Number(product.stock);
    const id = editing?._id;
    try {
      await apiRequest(`/products${id ? `/${id}` : ''}`, {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(product),
      });
      setEditing(null);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setSaveError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiRequest(`/products/${id}`, { method: 'DELETE' });
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setSaveError(requestError.message);
    }
  }

  return (
    <section className="section">
      <div className="section-heading"><div><span className="eyebrow">Administration</span><h1>Product catalog</h1></div><Link to="/admin">Order management</Link></div>
      {(saveError || error) && <p className="notice notice-error">{saveError || error}</p>}
      <form className="admin-product-form" key={editing?._id || 'new'} onSubmit={saveProduct}>
        <h2>{editing ? 'Edit product' : 'Add product'}</h2>
        <div className="form-row"><label>Name<input defaultValue={editing?.name} name="name" required /></label><label>Category<input defaultValue={editing?.category} name="category" required /></label></div>
        <label>Description<input defaultValue={editing?.description} name="description" required /></label>
        <label>Image URL<input defaultValue={editing?.image} name="image" required type="url" /></label>
        <div className="form-row"><label>Price<input defaultValue={editing?.price} min="0" name="price" required type="number" step="0.01" /></label><label>Stock<input defaultValue={editing?.stock ?? 0} min="0" name="stock" required type="number" /></label></div>
        <div className="button-row"><button className="button" disabled={busy} type="submit">{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>{editing && <button className="button button-quiet" onClick={() => setEditing(null)} type="button">Cancel edit</button>}</div>
      </form>
      {loading ? <p className="notice">Loading products…</p> : <div className="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td>{product.name}</td><td>{product.category}</td><td>{money(product.price)}</td><td>{product.stock}</td><td><button className="text-button" onClick={() => setEditing(product)} type="button">Edit</button><button className="text-button danger-text" onClick={() => removeProduct(product._id)} type="button">Delete</button></td></tr>)}</tbody></table></div>}
    </section>
  );
}

export function NotFoundPage() {
  return <section className="empty-state"><span className="eyebrow">404</span><h1>Page not found</h1><p>The page you requested does not exist.</p><Link className="button" to="/">Return home</Link></section>;
}
