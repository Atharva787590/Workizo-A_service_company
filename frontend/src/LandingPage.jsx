import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './services/api';
import serviceGridCollage from './assets/service_grid_collage.png';

// ─── Service data ────────────────────────────────────────────────────────────
const SERVICES = [
  {
    id: '1',
    name: 'Electrician',
    desc: 'Fan, lights & wiring',
    emoji: '⚡',
    accent: '#f59e0b',
    bg: '#fffbeb',
  },
  {
    id: '2',
    name: 'Plumber',
    desc: 'Taps, pipes & leaks',
    emoji: '🔧',
    accent: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    id: '3',
    name: 'Carpenter',
    desc: 'Furniture & doors',
    emoji: '🪚',
    accent: '#10b981',
    bg: '#f0fdf4',
  },
  {
    id: '4',
    name: 'AC Technician',
    desc: 'Service & gas refill',
    emoji: '❄️',
    accent: '#06b6d4',
    bg: '#ecfeff',
  },
  {
    id: '5',
    name: 'Home Cleaning',
    desc: 'Deep & kitchen clean',
    emoji: '🧹',
    accent: '#8b5cf6',
    bg: '#f5f3ff',
  },
  {
    id: '6',
    name: 'Painting',
    desc: 'Interior & exterior',
    emoji: '🖌️',
    accent: '#ef4444',
    bg: '#fef2f2',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
const LandingPage = () => {
  const navigate = useNavigate();
  const [dbCategories, setDbCategories] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    api
      .get('/api/services/categories/')
      .then((res) => setDbCategories(res.data))
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  const handleServiceClick = (serviceName) => {
    const matched = dbCategories.find(
      (c) => c.name.toLowerCase() === serviceName.toLowerCase()
    );
    const catId = matched ? matched.id : null;
    const token = localStorage.getItem('access_token');

    if (!token) {
      toast.error('Please log in first to book a service');
      localStorage.setItem(
        'redirect_after_login',
        catId ? `/customer/book?category=${catId}` : '/customer/book'
      );
      navigate('/customer/login');
    } else {
      navigate(catId ? `/customer/book?category=${catId}` : '/customer/book');
    }
  };

  const handleBookNow = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Please log in first to book a service');
      localStorage.setItem('redirect_after_login', '/customer/book');
      navigate('/customer/login');
    } else {
      navigate('/customer/book');
    }
  };

  return (
    <>
      {/* ── Global Styles ────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .lp-root *, .lp-root *::before, .lp-root *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .lp-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #ffffff;
        }

        /* ── HERO ─────────────────────────────────────────────────────────── */
        .lp-hero {
          display: flex;
          align-items: center;
          min-height: calc(100vh - 64px);
          padding: 60px;
          gap: 56px;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* LEFT */
        .lp-left {
          flex: 0 0 47%;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .lp-headline {
          font-size: clamp(2.2rem, 3.6vw, 3.4rem);
          font-weight: 800;
          color: #111827;
          line-height: 1.14;
          letter-spacing: -0.03em;
        }

        /* Widget */
        .lp-widget {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 26px 26px 22px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }

        .lp-widget-title {
          font-size: 0.88rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 18px;
        }

        .lp-services-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .lp-service-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 16px 8px 14px;
          border: 1.5px solid #f3f4f6;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
          background: #fafafa;
          gap: 9px;
        }

        .lp-service-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          transform: translateY(-3px);
          background: #ffffff;
        }

        .lp-service-icon {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.55rem;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .lp-service-card:hover .lp-service-icon {
          transform: scale(1.1);
        }

        .lp-service-name {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.3;
        }

        .lp-service-desc {
          font-size: 0.67rem;
          color: #9ca3af;
          line-height: 1.35;
        }

        /* Stats */
        .lp-stats {
          display: flex;
          gap: 32px;
        }

        .lp-stat {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lp-stat-icon {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 1.5px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          flex-shrink: 0;
          color: #374151;
        }

        .lp-stat-value {
          font-size: 1.15rem;
          font-weight: 800;
          color: #111827;
          line-height: 1;
        }

        .lp-stat-label {
          font-size: 0.71rem;
          color: #9ca3af;
          margin-top: 3px;
          letter-spacing: 0.01em;
        }

        /* RIGHT — photo grid */
        .lp-right {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 10px;
          height: 540px;
        }

        .lp-photo {
          border-radius: 16px;
          overflow: hidden;
          background-size: 200%;
          background-repeat: no-repeat;
          transition: background-size 0.45s ease;
        }

        .lp-photo:hover {
          background-size: 215%;
        }

        .lp-photo-tall {
          grid-row: span 2;
          border-radius: 18px;
        }

        /* ── SECTIONS BELOW HERO ─────────────────────────────────────────────── */
        .lp-section {
          max-width: 1280px;
          margin: 0 auto;
          padding: 56px 60px;
          border-top: 1px solid #f3f4f6;
        }

        .lp-section-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 8px;
        }

        .lp-section-title {
          font-size: clamp(1.55rem, 2.4vw, 2.2rem);
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.025em;
          margin-bottom: 10px;
        }

        .lp-section-sub {
          font-size: 0.92rem;
          color: #6b7280;
          max-width: 520px;
          line-height: 1.6;
        }

        /* How-it-works */
        .lp-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 36px;
        }

        .lp-how-card {
          padding: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .lp-how-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }

        .lp-how-num {
          font-size: 1.9rem;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .lp-how-title {
          font-size: 0.97rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }

        .lp-how-desc {
          font-size: 0.86rem;
          color: #6b7280;
          line-height: 1.6;
        }

        /* Buttons */
        .lp-btn-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 28px;
        }

        .lp-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 50px;
          padding: 13px 30px;
          font-size: 0.93rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
          font-family: inherit;
          border: 1.5px solid transparent;
          text-decoration: none;
        }

        .lp-btn-dark {
          background: #111827;
          color: #fff;
          border-color: #111827;
        }

        .lp-btn-dark:hover {
          background: #374151;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }

        .lp-btn-outline {
          background: transparent;
          color: #111827;
          border-color: #d1d5db;
        }

        .lp-btn-outline:hover {
          background: #f9fafb;
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.08);
        }

        /* Safety */
        .lp-safety-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 36px;
        }

        .lp-safety-card {
          padding: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #fff;
          transition: box-shadow 0.2s, transform 0.2s;
        }

        .lp-safety-card:hover {
          box-shadow: 0 6px 20px rgba(0,0,0,0.07);
          transform: translateY(-2px);
        }

        .lp-safety-icon { font-size: 1.8rem; margin-bottom: 14px; }
        .lp-safety-title { font-size: 0.97rem; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .lp-safety-desc { font-size: 0.86rem; color: #6b7280; line-height: 1.6; }

        /* ── RESPONSIVE ─────────────────────────────────────────────────────── */
        @media (max-width: 900px) {
          .lp-hero {
            flex-direction: column;
            padding: 100px 24px 52px;
            gap: 36px;
            min-height: auto;
          }
          .lp-left { flex: unset; width: 100%; gap: 24px; }
          .lp-right { width: 100%; height: 360px; }
          .lp-section { padding: 44px 24px; }
          .lp-how-grid, .lp-safety-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 560px) {
          .lp-services-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-right { height: 280px; gap: 8px; }
        }
      `}</style>

      <div className="lp-root">

        {/* ══════════════════════════════ HERO */}
        <section>
          <div className="lp-hero">

            {/* ── LEFT ── */}
            <div className="lp-left">
              <h1 className="lp-headline">
                Home services at your doorstep
              </h1>

              {/* Widget */}
              <div className="lp-widget">
                <p className="lp-widget-title">What are you looking for?</p>
                <div className="lp-services-grid">
                  {SERVICES.map((svc) => (
                    <div
                      key={svc.id}
                      className="lp-service-card"
                      onMouseEnter={() => setHoveredCard(svc.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => handleServiceClick(svc.name)}
                      style={{
                        borderColor: hoveredCard === svc.id ? svc.accent : undefined,
                      }}
                    >
                      <div className="lp-service-icon" style={{ background: svc.bg }}>
                        {svc.emoji}
                      </div>
                      <div className="lp-service-name">{svc.name}</div>
                      <div className="lp-service-desc">{svc.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="lp-stats">
                <div className="lp-stat">
                  <div className="lp-stat-icon">⭐</div>
                  <div>
                    <div className="lp-stat-value">4.8</div>
                    <div className="lp-stat-label">Service Rating*</div>
                  </div>
                </div>
                <div className="lp-stat">
                  <div className="lp-stat-icon">👥</div>
                  <div>
                    <div className="lp-stat-value">12M+</div>
                    <div className="lp-stat-label">Customers Globally*</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT — 2×2 photo collage ── */}
            <div className="lp-right">
              {/* Left tall photo — AC Technician (top-left quadrant) */}
              <div
                className="lp-photo lp-photo-tall"
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '0% 0%',
                }}
                role="img"
                aria-label="AC Technician at work"
              />
              {/* Top-right — Plumber (top-right quadrant) */}
              <div
                className="lp-photo"
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '100% 0%',
                }}
                role="img"
                aria-label="Plumber at work"
              />
              {/* Bottom-right — Painter (bottom-right quadrant) */}
              <div
                className="lp-photo"
                style={{
                  backgroundImage: `url(${serviceGridCollage})`,
                  backgroundPosition: '100% 100%',
                }}
                role="img"
                aria-label="Painter at work"
              />
            </div>

          </div>
        </section>

        {/* ══════════════════════════════ HOW IT WORKS */}
        <section className="lp-section">
          <p className="lp-section-label">Simple Process</p>
          <h2 className="lp-section-title">How It Works</h2>
          <p className="lp-section-sub">
            Get your home services completed in three easy steps. No complications, just results.
          </p>

          <div className="lp-how-grid">
            <div className="lp-how-card">
              <div className="lp-how-num" style={{ color: '#3b82f6' }}>01</div>
              <div className="lp-how-title">Choose Category</div>
              <div className="lp-how-desc">
                Select from our list of vetted experts — plumber, electrician, carpenter, and more — and search local providers.
              </div>
            </div>
            <div className="lp-how-card">
              <div className="lp-how-num" style={{ color: '#10b981' }}>02</div>
              <div className="lp-how-title">Match Nearby</div>
              <div className="lp-how-desc">
                Our live dispatcher alerts all online Captains in your category and pairs you in under 5 minutes.
              </div>
            </div>
            <div className="lp-how-card">
              <div className="lp-how-num" style={{ color: '#f59e0b' }}>03</div>
              <div className="lp-how-title">Track &amp; Pay</div>
              <div className="lp-how-desc">
                Track the assigned Captain live on the interactive timeline, verify via secure QR, and settle payments.
              </div>
            </div>
          </div>

          <div className="lp-btn-row">
            <button className="lp-btn lp-btn-dark" onClick={handleBookNow}>
              Book Service Now →
            </button>
            <button
              className="lp-btn lp-btn-outline"
              onClick={() => navigate('/captain/register')}
            >
              Become a Captain
            </button>
          </div>
        </section>

        {/* ══════════════════════════════ SAFETY */}
        <section className="lp-section">
          <p className="lp-section-label">Trust &amp; Quality</p>
          <h2 className="lp-section-title">Workizo Quality &amp; Safety Assurance</h2>
          <p className="lp-section-sub">
            Just like India's top home platforms, we prioritize trust, background verification, and quality of work.
          </p>

          <div className="lp-safety-grid">
            <div className="lp-safety-card">
              <div className="lp-safety-icon">🛡️</div>
              <div className="lp-safety-title">100% KYC Verified</div>
              <div className="lp-safety-desc">
                Every Captain is verified via Aadhaar &amp; PAN background checks prior to platform listing.
              </div>
            </div>
            <div className="lp-safety-card">
              <div className="lp-safety-icon">💰</div>
              <div className="lp-safety-title">Standardized Pricing</div>
              <div className="lp-safety-desc">
                No bargaining. Get fixed, fair quotes for all categories before work begins.
              </div>
            </div>
            <div className="lp-safety-card">
              <div className="lp-safety-icon">⭐</div>
              <div className="lp-safety-title">Elite Trained Captains</div>
              <div className="lp-safety-desc">
                Only experienced local experts are matched to guarantee 100% satisfaction.
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
};

export default LandingPage;
