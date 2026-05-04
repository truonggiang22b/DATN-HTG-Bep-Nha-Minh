import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPageV2_Student.css';

// ── ICON SVG ──────────────────────────────────────────────────────────────────
const IconOffice = () => (
  <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const IconHeart = () => (
  <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
);

const IconPerson = () => (
  <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
);

// ── DATA ──────────────────────────────────────────────────────────────────────
const INSIGHTS = [
  {
    icon: <IconOffice />,
    title: 'Chạy deadline sấp mặt',
    desc: 'Lên thư viện hay kẹt đồ án? Chẳng cần úp mì, một phần cơm nóng dọn sẵn sẽ nạp năng lượng ngay.',
  },
  {
    icon: <IconHeart />,
    title: 'Góc chill Món Âu',
    desc: 'Bít-tết mềm mọng, Mì Ý sốt béo ngậy. Trải nghiệm món Tây siêu xịn mà ví vẫn rủng rỉnh cuối tháng.',
  },
  {
    icon: <IconPerson />,
    title: 'Ăn nhanh nhưng tử tế',
    desc: 'Sinh viên bận rộn không có nghĩa là ăn tạm bợ. Bữa ăn đóng hộp kín đáo, đầy đủ dưỡng chất.',
  },
];

const MENU_PREVIEWS = [
  {
    img: '/v2-bua-com.png',
    name: 'Bít-tết Chảo Gang',
    desc: 'Bò Úc mềm mọng xèo xèo, khoai tây chiên giòn rụm cùng sốt tiêu đen đậm đà. Ăn cực "cuốn".',
    price: '75.000đ',
  },
  {
    img: '/v2-canh-chua.png',
    name: 'Mì Ý Bò Bằm',
    desc: 'Sốt bò bằm hầm cà chua chua ngọt ngọt, phủ phô mai béo ngậy. Giao chớp nhoáng tới KTX.',
    price: '45.000đ',
  },
  {
    img: '/v2-com-tam.png',
    name: 'Cơm Gà Khìa',
    desc: 'Quen thuộc nhưng hao cơm. Gà khìa đậm vị, ăn cùng dưa leo thanh mát 100% no nê.',
    price: '48.000đ',
  },
];

const REVIEWS = [
  {
    text: 'Cứ mỗi mùa thi là mình đóng họ ở đây. Có hôm thèm cơm nhà, có hôm tụ tập ăn bít-tết, giá cực êm cho sinh viên.',
    author: 'Minh Tuấn / Làng Đại học'
  },
  {
    text: 'Hiếm có quán nào vừa bán đồ bình dân vừa có món Âu tươm tất. Đang đú đởn chạy sprint ở F-Town, gọi đồ vẫn nóng hổi.',
    author: 'Tường Vi / Kỹ sư SE'
  },
  {
    text: 'Đóng hộp rất sạch sẽ gọn gàng. Có bữa kẹt deadline môn thiết kế tới 2h sáng, may mà có một hộp cơm xịn xò độ.',
    author: 'Khánh Vy / Sinh viên FPTU'
  }
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function LandingPageV2_Student() {
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky after scrolling past 400px
      if (window.scrollY > 400) {
        setStickyVisible(true);
      } else {
        setStickyVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="sz-landing">
      {/* ── 1. MARQUEE ── */}
      <div className="sz-marquee">
        <div className="sz-marquee__inner">
          <div className="sz-marquee__item">
            🔥 Cứu đói đêm khuya
          </div>
          <div className="sz-marquee__item">
            🛵 Giao hoả tốc KTX
          </div>
          <div className="sz-marquee__item">
            💸 Giá xót ví tài trợ sinh viên
          </div>
          <div className="sz-marquee__item">
            ⚡️ Không ăn mỳ tôm nữa
          </div>
          {/* Duy trì vòng lặp */}
          <div className="sz-marquee__item">
            🔥 Cứu đói đêm khuya
          </div>
          <div className="sz-marquee__item">
            🛵 Giao hoả tốc KTX
          </div>
          <div className="sz-marquee__item">
            💸 Giá xót ví tài trợ sinh viên
          </div>
          <div className="sz-marquee__item">
            ⚡️ Không ăn mỳ tôm nữa
          </div>
        </div>
      </div>

      {/* ── 2. HERO SECTION ── */}
      <section className="sz-hero">
        <div className="sz-container sz-hero__container">
          <div className="sz-hero__content">
            <div className="sz-hero__badge">Nạp Năng Lượng Tức Thì</div>
            <h1 className="sz-title">
              Chạy Deadline?<br/>
              <span className="hl-green">Có Bếp Chiều.</span>
            </h1>
            <p className="sz-hero__sub">
              Góc ẩm thực chân ái của Làng Đại học: Cơm nóng hổi và trải nghiệm Món Âu "chill-out" giá cực mềm. Sống sốt qua từng đêm.
            </p>
            <div className="sz-hero__actions">
              <Link to="/order-online/menu" className="sz-btn">
                Đặt món ngay 🚀
              </Link>
            </div>
          </div>
          <div className="sz-hero__visual">
            <div className="sz-sticker sz-sticker--1">Nóng 100%</div>
            <div className="sz-sticker sz-sticker--2">Chill Vibez</div>
            <div className="sz-menu-card__img-wrap" style={{ border: '3px solid var(--sz-neon-green)' }}>
              <img src="/v2-bua-com.png" alt="Bếp Nhà Mình Food" className="sz-hero__img" />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. INSIGHTS / BENTO BOX ── */}
      <section className="sz-insights">
        <div className="sz-container">
          <h2 className="sz-section-title">Sinh viên <span className="hl-pink">kèm cặp</span></h2>
          <p className="sz-section-sub">Trạm nạp năng lượng sinh ra để độ đám làm bài tập xuyên đêm.</p>
          <div className="sz-insights__grid">
            {INSIGHTS.map((item, i) => (
              <div key={i} className="sz-insight-card">
                <div className="sz-insight-icon">{item.icon}</div>
                <h3 className="sz-insight-title">{item.title}</h3>
                <p className="sz-insight-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. NEO-BRUTALIST MENU CARDS ── */}
      <section className="sz-menu">
        <div className="sz-container">
          <h2 className="sz-section-title" style={{ color: "var(--sz-neon-cyan)" }}>Thực Đơn Đổi Gió</h2>
          <p className="sz-section-sub">Món bình dân bảo đảm chắc bụng, món Âu trải nghiệm cực đã.</p>
          <div className="sz-menu__grid">
            {MENU_PREVIEWS.map((item, i) => (
              <div key={i} className="sz-menu-card">
                <div className="sz-menu-card__tag">HOT🔥</div>
                <div className="sz-menu-card__img-wrap">
                  <img src={item.img} alt={item.name} className="sz-menu-card__img" />
                </div>
                <div className="sz-menu-card__content">
                  <h3 className="sz-menu-card__name">{item.name}</h3>
                  <p className="sz-menu-card__desc">{item.desc}</p>
                  <div className="sz-menu-card__footer">
                    <span className="sz-menu-card__price">{item.price}</span>
                    <Link to="/order-online/menu" style={{ color: 'var(--sz-text-main)', fontWeight: 700 }}>CHỌN 👉</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. REVIEWS ── */}
      <section className="sz-reviews">
        <div className="sz-container">
          <div className="sz-reviews__grid">
            {REVIEWS.map((rev, i) => (
              <div key={i} className="sz-review-card">
                <p className="sz-review-text">{rev.text}</p>
                <div className="sz-review-author">— {rev.author}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. BIG CTA FINALE ── */}
      <section className="sz-hero" style={{ textAlign: 'center', borderBottom: 'none' }}>
        <div className="sz-container">
          <h2 className="sz-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '30px' }}>
            <span className="hl-green">Cứu đói.</span> Ngay chớp mắt.
          </h2>
          <Link to="/order-online/menu" className="sz-btn sz-btn--pink">
            CHẠY ĐẾN MENU! 🏃‍♂️
          </Link>
        </div>
      </section>

      {/* ── 7. STICKY ACTION BAR ── */}
      <div className={`sz-sticky ${stickyVisible ? 'is-visible' : ''}`}>
        <div className="sz-sticky__inner">
          <div className="sz-sticky__text">
            <span className="sz-pulse-dot" />
            Bếp Đang Nhận Đơn • Giao Hoả Tốc
          </div>
          <Link to="/order-online/menu" className="sz-btn sz-btn--pink" style={{ padding: '8px 20px', fontSize: '1rem' }}>
            Đặt Món
          </Link>
        </div>
      </div>

    </div>
  );
}
