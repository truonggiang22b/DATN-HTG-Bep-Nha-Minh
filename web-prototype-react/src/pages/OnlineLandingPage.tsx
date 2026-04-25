/**
 * OnlineLandingPage.tsx — redesigned to match customer UI design system
 * Warm earthy theme, Be Vietnam Pro, mobile-first, no emoji icons
 */

import { Link } from 'react-router-dom';
import './OnlineLandingPage.css';

// ── SVG icons (inline, consistent with MenuPage/AdminLayout) ───────────────
const IconDelivery = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1.5" /><path d="M16 8h4l3 5v3h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const IconCash = () => (
  <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
);
const IconPin = () => (
  <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

const FEATURES = [
  { Icon: IconDelivery, title: 'Giao tận nơi', desc: 'Giao hàng trong bán kính 10km, phí ship từ 15.000đ' },
  { Icon: IconClock,    title: 'Nhanh chóng',  desc: 'Ước tính thời gian giao hàng ngay khi đặt món' },
  { Icon: IconCash,     title: 'Thanh toán khi nhận', desc: 'COD — Trả tiền mặt khi nhận hàng, an toàn và tiện lợi' },
  { Icon: IconPin,      title: 'Theo dõi đơn', desc: 'Xem trạng thái đơn theo thời gian thực' },
];

const STEPS = [
  { num: '1', label: 'Chọn món',    desc: 'Duyệt thực đơn & thêm vào giỏ' },
  { num: '2', label: 'Thông tin giao', desc: 'Nhập địa chỉ & số điện thoại' },
  { num: '3', label: 'Xác nhận',   desc: 'Kiểm tra & đặt hàng' },
];

const INFO = [
  { value: '10km',  label: 'Bán kính giao hàng' },
  { value: 'COD',   label: 'Thanh toán khi nhận' },
  { value: '30\'',  label: 'Thời gian giao trung bình' },
];

export function OnlineLandingPage() {
  return (
    <div className="landing">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="landing__header">
        <div className="landing__header-brand">
          <img src="/logo.png" alt="Bếp Nhà Mình" />
          Bếp Nhà Mình
        </div>
        <Link to="/order-online/menu" className="landing__header-cta" id="header-cta">
          Đặt ngay
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="landing__hero">
        <div className="landing__logo-wrap">
          <img src="/logo.png" alt="Bếp Nhà Mình" className="landing__logo" />
        </div>

        <div className="landing__tag">Giao hàng tận nơi</div>

        <h1 className="landing__title">
          Hương vị gia đình<br />
          <span className="landing__title-accent">đến tận cửa nhà bạn</span>
        </h1>

        <p className="landing__subtitle">
          Đặt món yêu thích từ Bếp Nhà Mình — giao hàng tận nơi, thanh toán khi nhận.
        </p>

        <div className="landing__ctas">
          <Link to="/order-online/menu" className="landing__btn-primary" id="cta-order-now">
            Đặt hàng ngay
          </Link>
          <a href="#how-it-works" className="landing__btn-ghost" id="cta-how-it-works">
            Xem cách đặt
          </a>
        </div>

        <div className="landing__badges">
          <div className="landing__badge-pill">
            <span className="landing__badge-dot" />
            Giao trong 10km
          </div>
          <div className="landing__badge-pill">
            <span className="landing__badge-dot" style={{ background: 'var(--color-turmeric)' }} />
            Thanh toán COD
          </div>
        </div>
      </section>

      {/* ── Info strip ─────────────────────────────────────────────── */}
      <div className="landing__info-strip">
        <div className="landing__container">
          <div className="landing__info-strip-inner">
            {INFO.map((item) => (
              <div key={item.label} className="info-card">
                <div className="info-card__value">{item.value}</div>
                <div className="info-card__label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="landing__features">
        <div className="landing__container">
          <div className="landing__section-label">Dịch vụ</div>
          <h2 className="landing__section-title">Tại sao chọn Bếp Nhà Mình?</h2>
          <div className="landing__features-list">
            {FEATURES.map(({ Icon, title, desc }) => (
              <div key={title} className="feature-row">
                <div className="feature-row__icon-wrap">
                  <Icon />
                </div>
                <div className="feature-row__body">
                  <div className="feature-row__title">{title}</div>
                  <div className="feature-row__desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="landing__steps" id="how-it-works">
        <div className="landing__container">
          <div className="landing__section-label">Quy trình</div>
          <h2 className="landing__section-title">Đặt hàng dễ dàng trong 3 bước</h2>
          <div className="landing__steps-list">
            {STEPS.map((s) => (
              <div key={s.num} className="step-row">
                <div className="step-row__num">{s.num}</div>
                <div className="step-row__body">
                  <div className="step-row__label">{s.label}</div>
                  <div className="step-row__desc">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="landing__cta-center">
            <Link to="/order-online/menu" className="landing__btn-primary" id="cta-start-ordering">
              Bắt đầu đặt hàng
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="landing__footer">
        <div className="landing__footer-brand">Bếp Nhà Mình</div>
        <div className="landing__footer-links">
          <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
          <a href="tel:+84901234567">0901 234 567</a>
        </div>
        <div className="landing__footer-copy">© 2025 Bếp Nhà Mình · Hương vị gia đình</div>
      </footer>
    </div>
  );
}
