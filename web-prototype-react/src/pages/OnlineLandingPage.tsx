/**
 * OnlineLandingPage.tsx
 * Keep operational links unchanged: /order-online/menu and /qr/qr-bnm-table-01.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OnlineLandingPage.css';

const IconDelivery = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="1" y="3" width="15" height="13" rx="1.5" />
    <path d="M16 8h4l3 5v3h-7V8z" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const IconClock = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCash = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconPin = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconPhone = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.66 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.23a2 2 0 0 1 2.11-.45c.91.31 1.85.53 2.81.66A2 2 0 0 1 22 16.92z" />
  </svg>
);

const HeroSteam = ({ variant = '' }: { variant?: string }) => (
  <div className={`landing__steam ${variant}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
);

const SERVICE_POINTS = [
  { Icon: IconDelivery, title: 'Giao tận nơi', desc: 'Giao trong bán kính 10km, phí ship từ 15.000đ.' },
  { Icon: IconClock, title: 'Biết thời gian chờ', desc: 'Ước tính thời gian giao ngay khi bạn đặt món.' },
  { Icon: IconCash, title: 'Thanh toán COD', desc: 'Nhận món rồi thanh toán, rõ ràng và tiện lợi.' },
  { Icon: IconPin, title: 'Theo dõi đơn', desc: 'Xem trạng thái đơn hàng theo thời gian thực.' },
];

const STEPS = [
  { num: '01', label: 'Chọn món', desc: 'Duyệt thực đơn và thêm món yêu thích vào giỏ.' },
  { num: '02', label: 'Nhập thông tin', desc: 'Điền địa chỉ, số điện thoại và ghi chú giao hàng.' },
  { num: '03', label: 'Chờ bếp giao', desc: 'Xác nhận đơn, theo dõi trạng thái và nhận món tại nhà.' },
];

const COMMITMENTS = [
  { Icon: IconPin, value: '10km', label: 'Bán kính giao hàng' },
  { Icon: IconCash, value: 'COD', label: 'Thanh toán khi nhận' },
  { Icon: IconClock, value: "30'", label: 'Thời gian trung bình' },
];

const FEATURED_DISHES = [
  { image: '/v2-com-tam.png', name: 'Cơm tấm sườn trứng', tag: 'Bán chạy', price: '65.000đ' },
  { image: '/v2-canh-chua.png', name: 'Canh chua nóng', tag: 'Món nhà', price: '79.000đ' },
  { image: '/v2-bua-com.png', name: 'Bữa cơm đủ vị', tag: 'Gợi ý hôm nay', price: '129.000đ' },
];

export function OnlineLandingPage() {
  useEffect(() => {
    const animatedItems = Array.from(document.querySelectorAll<HTMLElement>('[data-animate]'));
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      animatedItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.14 },
    );

    animatedItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      <div className="landing__topline">
        <div className="landing__topline-inner">
          <span>Bếp nhận đơn online mỗi ngày</span>
          <span>Giao trong 10km</span>
          <a href="tel:+84901234567">
            <IconPhone />
            0901 234 567
          </a>
        </div>
      </div>

      <header className="landing__header">
        <div className="landing__header-brand">
          <img src="/logo.png" alt="Bếp Nhà Mình" />
          <span>Bếp Nhà Mình</span>
        </div>
        <nav className="landing__nav" aria-label="Điều hướng nhanh">
          <a href="#featured-dishes-title">Món ngon</a>
          <a href="#service-title">Dịch vụ</a>
          <a href="#how-it-works">Quy trình</a>
        </nav>
        <div className="landing__header-actions">
          <a href="tel:+84901234567" className="landing__header-phone" aria-label="Gọi Bếp Nhà Mình">
            <IconPhone />
          </a>
          <Link to="/order-online/menu" className="landing__header-cta" id="header-cta">
            Đặt ngay
          </Link>
        </div>
      </header>

      <main>
        <section className="landing__hero" aria-labelledby="online-landing-title">
          <div className="landing__motion-rings" aria-hidden="true">
            <span />
            <span />
          </div>

          <div className="landing__hero-inner">
            <div className="landing__hero-text" data-animate>
              <div className="landing__tag">Giao hàng tận nơi</div>
              <h1 className="landing__title" id="online-landing-title">
                Bữa cơm nhà mình, giao nóng đến tận cửa.
              </h1>
              <p className="landing__subtitle">
                Chọn món quen vị, xác nhận nhanh và theo dõi đơn ngay trên điện thoại.
                Bếp nhận đơn online mỗi ngày, thanh toán khi nhận món.
              </p>

              <div className="landing__ctas">
                <Link to="/order-online/menu" className="landing__btn-primary" id="cta-order-now">
                  Đặt hàng ngay
                </Link>
                <a href="#how-it-works" className="landing__btn-ghost" id="cta-how-it-works">
                  Xem cách đặt
                </a>
              </div>

              <div className="landing__badges" aria-label="Cam kết nhanh">
                <span className="landing__badge-pill">
                  <span className="landing__badge-dot" />
                  Giao trong 10km
                </span>
                <span className="landing__badge-pill">
                  <span className="landing__badge-dot landing__badge-dot--turmeric" />
                  COD khi nhận
                </span>
              </div>
            </div>

            <div className="landing__hero-visual" aria-label="Món ăn nổi bật của Bếp Nhà Mình" data-animate>
              <div className="landing__photo-grid">
                <div className="landing__photo-main">
                  <img
                    src="/hero-food.png"
                    alt="Cơm tấm sườn của Bếp Nhà Mình"
                    loading="eager"
                    width={600}
                    height={460}
                  />
                  <HeroSteam />
                  <div className="landing__heat-dots" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="landing__photo-status">
                    <span className="landing__photo-status-dot" />
                    Giao ngay hôm nay
                  </div>
                </div>
                <div className="landing__side-card landing__side-card--soup">
                  <img src="/v2-canh-chua.png" alt="Canh chua nóng" className="landing__photo-side" />
                  <HeroSteam variant="landing__steam--side" />
                </div>
                <div className="landing__side-card landing__side-card--meal">
                  <img src="/v2-bua-com.png" alt="Bữa cơm gia đình" className="landing__photo-side" />
                  <div className="landing__plate-orbit" aria-hidden="true">
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing__commitments" aria-label="Thông tin giao hàng">
          <div className="landing__commitments-inner">
            {COMMITMENTS.map(({ Icon, value, label }) => (
              <div key={label} className="commitment-pill" data-animate>
                <span className="commitment-pill__icon">
                  <Icon />
                </span>
                <span className="commitment-pill__value">{value}</span>
                <span className="commitment-pill__label">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing__featured" aria-labelledby="featured-dishes-title">
          <div className="landing__container landing__section-head" data-animate>
            <div>
              <div className="landing__section-label">Gợi ý hôm nay</div>
              <h2 className="landing__section-title" id="featured-dishes-title">
                Món được gọi nhiều
              </h2>
            </div>
            <Link to="/order-online/menu" className="landing__text-link">
              Xem thực đơn
            </Link>
          </div>
          <div className="landing__featured-grid">
            {FEATURED_DISHES.map((dish) => (
              <article key={dish.name} className="featured-dish" data-animate>
                <img src={dish.image} alt={dish.name} loading="lazy" />
                <div className="featured-dish__body">
                  <span>{dish.tag}</span>
                  <h3>{dish.name}</h3>
                  <div className="featured-dish__meta">
                    <strong>{dish.price}</strong>
                    <Link to="/order-online/menu">Đặt món</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing__spotlight" aria-labelledby="spotlight-title">
          <div className="landing__container landing__spotlight-inner">
            <div className="landing__spotlight-photo" data-animate>
              <img src="/v2-hero.png" alt="Không gian bữa cơm của Bếp Nhà Mình" loading="lazy" />
            </div>
            <div className="landing__spotlight-content" data-animate>
              <div className="landing__section-label">Bếp gần bạn</div>
              <h2 className="landing__section-title" id="spotlight-title">
                Món nhà nấu xong mới giao, giữ nóng tới khi bạn nhận.
              </h2>
              <p>
                Bếp ưu tiên xác nhận nhanh, đóng gói gọn và cập nhật trạng thái đơn để bạn biết món đang ở bước nào.
              </p>
              <div className="landing__spotlight-stats" aria-label="Thông tin vận hành">
                <span>
                  <strong>Q1</strong>
                  Chi nhánh phục vụ
                </span>
                <span>
                  <strong>10km</strong>
                  Khu vực giao
                </span>
                <span>
                  <strong>COD</strong>
                  Thanh toán khi nhận
                </span>
              </div>
              <Link to="/order-online/menu" className="landing__btn-primary">
                Xem món đang bán
              </Link>
            </div>
          </div>
        </section>

        <section className="landing__features" aria-labelledby="service-title">
          <div className="landing__container landing__features-layout">
            <div className="landing__service-panel" data-animate>
              <div className="landing__section-label">Dịch vụ</div>
              <h2 className="landing__section-title" id="service-title">
                Đặt online nhưng vẫn giữ cảm giác quầy bếp quen.
              </h2>
              <p>
                Mọi điểm chạm được giữ ngắn gọn: chọn món, xác nhận thông tin,
                theo dõi đơn và nhận món. Không cần tạo tài khoản.
              </p>
            </div>

            <div className="landing__features-grid">
              {SERVICE_POINTS.map(({ Icon, title, desc }) => (
                <article key={title} className="feature-row" data-animate>
                  <div className="feature-row__icon-wrap">
                    <Icon />
                  </div>
                  <div className="feature-row__body">
                    <h3 className="feature-row__title">{title}</h3>
                    <p className="feature-row__desc">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing__steps" id="how-it-works" aria-labelledby="steps-title">
          <div className="landing__steps-inner">
            <div data-animate>
              <div className="landing__section-label">Quy trình</div>
              <h2 className="landing__section-title" id="steps-title">
                Đặt hàng dễ dàng trong 3 bước
              </h2>
            </div>
            <div className="landing__steps-list">
              {STEPS.map((step) => (
                <article key={step.num} className="step-row" data-animate>
                  <div className="step-row__num">{step.num}</div>
                  <div className="step-row__body">
                    <h3 className="step-row__label">{step.label}</h3>
                    <p className="step-row__desc">{step.desc}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="landing__cta-center">
              <Link to="/order-online/menu" className="landing__btn-primary" id="cta-start-ordering">
                Bắt đầu đặt hàng
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <div className="landing__footer-brand">Bếp Nhà Mình</div>
          <div className="landing__footer-links">
            <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
            <a href="tel:+84901234567">0901 234 567</a>
          </div>
          <div className="landing__footer-copy">© 2026 Bếp Nhà Mình · Hương vị gia đình</div>
        </div>
      </footer>
    </div>
  );
}
