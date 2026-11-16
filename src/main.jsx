import React from 'react';
import ReactDOM from 'react-dom/client';

const styles = {
  page: {
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
    background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 45%, #eef2ff 100%)',
    color: '#0f172a',
  },
  shell: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#f8fafc',
    padding: '16px 24px',
    borderRadius: '18px',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 800,
    letterSpacing: '0.04em',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '999px',
    background: '#e0e7ff',
    color: '#312e81',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  navLinks: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#cbd5e1',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 0.8fr',
    gap: '28px',
    alignItems: 'center',
    padding: '46px 0 26px',
  },
  heroCard: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '28px',
    padding: '32px',
    boxShadow: '0 20px 50px rgba(79, 70, 229, 0.12)',
  },
  title: {
    margin: '0 0 16px',
    fontSize: 'clamp(2.4rem, 4vw, 4.2rem)',
    lineHeight: 1.05,
    letterSpacing: '-0.06em',
  },
  subtitle: {
    margin: '0 0 24px',
    fontSize: '1.08rem',
    lineHeight: 1.7,
    color: '#475569',
    maxWidth: '610px',
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '14px',
    marginBottom: '26px',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 22px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#ffffff',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(79, 70, 229, 0.28)',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 22px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
    cursor: 'pointer',
  },
  featureList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '14px',
    marginTop: '20px',
  },
  featureItem: {
    padding: '14px 16px',
    borderRadius: '14px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#334155',
    fontSize: '0.95rem',
    fontWeight: 600,
  },
  statsPanel: {
    background: 'linear-gradient(160deg, #111827 0%, #1f2937 100%)',
    color: '#f8fafc',
    minHeight: '350px',
    borderRadius: '28px',
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 30px 60px rgba(15, 23, 42, 0.18)',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  statCard: {
    background: 'rgba(148, 163, 184, 0.12)',
    border: '1px solid rgba(148, 163, 184, 0.18)',
    borderRadius: '16px',
    padding: '18px 14px',
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#cbd5e1',
    marginBottom: '8px',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
  },
  section: {
    marginTop: '42px',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '18px',
    marginTop: '18px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.04)',
  },
  cardTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    margin: '0 0 12px',
  },
  cardText: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.7,
  },
};

function App() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.nav}>
          <div style={styles.brand}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              fontWeight: 900,
            }}>
              D
            </span>
            DFAMall
          </div>

          <nav style={styles.navLinks} aria-label="Main navigation">
            <span>Home</span>
            <span>Products</span>
            <span>Orders</span>
            <span>Track</span>
            <span>Admin</span>
          </nav>

          <button type="button" style={styles.primaryButton}>
            Shop Now
          </button>
        </header>

        <main>
          <section style={styles.hero}>
            <div style={styles.heroCard}>
              <div style={styles.badge}>DFA Order Engine</div>
              <h1 style={styles.title}>Built for safe, verified shopping experiences.</h1>
              <p style={styles.subtitle}>
                DFAMall combines a modern storefront with a strict order lifecycle system,
                ensuring every status transition is validated before a purchase advances.
              </p>

              <div style={styles.actions}>
                <button type="button" style={styles.primaryButton}>Explore catalog</button>
                <button type="button" style={styles.secondaryButton}>View DFA demo</button>
              </div>

              <div style={styles.featureList}>
                <div style={styles.featureItem}>Secure checkout</div>
                <div style={styles.featureItem}>Order tracking</div>
                <div style={styles.featureItem}>State validation</div>
              </div>
            </div>

            <aside style={styles.statsPanel}>
              <div>
                <div style={{ fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#cbd5e1' }}>
                  Live metrics
                </div>
                <h2 style={{ margin: '12px 0 0', fontSize: '2rem' }}>Order flow</h2>
              </div>

              <div style={styles.statGrid}>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Revenue</span>
                  <span style={styles.statValue}>$84.2K</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Orders</span>
                  <span style={styles.statValue}>1,248</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Shipped</span>
                  <span style={styles.statValue}>83%</span>
                </div>
                <div style={styles.statCard}>
                  <span style={styles.statLabel}>Validated</span>
                  <span style={styles.statValue}>100%</span>
                </div>
              </div>
            </aside>
          </section>

          <section style={styles.section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '2rem', letterSpacing: '-0.04em' }}>Why customers use DFAMall</h2>
              <div style={{ ...styles.badge, background: '#dcfce7', color: '#166534' }}>Trusted workflow</div>
            </div>

            <div style={styles.cards}>
              <article style={styles.card}>
                <h3 style={styles.cardTitle}>Deterministic transitions</h3>
                <p style={styles.cardText}>
                  Order states only advance through legal DFA transitions, preventing invalid jumps or impossible lifecycle updates.
                </p>
              </article>

              <article style={styles.card}>
                <h3 style={styles.cardTitle}>Operational clarity</h3>
                <p style={styles.cardText}>
                  Customers and admins can track each state with clear history, audit logs, and progress markers.
                </p>
              </article>

              <article style={styles.card}>
                <h3 style={styles.cardTitle}>Reliable automation</h3>
                <p style={styles.cardText}>
                  Build confidence in fulfillment and cancellation logic with formal guards around every transition.
                </p>
              </article>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
