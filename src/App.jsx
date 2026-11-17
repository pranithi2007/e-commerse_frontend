import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { readCart } from './api.js';
import { AuthContext, useAuth } from './auth.js';
import {
  AdminOrdersPage,
  AdminProductsPage,
  AuthPage,
  CartPage,
  DfaSpecPage,
  HomePage,
  NotFoundPage,
  OrdersPage,
  ProductsPage,
  TrackPage,
} from './pages.jsx';

function SiteLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [cartCount, setCartCount] = useState(() =>
    readCart().reduce((total, item) => total + item.quantity, 0)
  );

  useEffect(() => {
    const updateCount = () => {
      setCartCount(readCart().reduce((total, item) => total + item.quantity, 0));
    };
    window.addEventListener('dfa-cart-change', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('dfa-cart-change', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const links = [
    ['/', 'Home'],
    ['/products', 'Products'],
    ['/track', 'Track order'],
    ['/dfa-spec', 'DFA spec'],
  ];

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="DFA Commerce home">
          <span className="brand-mark">D</span>
          <span>DFA<span className="brand-accent">Commerce</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link className={location.pathname === href ? 'active' : ''} key={href} to={href}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="cart-link" to="/cart">Cart <span className="cart-count">{cartCount}</span></Link>
          {user ? (
            <>
              <Link to="/orders">My orders</Link>
              {user.role === 'admin' && <Link to="/admin">Admin</Link>}
              <button className="button button-small button-quiet" onClick={signOut} type="button">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link className="button button-small" to="/register">Create account</Link>
            </>
          )}
        </div>
      </header>
      <main className="site-main"><Outlet /></main>
      <footer className="site-footer">
        <span>DFA Commerce</span>
        <span>Order progress validated by a deterministic finite automaton.</span>
        <Link to="/dfa-spec">Explore the DFA</Link>
      </footer>
    </div>
  );
}

function RequireAuth({ admin = false }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppRoutes() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('dfaUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const signIn = (account) => {
    localStorage.setItem('dfaToken', account.token);
    localStorage.setItem('dfaUser', JSON.stringify(account));
    setUser(account);
  };

  const signOut = () => {
    localStorage.removeItem('dfaToken');
    localStorage.removeItem('dfaUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="login" element={<AuthPage mode="login" />} />
          <Route path="register" element={<AuthPage mode="register" />} />
          <Route path="dfa-spec" element={<DfaSpecPage />} />
          <Route element={<RequireAuth />}>
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<CartPage checkout />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="track" element={<TrackPage />} />
            <Route path="track/:orderId" element={<TrackPage />} />
          </Route>
          <Route element={<RequireAuth admin />}>
            <Route path="admin" element={<AdminOrdersPage />} />
            <Route path="admin/products" element={<AdminProductsPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthContext.Provider>
  );
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}
