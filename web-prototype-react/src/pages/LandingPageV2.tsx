/**
 * LandingPageV2.tsx — Bếp Nhà Mình · Story-First Landing
 * Design philosophy: Emotion → Empathy → Trust → Hunger → Action
 * "Đây không phải trang bán đồ ăn. Đây là nơi mang bữa cơm gia đình đến cho bạn."
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPageV2.css';

// ── Data ─────────────────────────────────────────────────────────────────────

const EMPATHY_MOMENTS = [
  {
    id: 'busy',
    time: '20:14',
    scene: 'Bạn vẫn đang ngồi bàn làm việc.',
    feeling: 'Bụng đói từ trưa. Bếp ở nhà chắc nguội lâu rồi.',
    icon: '💻',
  },
  {
    id: 'alone',
    time: '18:45',
    scene: 'Về đến nhà, mở tủ lạnh ra.',
    feeling: 'Nấu cho một người thôi thì... thôi kệ.',
    icon: '🏠',
  },
  {
    id: 'away',
    time: '19:30',
    scene: 'Ngửi mùi cơm nhà hàng xóm bên kia tường.',
    feeling: 'Nhớ mùi canh chua mẹ nấu. Hôm nay lại không về kịp.',
    icon: '🌃',
  },
];

const FOOD_STORIES = [
  {
    img: '/v2-bua-com.png',
    dish: 'Cơm tấm sườn nướng',
    memory: 'Bữa sáng mẹ hay mua khi còn nhỏ',
    emotion: 'Cằm không có gì ổn định hơn một dĩa cơm tấm quen quen.',
    tag: 'Ký ức sáng sớm',
    color: '#D83A2E',
  },
  {
    img: '/v2-canh-chua.png',
    dish: 'Canh chua cá bông lau',
    memory: 'Mùi canh chua là mùi của nhà',
    emotion: 'Ai cũng có một nồi canh chua để nhớ về. Của bạn là gì?',
    tag: 'Hương vị tuổi thơ',
    color: '#5A3928',
  },
  {
    img: '/v2-hero.png',
    dish: 'Bữa cơm gia đình',
    memory: 'Bữa tối đầy đủ nhất là bữa tối có mặt mọi người',
    emotion: 'Không cần sang trọng. Chỉ cần ấm và đủ.',
    tag: 'Bữa cơm sum họp',
    color: '#2F7D4E',
  },
];

const TESTIMONIALS = [
  {
    name: 'Thúy',
    age: 28,
    job: 'Nhân viên văn phòng',
    avatar: '👩',
    messages: [
      { text: 'Ăn ở đây lần đầu vì bạn giới thiệu 😊', delay: 0 },
      { text: 'Mà cơm ngon thiệt. Không phải cơm hộp cảm giác nhựa đó.', delay: 0.4 },
      { text: 'Giờ tuần nào cũng order 🙈', delay: 0.8 },
    ],
  },
  {
    name: 'Anh Minh',
    age: 34,
    job: 'Kỹ sư phần mềm',
    avatar: '👨‍💻',
    messages: [
      { text: 'Order lúc 6h30 tối', delay: 0.2 },
      { text: 'Đến nơi mình đang còn họp thêm 20 phút 😅', delay: 0.5 },
      { text: 'Mà về tới nơi vẫn còn ấm, canh vẫn còn thơm. Ổn quá!', delay: 0.9 },
    ],
  },
  {
    name: 'Chị Lan',
    age: 41,
    job: 'Mẹ của 2 bé, Quận 3',
    avatar: '👩‍👧',
    messages: [
      { text: 'Nhà mình đặt mỗi thứ 6 vì cuối tuần mệt không muốn nấu', delay: 0 },
      { text: 'Con gái hay kêu "Mẹ ơi đặt cơm Bếp Nhà Mình đi" 😄', delay: 0.6 },
      { text: 'Thích cái là không có mì chính, mấy đứa con ăn yên tâm hơn', delay: 1.1 },
    ],
  },
];

const ORDER_STEPS = [
  {
    num: '01',
    title: 'Chọn món bạn thèm',
    desc: 'Duyệt thực đơn hôm nay. Mỗi món đều có câu chuyện riêng.',
    detail: 'Menu thay đổi theo ngày, luôn có món mới',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="8" width="32" height="36" rx="4" strokeWidth="2.5" stroke="currentColor" />
        <line x1="16" y1="18" x2="32" y2="18" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" />
        <line x1="16" y1="26" x2="28" y2="26" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" />
        <line x1="16" y1="34" x2="24" y2="34" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: '02',
    title: 'Tụi mình nấu tươi',
    desc: 'Không đun lại, không frozen. Nấu sau khi bạn đặt.',
    detail: 'Nguyên liệu mới nhập mỗi buổi sáng',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M12 36 C12 36 8 28 8 20 C8 14 13 10 18 12" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" />
        <ellipse cx="28" cy="22" rx="12" ry="8" strokeWidth="2.5" stroke="currentColor" />
        <path d="M16 22 L40 22" strokeWidth="2" stroke="currentColor" strokeLinecap="round" />
        <path d="M20 14 Q24 10 28 14" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" fill="none" />
        <path d="M26 10 Q28 6 30 10" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" fill="none" />
      </svg>
    ),
  },
  {
    num: '03',
    title: 'Giao đến tận cửa',
    desc: 'Ship trong 10km · COD · Còn ấm khi đến nơi.',
    detail: 'Ước tính thời gian ngay khi đặt',
    icon: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="4" y="16" width="28" height="20" rx="3" strokeWidth="2.5" stroke="currentColor" />
        <path d="M32 24 L40 24 L44 32 L44 36 L32 36 Z" strokeWidth="2.5" stroke="currentColor" strokeLinejoin="round" />
        <circle cx="12" cy="38" r="4" strokeWidth="2.5" stroke="currentColor" />
        <circle cx="36" cy="38" r="4" strokeWidth="2.5" stroke="currentColor" />
      </svg>
    ),
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function LandingPageV2() {
  const [stickyVisible, setStickyVisible] = useState(false);
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const [heroParallax, setHeroParallax] = useState(0);

  // Scroll-based effects
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setStickyVisible(y > 480);
      // Parallax for hero image
      if (heroRef.current) {
        setHeroParallax(y * 0.35);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver for scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('v2-visible');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    );
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Testimonial auto-rotate
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="v2">

      {/* ── STICKY NAV ── */}
      <nav className="v2-nav">
        <div className="v2-nav__inner">
          <Link to="/order-online" className="v2-nav__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <span>Bếp Nhà Mình</span>
          </Link>
          <div className="v2-nav__links">
            <a href="#stories" className="v2-nav__link">Món ăn</a>
            <a href="#steps" className="v2-nav__link">Cách đặt</a>
          </div>
          <Link to="/order-online/menu" className="v2-nav__cta" id="nav-cta-order">
            Đặt ngay
          </Link>
        </div>
      </nav>

      {/* ── S1: HERO ── */}
      <section className="v2-hero" ref={heroRef} aria-label="Hero">
        {/* Dark dramatic background */}
        <div className="v2-hero__bg">
          <div
            className="v2-hero__bg-img"
            style={{ transform: `translateY(${heroParallax}px)` }}
          >
            <img src="/v2-hero.png" alt="" aria-hidden="true" />
          </div>
          <div className="v2-hero__bg-overlay" />
          <div className="v2-hero__grain" aria-hidden="true" />
        </div>

        {/* Steam particles */}
        <div className="v2-hero__steam" aria-hidden="true">
          {[...Array(6)].map((_, i) => (
            <span key={i} className={`v2-steam-particle v2-steam-particle--${i + 1}`} />
          ))}
        </div>

        {/* Content */}
        <div className="v2-hero__content">
          <div className="v2-hero__eyebrow">
            <span className="v2-hero__eyebrow-dot" aria-hidden="true" />
            Giao hàng tận nơi · Hôm nay
          </div>

          <h1 className="v2-hero__headline">
            <span className="v2-hero__line v2-hero__line--1" data-reveal>
              8 giờ tối.
            </span>
            <span className="v2-hero__line v2-hero__line--2" data-reveal>
              Bụng đói.
            </span>
            <span className="v2-hero__line v2-hero__line--accent" data-reveal>
              Bếp nguội.
            </span>
          </h1>

          <p className="v2-hero__sub" data-reveal>
            Không sao.<br />
            <strong>Bếp Nhà Mình có đây rồi.</strong>
          </p>

          <div className="v2-hero__actions" data-reveal>
            <Link
              to="/order-online/menu"
              className="v2-btn-fire"
              id="hero-cta-main"
            >
              <span>Đặt bữa cơm hôm nay</span>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
            </Link>
            <div className="v2-hero__trust-badges">
              <span>⏱ Giao trong 30 phút</span>
              <span>💵 Thanh toán khi nhận</span>
              <span>📍 Ship 10km</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="v2-hero__scroll-hint" aria-hidden="true">
          <div className="v2-hero__scroll-mouse">
            <div className="v2-hero__scroll-wheel" />
          </div>
          <span>Kéo xuống xem thêm</span>
        </div>
      </section>

      {/* ── S2: EMPATHY ── */}
      <section className="v2-empathy" aria-label="Câu chuyện người dùng">
        <div className="v2-container">
          <div className="v2-section-label" data-reveal>Bạn có quen không?</div>
          <h2 className="v2-section-title" data-reveal>
            Những khoảnh khắc<br />
            <em>ai cũng đã từng trải qua</em>
          </h2>

          <div className="v2-empathy__cards">
            {EMPATHY_MOMENTS.map((m, i) => (
              <div
                key={m.id}
                className="v2-empathy-card"
                data-reveal
                style={{ '--card-delay': `${i * 0.15}s` } as React.CSSProperties}
              >
                <div className="v2-empathy-card__time">{m.time}</div>
                <div className="v2-empathy-card__icon">{m.icon}</div>
                <p className="v2-empathy-card__scene">{m.scene}</p>
                <p className="v2-empathy-card__feeling">"{m.feeling}"</p>
                <div className="v2-empathy-card__cta">
                  <Link to="/order-online/menu">Đặt ngay cho tối nay →</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── S3: FOOD STORIES ── */}
      <section className="v2-stories" id="stories" aria-label="Câu chuyện món ăn">
        <div className="v2-container">
          <div className="v2-section-label" data-reveal>Không chỉ là món ăn</div>
          <h2 className="v2-section-title" data-reveal>
            Mỗi món là<br />
            <em>một ký ức</em>
          </h2>
        </div>

        <div className="v2-stories__grid">
          {FOOD_STORIES.map((story, i) => (
            <div
              key={story.dish}
              className={`v2-story-card ${activeStory === i ? 'v2-story-card--active' : ''}`}
              data-reveal
              style={{ '--story-delay': `${i * 0.12}s`, '--story-color': story.color } as React.CSSProperties}
              onMouseEnter={() => setActiveStory(i)}
              onMouseLeave={() => setActiveStory(null)}
              onFocus={() => setActiveStory(i)}
              onBlur={() => setActiveStory(null)}
            >
              <div className="v2-story-card__img-wrap">
                <img src={story.img} alt={story.dish} loading="lazy" />
                <div className="v2-story-card__overlay" />
              </div>
              <div className="v2-story-card__tag">{story.tag}</div>
              <div className="v2-story-card__content">
                <h3 className="v2-story-card__dish">{story.dish}</h3>
                <p className="v2-story-card__memory">{story.memory}</p>
                <p className="v2-story-card__emotion">{story.emotion}</p>
                <Link
                  to="/order-online/menu"
                  className="v2-story-card__order"
                  id={`story-cta-${i}`}
                >
                  Đặt món này
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── S4: KITCHEN TRUTH ── */}
      <section className="v2-kitchen" aria-label="Bếp thật của chúng tôi">
        <div className="v2-kitchen__inner">
          <div className="v2-kitchen__visual" data-reveal>
            <img src="/v2-bua-com.png" alt="Bếp Nhà Mình nấu ăn" className="v2-kitchen__photo" />
            <div className="v2-kitchen__photo-accent" aria-hidden="true" />
            {/* Floating stats */}
            <div className="v2-kitchen__stat v2-kitchen__stat--1" data-reveal>
              <span className="v2-kitchen__stat-num">100%</span>
              <span className="v2-kitchen__stat-label">Nguyên liệu tươi</span>
            </div>
            <div className="v2-kitchen__stat v2-kitchen__stat--2" data-reveal>
              <span className="v2-kitchen__stat-num">0</span>
              <span className="v2-kitchen__stat-label">Bột ngọt, chất bảo quản</span>
            </div>
          </div>

          <div className="v2-kitchen__text">
            <div className="v2-section-label" data-reveal>Bếp thật</div>
            <h2 className="v2-kitchen__title" data-reveal>
              Chúng tôi nấu<br />
              <em>như mẹ bạn nấu</em>
            </h2>
            <p className="v2-kitchen__desc" data-reveal>
              Không có bếp công nghiệp, không có thức ăn đông lạnh.
              Mỗi bữa được nấu sau khi bạn đặt — từ nguyên liệu mới
              nhập buổi sáng hôm đó.
            </p>
            <ul className="v2-kitchen__promises" data-reveal>
              {[
                'Rau củ nhập chợ mỗi sáng sớm',
                'Nấu theo đơn, không để sẵn',
                'Không phụ gia, không bột ngọt',
                'Thử trước, bán sau — tụi mình ăn cùng nhau',
              ].map(p => (
                <li key={p} className="v2-kitchen__promise-item">
                  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 10l4 4 6-8" strokeWidth="2.5" stroke="#2F7D4E" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {p}
                </li>
              ))}
            </ul>
            <Link
              to="/order-online/menu"
              className="v2-btn-warm"
              id="kitchen-cta"
              data-reveal
            >
              Xem thực đơn hôm nay
            </Link>
          </div>
        </div>
      </section>

      {/* ── S5: SOCIAL PROOF ── */}
      <section className="v2-proof" aria-label="Nhận xét từ khách">
        <div className="v2-container">
          <div className="v2-section-label" data-reveal>Họ nói gì về chúng tôi</div>
          <h2 className="v2-section-title v2-section-title--light" data-reveal>
            Không phải 5 sao.<br />
            <em>Là lời thật từ người thật.</em>
          </h2>

          <div className="v2-proof__testimonials">
            {TESTIMONIALS.map((t, tIdx) => (
              <div
                key={t.name}
                className={`v2-testimonial ${activeTestimonial === tIdx ? 'v2-testimonial--active' : ''}`}
                onClick={() => setActiveTestimonial(tIdx)}
                role="button"
                tabIndex={0}
                aria-label={`Xem nhận xét của ${t.name}`}
                onKeyDown={e => e.key === 'Enter' && setActiveTestimonial(tIdx)}
              >
                <div className="v2-testimonial__header">
                  <div className="v2-testimonial__avatar">{t.avatar}</div>
                  <div>
                    <div className="v2-testimonial__name">{t.name}, {t.age} tuổi</div>
                    <div className="v2-testimonial__job">{t.job}</div>
                  </div>
                </div>
                <div className="v2-testimonial__chat">
                  {t.messages.map((msg, mIdx) => (
                    <div
                      key={mIdx}
                      className="v2-chat-bubble"
                      style={{ '--bubble-delay': `${msg.delay}s` } as React.CSSProperties}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="v2-proof__dots" aria-hidden="true">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                className={`v2-proof__dot ${activeTestimonial === i ? 'v2-proof__dot--active' : ''}`}
                onClick={() => setActiveTestimonial(i)}
                aria-label={`Xem nhận xét ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── S6: HOW IT WORKS ── */}
      <section className="v2-steps" id="steps" aria-label="Cách đặt hàng">
        <div className="v2-container">
          <div className="v2-section-label" data-reveal>Đặt hàng dễ thôi</div>
          <h2 className="v2-section-title" data-reveal>
            Ba bước.<br />
            <em>Một bữa cơm ấm.</em>
          </h2>

          <div className="v2-steps__flow">
            {ORDER_STEPS.map((step, i) => (
              <div key={step.num} className="v2-step" data-reveal
                style={{ '--step-delay': `${i * 0.18}s` } as React.CSSProperties}>
                <div className="v2-step__icon-wrap">
                  {step.icon}
                  <div className="v2-step__num">{step.num}</div>
                </div>
                <div className="v2-step__body">
                  <div className="v2-step__title">{step.title}</div>
                  <div className="v2-step__desc">{step.desc}</div>
                  <div className="v2-step__detail">{step.detail}</div>
                </div>
                {i < ORDER_STEPS.length - 1 && (
                  <div className="v2-step__connector" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>

          <div className="v2-steps__cta" data-reveal>
            <Link to="/order-online/menu" className="v2-btn-fire" id="steps-cta">
              <span>Bắt đầu đặt hàng</span>
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── S7: FINALE CTA ── */}
      <section className="v2-finale" aria-label="Kết thúc">
        <div className="v2-finale__bg" aria-hidden="true" />
        <div className="v2-container v2-finale__content">
          <div className="v2-finale__question" data-reveal>
            Hôm nay bạn muốn ăn gì?
          </div>
          <p className="v2-finale__sub" data-reveal>
            Thực đơn mỗi ngày đều có món mới. Xem ngay — đặt luôn hôm nay.
          </p>
          <Link
            to="/order-online/menu"
            className="v2-btn-fire v2-btn-fire--lg"
            id="finale-cta"
            data-reveal
          >
            <span>Xem thực đơn & đặt món</span>
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" />
            </svg>
          </Link>
          <div className="v2-finale__trust" data-reveal>
            <span>⏱ 30 phút</span>
            <span>·</span>
            <span>💵 COD</span>
            <span>·</span>
            <span>📍 10km</span>
            <span>·</span>
            <span>❌ Không bột ngọt</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="v2-footer">
        <div className="v2-container v2-footer__inner">
          <div className="v2-footer__brand">
            <img src="/logo.png" alt="Bếp Nhà Mình" />
            <div>
              <div className="v2-footer__brand-name">Bếp Nhà Mình</div>
              <div className="v2-footer__brand-line">Hương vị gia đình · Giao tận nơi</div>
            </div>
          </div>
          <div className="v2-footer__links">
            <Link to="/qr/qr-bnm-table-01">Đặt bàn tại quán</Link>
            <a href="tel:+84901234567">0901 234 567</a>
          </div>
          <div className="v2-footer__copy">© 2025 Bếp Nhà Mình</div>
        </div>
      </footer>

      {/* ── STICKY ORDER BAR ── */}
      <div
        className={`v2-sticky-bar ${stickyVisible ? 'v2-sticky-bar--visible' : ''}`}
        role="complementary"
        aria-label="Đặt hàng nhanh"
      >
        <div className="v2-sticky-bar__inner">
          <div className="v2-sticky-bar__text">
            <span className="v2-sticky-bar__dot" aria-hidden="true" />
            Bếp đang mở · Giao ngay trong 30 phút
          </div>
          <Link to="/order-online/menu" className="v2-sticky-bar__btn" id="sticky-cta">
            Đặt ngay
          </Link>
        </div>
      </div>

    </div>
  );
}
