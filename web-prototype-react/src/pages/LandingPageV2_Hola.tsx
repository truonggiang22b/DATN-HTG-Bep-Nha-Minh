import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createTimeline, stagger, animate } from 'animejs';
import './LandingPageV2.css';
import './LandingPageV2_Hola.css';

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

const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const IconMapPin = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ── DATA ──────────────────────────────────────────────────────────────────────

const INSIGHTS = [
  {
    icon: <IconOffice />,
    eyebrow: 'Giờ cao điểm',
    title: 'Deadline, OT, tan ca muộn',
    desc: 'Đến bữa nhưng chưa kịp nghĩ xem ăn gì. Bếp nhận đơn gọn, nấu nóng và giao thẳng tới nơi bạn đang kẹt việc.',
    accent: 'Có đồ ăn tử tế mà không phải rời guồng.',
  },
  {
    icon: <IconHeart />,
    eyebrow: 'Đổi mood',
    title: 'Một quán, hai mood ăn',
    desc: 'Muốn cơm Việt chắc bụng hay muốn đổi gió sang món Âu cho bữa tối nhẹ đầu, menu vẫn giữ cảm giác gần mà không nhàm.',
    accent: 'Không phải chọn giữa no bụng và vui miệng.',
  },
  {
    icon: <IconPerson />,
    eyebrow: 'Ăn cho ra ăn',
    title: 'Nhanh nhưng vẫn có chăm chút',
    desc: 'Khẩu phần đầy, đóng gói gọn, món lên tay vẫn sạch sẽ và đủ cảm giác bữa ăn thật chứ không phải chống đói cho xong.',
    accent: 'Đó là phần khác biệt người ta nhớ lại để đặt lần sau.',
  },
];

const MENU_PREVIEWS = [
  {
    img: '/v2-bua-com.png',
    name: 'Bít-tết Chảo Gang (Steak)',
    desc: 'Bò Úc mềm mọng xèo xèo, khoai tây chiên giòn rụm cùng sốt tiêu đen đậm đà. Ăn cực "cuốn".',
    price: '75.000đ',
    tag: 'Đổi gió sau giờ làm',
  },
  {
    img: '/v2-canh-chua.png',
    name: 'Mì Ý Bò Bằm (Bolognese)',
    desc: 'Sốt bò bằm hầm cà chua chua ngọt ngọt, phủ phô mai béo ngậy. Giao chớp nhoáng tới KTX.',
    price: '45.000đ',
    tag: 'Món dễ gọi buổi tối',
  },
  {
    img: '/v2-com-tam.png',
    name: 'Cơm Gà Khìa Nước Dừa',
    desc: 'Quen thuộc nhưng hao cơm. Gà khìa đậm vị, ăn cùng dưa leo thanh mát 100% no nê.',
    price: '48.000đ',
    tag: 'Chắc bụng lúc cần nạp lại',
  },
];

const REVIEWS = [
  {
    label: 'Mùa thi',
    text: 'Cứ tới tuần thi là mình gần như sống ở thư viện. Có hôm gọi cơm cho chắc bụng, có hôm đổi gió sang bít-tết. Đồ tới vẫn nóng nên ăn xong tỉnh người làm tiếp.',
    author: 'Minh Tuấn / Sinh viên FPTU'
  },
  {
    label: 'Giờ trưa F-Town',
    text: 'Team mình hay gọi theo nhóm vào giờ trưa. Điểm ăn tiền là món tới nơi vẫn chỉn chu, không bị cảm giác cơm hộp công nghiệp.',
    author: 'Trâm Anh / Nhân viên khu CNC'
  },
  {
    label: 'Cuối ngày',
    text: 'Lúc OT về muộn, chỉ cần một phần ăn nóng giao tới sảnh là thấy ngày đỡ gắt hẳn. Hộp gọn, món sạch, ăn xong không ngán.',
    author: 'Khánh Vy / Cư dân Hòa Lạc'
  }
];

const OB_STEPS = [
  {
    icon: <IconMenu />,
    title: 'Mở menu lúc đang bận',
    desc: 'Không cần nghĩ nhiều. Vào menu, lướt nhanh vài món đúng mood hôm đó rồi chốt đơn trong vài nhịp.',
  },
  {
    icon: <IconPot />,
    title: 'Bếp xác nhận và nấu ngay',
    desc: 'Đơn vào là bếp bắt đầu hoàn thiện món, đóng gói gọn và báo lại thời gian giao để bạn chủ động việc đang làm.',
    },
  {
    icon: <IconDelivery />,
    title: 'Nhận món tại đúng điểm hẹn',
    desc: 'Từ sảnh tòa nhà tới khu ký túc, đồ ăn tới tay vẫn đủ nóng để bữa đó không còn là giải pháp tạm bợ.',
  },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export function LandingPageV2_Hola() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [stickyBottom, setStickyBottom] = useState('1.5rem');
  const heroRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setStickyVisible(window.scrollY > 500);
      // Push sticky bar up when footer enters viewport
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const viewportH = window.innerHeight;
        if (footerRect.top < viewportH) {
          const overlap = viewportH - footerRect.top;
          setStickyBottom(`${overlap + 16}px`);
        } else {
          setStickyBottom('1.5rem');
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Anime.js Staggered Reveal for Hero (v4 API)
  useEffect(() => {
    if (!heroRef.current) return;

    const elements = Array.from(heroRef.current.querySelectorAll<HTMLElement>('[data-hero-reveal]'));
    const bgImg = heroRef.current.querySelector('.ed-hero__bg img') as HTMLElement | null;

    // Reset opacity initially
    elements.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(40px)'; });
    if (bgImg) bgImg.style.opacity = '0';

    // Staggered reveal using v4 createTimeline
    const tl = createTimeline({ defaults: { ease: 'outExpo' } });

    tl.add(elements, {
      opacity: [0, 1],
      translateY: [40, 0],
      duration: 900,
      delay: stagger(150, { start: 300 }),
    });

    if (bgImg) {
      animate(bgImg, {
        opacity: [0, 1],
        scale: [1.05, 1],
        duration: 1800,
        ease: 'outQuart',
        delay: 200,
      });
    }
  }, []); // Run once on mount

  // Magnetic Button Effect
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      
      const pull = 0.25; 
      btn.style.transform = `translate(${x * pull}px, ${y * pull}px)`;
    };

    const handleMouseLeave = () => {
      btn.style.transform = `translate(0px, 0px)`;
    };

    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // IntersectionObserver for standard soft entrance
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
    // Don't target hero elements, only normal ones
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="ed-landing ed-landing--hola">

      {/* ── NAV ── */}
      <nav className="ed-nav">
        <div className="ed-nav__inner">
          <Link to="/order-online" className="ed-nav__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <span>Bếp Nhà Mình</span>
          </Link>
          <div className="ed-nav__right">
            <span className="ed-nav__microcopy">Giao nội khu Hòa Lạc</span>
            <Link to="/order-online/menu" className="ed-nav__link">Xem menu</Link>
            <Link to="/order-online/menu" className="ed-btn ed-btn--primary ed-btn--sm">
              Đặt món ngay
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 1. HERO ── */}
      <section className="ed-hero" ref={heroRef}>
        <div className="ed-hero__bg">
          <img src="/v2-bua-com.png" alt="Bữa cơm gia đình" style={{ opacity: 0, willChange: 'transform, opacity' }} />
          <div className="ed-hero__gradient" />
        </div>
        
        <div className="ed-hero__container">
          <div className="ed-hero__content">
            <div className="ed-badge" data-hero-reveal style={{ willChange: 'transform, opacity' }}>Bữa tử tế cho nhịp sống Hòa Lạc</div>
            <h1 className="ed-hero__title" data-hero-reveal style={{ willChange: 'transform, opacity' }}>Chạy deadline?<br/>Có <span className="ed-highlight">bếp chiều.</span></h1>
            <p className="ed-hero__sub" data-hero-reveal style={{ willChange: 'transform, opacity' }}>
              Từ KTX, khu CNC đến những hôm tan ca muộn, đây là chỗ để gọi một bữa ăn đủ ngon, đủ gọn và đủ nóng khi bạn không còn thời gian lo cho mình.
            </p>
            <div className="ed-hero__actions" data-hero-reveal style={{ willChange: 'transform, opacity' }}>
              <Link 
                to="/order-online/menu" 
                className="ed-btn ed-btn--primary ed-btn--lg"
                ref={btnRef}
                style={{ transition: 'transform 0.1s ease-out, background-color 0.2s, box-shadow 0.2s', willChange: 'transform' }}
              >
                Chọn món & đặt ngay
              </Link>
            </div>
            <div className="ed-hero__meta" data-hero-reveal style={{ willChange: 'transform, opacity' }}>
              <div className="ed-hero__meta-item"><IconCheck /> Cơm Việt lẫn món Âu đều vào gu</div>
              <div className="ed-hero__meta-item"><IconCheck /> Giao chớp nhoáng 30 phút</div>
              <div className="ed-hero__meta-item"><IconCheck /> Giá vẫn dễ vào ngay cả cuối tháng</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. INSIGHT ── */}
      <section className="ed-insight">
        <div className="ed-container">
          <header className="ed-section-head ed-section-head--narrow" data-reveal>
            <h2 className="ed-section-title">Không chỉ là chỗ đặt đồ ăn.</h2>
            <p className="ed-section-sub">Đây là kiểu quán bạn nhớ tới ngay khi đói mà vẫn muốn ăn cho ra một bữa.</p>
          </header>
          <div className="ed-insight__grid">
            {INSIGHTS.map((item, i) => (
              <div key={item.title} className="ed-insight-card ed-insight-card--hola" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="ed-insight-card__icon">{item.icon}</div>
                <div className="ed-insight-card__eyebrow">{item.eyebrow}</div>
                <h3 className="ed-insight-card__title">{item.title}</h3>
                <p className="ed-insight-card__desc">{item.desc}</p>
                <p className="ed-insight-card__accent">{item.accent}</p>
                <Link to="/order-online/menu" className="ed-link">Xem menu phù hợp →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. MENU PREVIEWS ── */}
      <section className="ed-menu">
        <div className="ed-container">
          <header className="ed-section-head" data-reveal>
            <h2 className="ed-section-title">Nhìn món là muốn bấm đặt ngay.</h2>
            <p className="ed-section-sub">Menu nên làm hai việc cùng lúc: cứu đói nhanh và khiến bạn thấy bữa đó đáng để chờ vài chục phút.</p>
          </header>

          <div className="ed-menu__grid">
            {MENU_PREVIEWS.map((menu, i) => (
              <div key={menu.name} className="ed-menu-card ed-menu-card--hola" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="ed-menu-card__img">
                  <img src={menu.img} alt={menu.name} loading="lazy" />
                </div>
                <div className="ed-menu-card__body">
                  <div className="ed-menu-card__tag">{menu.tag}</div>
                  <h3 className="ed-menu-card__name">{menu.name}</h3>
                  <p className="ed-menu-card__desc">{menu.desc}</p>
                  <div className="ed-menu-card__foot">
                    <span className="ed-menu-card__price">{menu.price}</span>
                    <Link to="/order-online/menu" className="ed-btn ed-btn--secondary ed-btn--sm">
                      Xem món này
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
            <h2 className="ed-section-title">Nấu cho Hòa Lạc,<br/>phục vụ tận tâm.</h2>
            <p className="ed-section-sub">
              Dù là một suất bít-tết kiểu Âu hay cơm sườn cốt lết, chúng tôi đều chọn nguyên liệu kỹ lưỡng để mang đến bữa ăn chất lượng nhất cho dân cư Hòa Lạc.
            </p>
            <ul className="ed-trust__list">
              <li><IconCheck /> <span>Giá hạt dẻ nhưng nguyên liệu luôn tươi mới</span></li>
              <li><IconCheck /> <span>Trải nghiệm Món Âu với chất lượng đáng thử</span></li>
              <li><IconCheck /> <span>Khẩu phần đầy đặn, đủ sức chạy OT & Đồ án</span></li>
              <li><IconCheck /> <span>Đóng gói kín đáo, giao tới sảnh Dom vẫn xèo xèo</span></li>
              <li><IconCheck /> <span>Luôn lắng nghe phản hồi từ cư dân</span></li>
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
          <h2 className="ed-section-title" data-reveal>Người ở Hòa Lạc nhớ điều gì nhất?</h2>
          <div className="ed-proof__grid">
            {REVIEWS.map((rev, i) => (
              <div key={i} className="ed-proof-card ed-proof-card--hola" data-reveal style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="ed-proof-card__label">{rev.label}</div>
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
            <h2 className="ed-section-title">Một cơn đói ở Hòa Lạc thường kết thúc như thế này.</h2>
            <p className="ed-section-sub">Flow đủ rõ để không phải nghĩ nhiều, đủ nhanh để không làm vỡ mạch công việc.</p>
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
        <div className="ed-finale__bg-shape" />
        <div className="ed-container">
          <div className="ed-finale__grid">
            <div className="ed-finale__left" data-reveal>
              <div className="ed-finale__subtitle">Bếp Đang Mở</div>
              <h2 className="ed-section-title">Nếu đã đói, đừng để bữa tối thành giải pháp tạm.</h2>
              <p className="ed-section-sub">Mở menu để chọn ngay một món hợp mood hôm nay. Bếp xác nhận, hoàn thiện món và giao đến điểm hẹn trong nội khu Hòa Lạc.</p>
              
              <div className="ed-finale__actions">
                <Link to="/order-online/menu" className="ed-btn ed-btn--primary ed-btn--lg">
                  Xem thực đơn & đặt món
                </Link>
                <a href="tel:+84901234567" className="ed-btn ed-btn--secondary ed-btn--lg">
                  Cần hỏi nhanh? Gọi bếp
                </a>
              </div>

              <div className="ed-finale__badges">
                <span className="ed-finale__badge">Món nấu trong ngày</span>
                <span className="ed-finale__badge">Giao tận nơi</span>
                <span className="ed-finale__badge">Thanh toán khi nhận</span>
                <span className="ed-finale__badge">Hợp cả giờ trưa lẫn cuối ngày</span>
              </div>
            </div>

            <div className="ed-finale__right">
              <div className="ed-info-card ed-delay-1" data-reveal>
                <div className="ed-info-card__icon"><IconClock /></div>
                <div className="ed-info-card__text">
                  <h4>Giờ bếp mở</h4>
                  <p>09:00 - 20:30 (Cả cuối tuần)</p>
                </div>
              </div>
              
              <div className="ed-info-card ed-delay-2" data-reveal>
                <div className="ed-info-card__icon"><IconMapPin /></div>
                <div className="ed-info-card__text">
                  <h4>Khu vực giao</h4>
                  <p>Nội khu Hòa Lạc & Làng Đại Học</p>
                </div>
              </div>

              <div className="ed-info-card ed-delay-3" data-reveal>
                <div className="ed-info-card__icon"><IconDelivery /></div>
                <div className="ed-info-card__text">
                  <h4>Nhịp giao thường gặp</h4>
                  <p>Hợp nhất cho giờ trưa, đầu tối và những hôm OT về muộn</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ed-footer" ref={footerRef}>
        <div className="ed-container ed-footer__inner">
          <div className="ed-footer__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <div className="ed-footer__brand-text">
              <strong>Bếp Nhà Mình</strong>
              <span>Góc ẩm thực quen thuộc Hola · Cơm Việt & Món Âu</span>
            </div>
          </div>
          <div className="ed-footer__links">
            <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
            <a href="tel:+84901234567">0901 234 567</a>
          </div>
        </div>
      </footer>

      {/* ── STICKY BAR ── */}
      <div className={`ed-sticky-bar ${stickyVisible ? 'is-visible' : ''}`} style={{ bottom: stickyBottom }}>
        <div className="ed-sticky-bar__inner">
          <div className="ed-sticky-bar__text">
            <span className="ed-status-dot" aria-label="Đang nhận đơn" />
            <span>Bếp đang nhận đơn nội khu Hòa Lạc</span>
          </div>
          <Link to="/order-online/menu" className="ed-btn ed-btn--primary">
            Đặt món
          </Link>
        </div>
      </div>

    </div>
  );
}
