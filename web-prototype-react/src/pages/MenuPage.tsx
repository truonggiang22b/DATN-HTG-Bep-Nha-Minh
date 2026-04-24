import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../hooks/useClientSession';
import { useStore } from '../store/useStore';
import { ToastContainer } from '../components/Toast';
import { ItemDetailSheet } from '../components/ItemDetailSheet';
import { formatPrice, getTagBadge } from '../components/Toast';
import { resolveQR, getMenu } from '../services/publicApi';
import type { ApiMenuItem } from '../types';
import '../styles/customer.css';

interface MenuPageProps {
  qrToken: string;
}

export const MenuPage = ({ qrToken }: MenuPageProps) => {
  const navigate = useNavigate();
  // useClientSession() initializes the session in sessionStorage automatically
  const { itemCount, subtotal, addToCart } = useCart();
  const { toasts, showToast, dismissToast } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<ApiMenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const tabsRef = useRef<HTMLDivElement>(null);

  // ── 1. Resolve QR → table, branch, session info ──────────────────────────
  const {
    data: qrData,
    isLoading: qrLoading,
    isError: qrError,
  } = useQuery({
    queryKey: ['qr', qrToken],
    queryFn: () => resolveQR(qrToken),
    enabled: !!qrToken,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  // ── 2. Fetch menu khi đã có branchId ─────────────────────────────────────
  const branchId = qrData?.branch.id;
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['menu', branchId],
    queryFn: () => getMenu(branchId!),
    enabled: !!branchId,
    staleTime: 2 * 60_000,
  });

  // ── 3. Lưu context vào sessionStorage để CartPage dùng ───────────────────
  useEffect(() => {
    if (qrData) {
      sessionStorage.setItem('bnm-qr-token', qrToken);
      sessionStorage.setItem('bnm-table-id', qrData.table.id);
      sessionStorage.setItem('bnm-table-display', qrData.table.displayName);
    }
  }, [qrData, qrToken]);

  // ── Lọc & hiển thị menu ──────────────────────────────────────────────────
  const categories = menuData?.categories ?? [];

  const visibleItems = categories.flatMap((cat) =>
    cat.items.filter(
      (item) =>
        item.status !== 'HIDDEN' &&
        (!search || item.name.toLowerCase().includes(search.toLowerCase()))
    )
  );

  const categoriesWithItems = categories
    .filter((cat) =>
      cat.items.some(
        (item) =>
          item.status !== 'HIDDEN' &&
          (!search || item.name.toLowerCase().includes(search.toLowerCase()))
      )
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // ── 4. IntersectionObserver (PHẢI đặt trước mọi conditional return) ──────
  useEffect(() => {
    if (!categoriesWithItems.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = entry.target.getAttribute('data-category-id');
            if (catId) setActiveCategory(catId);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    categoriesWithItems.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesWithItems.length, search]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = sectionRefs.current[catId];
    if (el) {
      const offset = 108;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  const openSheet = (item: ApiMenuItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  const handleQuickAdd = (item: ApiMenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.status !== 'ACTIVE') return;
    if (item.optionGroups.some((g) => g.isRequired)) {
      openSheet(item);
      return;
    }
    addToCart(item.id, item.name, item.price, item.imageUrl ?? '', 1, [], '');
    showToast(`Đã thêm ${item.name} vào giỏ`);
  };

  // ── Conditional renders (ĐẶT SAU tất cả hooks) ──────────────────────────
  if (qrLoading) {
    return (
      <div className="app-shell">
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div
            className="loading-skeleton"
            style={{
              width: 120, height: 120, borderRadius: '50%',
              margin: '0 auto 24px', background: 'var(--color-steam)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div className="loading-skeleton" style={{ height: 20, width: 160, margin: '0 auto 12px', background: 'var(--color-steam)', borderRadius: 8 }} />
          <div className="loading-skeleton" style={{ height: 14, width: 100, margin: '0 auto', background: 'var(--color-steam)', borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  if (qrError || !qrData) {
    return (
      <div className="app-shell">
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#d83a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="text-h2" style={{ marginBottom: 8 }}>Mã QR không hợp lệ</div>
          <div className="text-body" style={{ color: 'var(--color-soy)' }}>
            Vui lòng quét lại QR tại bàn hoặc gọi nhân viên hỗ trợ.
          </div>
        </div>
      </div>
    );
  }

  const { table } = qrData;
  const cartNavState = { tableId: table.id, tableDisplay: table.displayName };

  return (
    <div className="app-shell">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <header className="customer-header">
        <span className="customer-header__brand">
          <img src="/logo.png" alt="Bếp Nhà Mình" style={{ height: 38, objectFit: 'contain', display: 'block' }} />
        </span>
        <span className="customer-header__table">{table.displayName}</span>
        <button
          className="customer-header__cart-btn"
          onClick={() => navigate('/cart', { state: cartNavState })}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {itemCount > 0 && <span className="cart-count-badge">{itemCount}</span>}
        </button>
      </header>

      {/* Search */}
      <div className="search-bar">
        <span className="search-bar__icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          placeholder="Tìm món yêu thích..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="category-tabs" ref={tabsRef}>
        <button
          className={`category-tab ${activeCategory === 'all' ? 'category-tab--active' : ''}`}
          onClick={() => handleCategoryClick('all')}
        >
          Tất cả
        </button>
        {categoriesWithItems.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? 'category-tab--active' : ''}`}
            onClick={() => handleCategoryClick(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu skeleton while loading */}
      {menuLoading ? (
        <main style={{ flex: 1, padding: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ marginBottom: 24 }}>
              <div style={{ height: 18, width: 120, background: 'var(--color-steam)', borderRadius: 6, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[1, 2].map((j) => (
                  <div key={j} style={{ height: 180, background: 'var(--color-steam)', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            </div>
          ))}
        </main>
      ) : (
        <main style={{ flex: 1, paddingBottom: itemCount > 0 ? '100px' : '24px' }}>
          {visibleItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🍽️</div>
              <div className="empty-state-title">Không tìm thấy món</div>
              <div className="empty-state-text">Thử tìm kiếm với từ khóa khác.</div>
            </div>
          ) : (
            categoriesWithItems.map((cat) => {
              const catItems = cat.items.filter(
                (item) =>
                  item.status !== 'HIDDEN' &&
                  (!search || item.name.toLowerCase().includes(search.toLowerCase()))
              );
              if (!catItems.length) return null;
              return (
                <div
                  key={cat.id}
                  className="menu-section"
                  data-category-id={cat.id}
                  ref={(el) => { sectionRefs.current[cat.id] = el; }}
                >
                  <div className="menu-section-title">{cat.name}</div>
                  <div className="menu-grid">
                    {catItems.map((item) => (
                      <MenuCard key={item.id} item={item} onOpen={openSheet} onQuickAdd={handleQuickAdd} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </main>
      )}

      {/* Sticky cart bar */}
      {itemCount > 0 && (
        <div className="cart-bar">
          <div
            className="cart-bar__inner"
            onClick={() => navigate('/cart', { state: cartNavState })}
          >
            <span className="cart-bar__count">{itemCount}</span>
            <span className="cart-bar__label">Xem giỏ hàng</span>
            <span className="cart-bar__total">{formatPrice(subtotal)}</span>
          </div>
        </div>
      )}

      {/* Item detail sheet */}
      <ItemDetailSheet
        item={selectedItem}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={(name) => showToast(`Đã thêm ${name} vào giỏ`)}
      />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
};

// ── MenuCard sub-component ──────────────────────────────────────────────────
const MenuCard = ({
  item,
  onOpen,
  onQuickAdd,
}: {
  item: ApiMenuItem;
  onOpen: (item: ApiMenuItem) => void;
  onQuickAdd: (item: ApiMenuItem, e: React.MouseEvent) => void;
}) => {
  const [imgError, setImgError] = useState(false);
  const isSoldOut = item.status === 'SOLD_OUT';

  return (
    <div
      className={`menu-card ${isSoldOut ? 'menu-card--sold-out' : ''}`}
      onClick={() => onOpen(item)}
    >
      {!imgError && item.imageUrl ? (
        <img
          className="menu-card__img"
          src={item.imageUrl}
          alt={item.name}
          onError={() => setImgError(true)}
          loading="lazy"
          style={{ filter: isSoldOut ? 'grayscale(0.5)' : undefined }}
        />
      ) : (
        <div className="menu-card__img img-placeholder">🍜</div>
      )}
      <div className="menu-card__body">
        <div className="menu-card__badges">
          {item.tags.map((tag) => {
            const b = getTagBadge(tag);
            return b ? <span key={tag} className={b.cls}>{b.label}</span> : null;
          })}
          {isSoldOut && <span className="badge badge-sold-out">Tạm hết</span>}
        </div>
        <div className="menu-card__name">{item.name}</div>
        <div className="menu-card__desc">{item.shortDescription}</div>
        <div className="menu-card__footer">
          <span className="menu-card__price">{formatPrice(item.price)}</span>
          <button
            className={`menu-card__add-btn ${isSoldOut ? 'menu-card__add-btn--disabled' : ''}`}
            onClick={(e) => onQuickAdd(item, e)}
            disabled={isSoldOut}
            title={isSoldOut ? 'Tạm hết' : 'Thêm vào giỏ'}
          >
            {isSoldOut ? '—' : '+'}
          </button>
        </div>
      </div>
    </div>
  );
};
