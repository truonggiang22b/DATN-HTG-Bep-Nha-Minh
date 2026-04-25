/**
 * OnlineLandingPage.tsx — Trang giới thiệu đặt hàng online
 * Phase 2: Bếp Nhà Mình Online Ordering
 *
 * Route: /order-online
 * Giới thiệu dịch vụ giao hàng, nút CTA đến trang đặt món
 */

import { Link } from 'react-router-dom';
import './OnlineLandingPage.css';

const FEATURES = [
  {
    icon: '🛵',
    title: 'Giao tận nơi',
    desc: 'Giao hàng trong bán kính 10km, phí ship từ 15.000đ',
  },
  {
    icon: '⏱️',
    title: 'Nhanh chóng',
    desc: 'Ước tính thời gian giao hàng ngay khi đặt món',
  },
  {
    icon: '💵',
    title: 'Thanh toán khi nhận',
    desc: 'COD — Trả tiền mặt khi nhận hàng, an toàn và tiện lợi',
  },
  {
    icon: '📍',
    title: 'Theo dõi đơn hàng',
    desc: 'Xem trạng thái đơn hàng theo thời gian thực',
  },
];

const STEPS = [
  { num: '1', label: 'Chọn món', desc: 'Duyệt thực đơn & thêm vào giỏ' },
  { num: '2', label: 'Thông tin giao', desc: 'Nhập địa chỉ & số điện thoại' },
  { num: '3', label: 'Xác nhận', desc: 'Kiểm tra & đặt hàng' },
];

export function OnlineLandingPage() {
  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="landing__hero">
        <div className="landing__hero-bg" aria-hidden="true" />
        <div className="landing__hero-content">
          <div className="landing__badge">🏠 Bếp Nhà Mình</div>
          <h1 className="landing__title">
            Hương vị gia đình<br />
            <span className="landing__title-accent">đến tận cửa nhà bạn</span>
          </h1>
          <p className="landing__subtitle">
            Đặt món yêu thích từ Bếp Nhà Mình — giao hàng tận nơi, thanh toán khi nhận.
          </p>
          <div className="landing__ctas">
            <Link to="/order-online/menu" className="btn-primary-xl" id="cta-order-now">
              🍜 Đặt ngay
            </Link>
            <a href="#how-it-works" className="btn-ghost-xl" id="cta-how-it-works">
              Xem cách đặt
            </a>
          </div>
          <p className="landing__note">📍 Giao trong bán kính 10km · 💵 Thanh toán COD</p>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="landing__features">
        <div className="landing__container">
          <h2 className="landing__section-title">Tại sao chọn Bếp Nhà Mình?</h2>
          <div className="landing__features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3 className="feature-card__title">{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="landing__steps" id="how-it-works">
        <div className="landing__container">
          <h2 className="landing__section-title">Đặt hàng dễ dàng trong 3 bước</h2>
          <div className="landing__steps-row">
            {STEPS.map((s, i) => (
              <div key={s.num} className="step-card">
                <div className="step-card__num">{s.num}</div>
                <h3 className="step-card__label">{s.label}</h3>
                <p className="step-card__desc">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <div className="step-card__arrow" aria-hidden>→</div>
                )}
              </div>
            ))}
          </div>
          <div className="landing__cta-center">
            <Link to="/order-online/menu" className="btn-primary-xl" id="cta-start-ordering">
              Bắt đầu đặt hàng →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer note ──────────────────────────────────────────────── */}
      <footer className="landing__footer">
        <div className="landing__container">
          <p>© 2025 Bếp Nhà Mình · Hương vị gia đình</p>
          <p>
            <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
            {' · '}
            Gọi đặt: <a href="tel:+84901234567">0901 234 567</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
