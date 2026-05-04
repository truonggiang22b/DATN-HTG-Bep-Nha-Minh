/**
 * LandingPageV2.tsx — Bếp Nhà Mình · Editorial & Editorial Landing
 * UX Strategy: Editorial aesthetics, fast ordering context, reliable kitchen.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPageV2.css';

// ── SVG PICTOS ───────────────────────────────────────────────────────────────

const IconOffice = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const IconPerson = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconHeart = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 10l4 4 8-8"/>
  </svg>
);

const IconMenu = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16M4 12h16M4 18h7"/>
  </svg>
);

const IconPot = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h16c.3 3.6-2.7 7-6.3 7h-3.4c-3.6 0-6.6-3.4-6.3-7z"/>
    <path d="M3 12h18"/>
    <path d="M8 8v4"/>
    <path d="M12 7v5"/>
    <path d="M16 8v4"/>
  </svg>
);

const IconDelivery = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="12" height="10" rx="1"/>
    <path d="M15 11h3l2 4v6h-5"/>
    <circle cx="7" cy="21" r="2"/>
    <circle cx="17" cy="21" r="2"/>
  </svg>
);

// ── DATA ──────────────────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    icon: <IconOffice />,
    title: 'Tan làm muộn',
    desc: 'Không cần ghé chợ, không cần nhóm bếp. Chọn món, bếp nấu và giao đến.',
  },
  {
    icon: <IconPerson />,
    title: 'Ăn một mình vẫn chu đáo',
    desc: 'Một phần cơm nóng, có rau, có canh, có món mặn — đủ cho một bữa tử tế.',
  },
  {
    icon: <IconHeart />,
    title: 'Đặt cho người thân',
    desc: 'Gửi một bữa ăn nóng đến nhà bố mẹ, người yêu hoặc bạn bè khi bạn không ở gần.',
  },
];

const MENU_PREVIEWS = [
  {
    img: '/v2-bua-com.png',
    name: 'Cơm tấm sườn nướng',
    desc: 'Sườn cốt lết nướng than hoa, chả trứng hấp, bì heo chua ngọt.',
    price: '55.000đ',
  },
  {
    img: '/v2-canh-chua.png',
    name: 'Canh chua cá bông lau',
    desc: 'Nước dùng chua thanh từ me, cá tươi xắt khúc, thơm cà đậu bắp chua ngọt.',
    price: '75.000đ',
  },
  {
    img: '/v2-com-tam.png',
    name: 'Cơm gà kho sả ớt',
    desc: 'Gà ta kho keo đậm vị sả ớt, kèm phần dưa leo, cà chua giải ngấy.',
    price: '48.000đ',
  },
];

const REVIEWS = [
  {
    text: 'Cơm giao tới vẫn còn nóng, phần vừa đủ no. Hôm nào về trễ mình đặt ở đây cho nhanh để có bữa tối đàng hoàng.',
    author: 'Anh Minh / Nhân viên văn phòng'
  },
  {
    text: 'Không phải kiểu cơm hộp ăn cho xong. Có rau xanh, có canh ngọt, vị vừa miệng như cơm nhà nấu.',
    author: 'Lan Anh / Quận 3'
  },
  {
    text: 'Mình hay đặt cho mẹ ở nhà ăn trưa. Bếp gọi xác nhận kỹ đơn vị, giao cũng đúng giờ bảo đảm.',
    author: 'Quốc Bảo / Khách quen'
  }
];

const OB_STEPS = [
  {
    icon: <IconMenu />,
    title: 'Chọn món hôm nay',
    desc: 'Xem thực đơn đang mở bán mỗi ngày và lựa chọn một món ăn bạn muốn.',
  },
  {
    icon: <IconPot />,
    title: 'Bếp nấu & xác nhận',
    desc: 'Bếp ghi nhận đơn, nấu ngay món ăn và cập nhật thời gian giao cho bạn.',
  },
  {
    icon: <IconDelivery />,
    title: 'Nhận món tận nơi',
    desc: 'Thanh toán trực tiếp khi nhận hàng. Bữa cơm giao đến luôn đảm bảo đủ nóng.',
  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function LandingPageV2() {
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setStickyVisible(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for soft entrance
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('ed-reveal-in');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ed-landing">

      {/* ── NAV ── */}
      <nav className="ed-nav">
        <div className="ed-nav__inner">
          <Link to="/order-online" className="ed-nav__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <span>Bếp Nhà Mình</span>
          </Link>
          <div className="ed-nav__right">
            <Link to="/order-online/menu" className="ed-nav__link">Thực đơn</Link>
            <Link to="/order-online/menu" className="ed-btn ed-btn--primary ed-btn--sm">
              Trang đặt món
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="ed-hero">
        <div className="ed-hero__bg">
          <img src="/v2-bua-com.png" alt="Bữa cơm gia đình" />
          <div className="ed-hero__gradient" />
        </div>
        
        <div className="ed-hero__container">
          <div className="ed-hero__content">
            <div className="ed-badge" data-reveal>Giao tận nơi · Hôm nay</div>
            <h1 className="ed-hero__title" data-reveal>Đói lúc nào,<br/>bếp lo lúc đó.</h1>
            <p className="ed-hero__sub" data-reveal>
              Món quen nấu mới mỗi ngày, giao tận nơi khi bạn cần một bữa ăn nóng và tử tế.
            </p>
            <div className="ed-hero__actions" data-reveal>
              <Link to="/order-online/menu" className="ed-btn ed-btn--primary ed-btn--lg">
                Chọn món & đặt ngay
              </Link>
            </div>
            <div className="ed-hero__meta" data-reveal>
              <span>Bếp nhận đơn rồi mới nấu</span>
              <span className="ed-dot" />
              <span>Giao dự kiến 30–45 phút</span>
              <span className="ed-dot" />
              <span>Thanh toán khi nhận</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INSIGHT ── */}
      <section className="ed-insight">
        <div className="ed-container">
          <div className="ed-insight__grid">
            {INSIGHTS.map((item, i) => (
              <div key={item.title} className="ed-insight-card" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="ed-insight-card__icon">{item.icon}</div>
                <h3 className="ed-insight-card__title">{item.title}</h3>
                <p className="ed-insight-card__desc">{item.desc}</p>
                <Link to="/order-online/menu" className="ed-link">Chọn món ngay →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. MENU PREVIEWS ── */}
      <section className="ed-menu">
        <div className="ed-container">
          <header className="ed-section-head" data-reveal>
            <h2 className="ed-section-title">Hôm nay bếp có món gì?</h2>
            <p className="ed-section-sub">Thực đơn thay đổi theo ngày, món nào cũng dễ ăn, đủ no và hợp bữa.</p>
          </header>

          <div className="ed-menu__grid">
            {MENU_PREVIEWS.map((menu, i) => (
              <div key={menu.name} className="ed-menu-card" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="ed-menu-card__img">
                  <img src={menu.img} alt={menu.name} loading="lazy" />
                </div>
                <div className="ed-menu-card__body">
                  <h3 className="ed-menu-card__name">{menu.name}</h3>
                  <p className="ed-menu-card__desc">{menu.desc}</p>
                  <div className="ed-menu-card__foot">
                    <span className="ed-menu-card__price">{menu.price}</span>
                    <Link to="/order-online/menu" className="ed-btn ed-btn--secondary ed-btn--sm">
                      Thêm vào giỏ
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. KITCHEN TRUTH ── */}
      <section className="ed-trust">
        <div className="ed-container ed-trust__inner">
          <div className="ed-trust__text" data-reveal>
            <h2 className="ed-section-title">Bếp nhỏ,<br/>nấu kỹ từng phần.</h2>
            <p className="ed-section-sub">
              Bếp chuẩn bị nguyên liệu trong ngày, nhận đơn rồi mới hoàn thiện món và đóng gói cẩn thận trước khi giao.
            </p>
            <ul className="ed-trust__list">
              <li><IconCheck /> <span>Nguyên liệu chuẩn bị mới trong ngày</span></li>
              <li><IconCheck /> <span>Hoàn thiện món sau khi xác nhận đơn</span></li>
              <li><IconCheck /> <span>Đóng gói kỹ để giữ nhiệt tốt hơn</span></li>
              <li><IconCheck /> <span>Bếp gọi xác nhận trước khi giao</span></li>
              <li><IconCheck /> <span>Không bán món để qua ngày</span></li>
            </ul>
          </div>
          <div className="ed-trust__visual" data-reveal>
            <img src="/v2-canh-chua.png" alt="Bếp nấu" />
          </div>
        </div>
      </section>

      {/* ── 5. SOCIAL PROOF ── */}
      <section className="ed-proof">
        <div className="ed-container">
          <h2 className="ed-section-title" data-reveal>Khách quen nói gì về bếp?</h2>
          <div className="ed-proof__grid">
            {REVIEWS.map((rev, i) => (
              <div key={i} className="ed-proof-card" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <p className="ed-proof-card__text">“{rev.text}”</p>
                <p className="ed-proof-card__author">{rev.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. HOW IT WORKS ── */}
      <section className="ed-steps">
        <div className="ed-container">
          <header className="ed-section-head ed-section-head--center" data-reveal>
            <h2 className="ed-section-title">Ba bước là có bữa ăn nóng.</h2>
          </header>
          <div className="ed-steps__grid">
            {OB_STEPS.map((step, i) => (
              <div key={i} className="ed-step" data-reveal style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="ed-step__icon">{step.icon}</div>
                <h3 className="ed-step__title">{step.title}</h3>
                <p className="ed-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FINALE ── */}
      <section className="ed-finale">
        <div className="ed-container" data-reveal>
          <h2 className="ed-section-title">Hôm nay bạn muốn ăn gì?</h2>
          <p className="ed-section-sub">Thực đơn thay đổi theo ngày. Chọn món đang có và đặt ngay trong vài bước.</p>
          <Link to="/order-online/menu" className="ed-btn ed-btn--primary ed-btn--lg">
            Xem thực đơn & đặt món
          </Link>
          <div className="ed-finale__meta">
            <span>Giao tận nơi</span>
            <span className="ed-dot" />
            <span>Thanh toán khi nhận</span>
            <span className="ed-dot" />
            <span>Món nấu trong ngày</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ed-footer">
        <div className="ed-container ed-footer__inner">
          <div className="ed-footer__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <div className="ed-footer__brand-text">
              <strong>Bếp Nhà Mình</strong>
              <span>Ấm cúng · Món quen · Giao tận nơi</span>
            </div>
          </div>
          <div className="ed-footer__links">
            <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
            <a href="tel:+84901234567">0901 234 567</a>
          </div>
        </div>
      </footer>

      {/* ── STICKY BAR ── */}
      <div className={`ed-sticky-bar ${stickyVisible ? 'is-visible' : ''}`}>
        <div className="ed-sticky-bar__inner">
          <div className="ed-sticky-bar__text">
            <span className="ed-status-dot" aria-label="Đang nhận đơn" />
            <span>Bếp đang nhận đơn · Giao dự kiến 30–45 phút</span>
          </div>
          <Link to="/order-online/menu" className="ed-btn ed-btn--primary">
            Đặt món
          </Link>
        </div>
      </div>

    </div>
  );
}
