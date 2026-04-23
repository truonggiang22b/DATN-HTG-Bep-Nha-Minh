# Component và Design System Spec

## 1. Design tokens
```css
:root {
  --color-rice: #fff8ea;
  --color-paper: #f7e8c9;
  --color-charcoal: #25211b;
  --color-soy: #5a3928;
  --color-chili: #d83a2e;
  --color-turmeric: #f4a51c;
  --color-leaf: #2f7d4e;
  --color-steam: #e8ddcc;
  --radius-sm: 10px;
  --radius-md: 18px;
  --radius-lg: 28px;
  --shadow-card: 0 14px 40px rgba(37, 33, 27, 0.12);
  --shadow-soft: 0 8px 24px rgba(90, 57, 40, 0.10);
}
```

## 2. Typography system
Font system phải nhất quán, hiện đại và dễ đọc. Không dùng serif/decorative font trong prototype.

| Role | Font family | Use |
|---|---|---|
| Primary | `Be Vietnam Pro` | Toàn bộ UI chính: brand, heading, body, labels, buttons |
| Numeric accent | `Sora` | Giá tiền, mã đơn, số bàn lớn trên KDS nếu cần nhấn mạnh |
| Fallback | `sans-serif` | Fallback kỹ thuật |

Quy tắc:
- Tối đa 2 font family.
- Tên quán luôn viết `Bếp Nhà Mình`.
- Tên quán, tên món và heading không dùng serif/decorative font.
- Không dùng quá nhiều uppercase/letter spacing trong cùng một màn.
- Weight chính: 400, 500, 600, 700.

## 3. Typography scale
| Token | Size | Use |
|---|---:|---|
| `display` | 40-48px | Admin/KDS hero numbers, optional |
| `h1` | 28-34px | Page title |
| `h2` | 22-26px | Section title |
| `body` | 16px | Customer body |
| `caption` | 12-13px | Badge/meta |
| `kds-table` | 36-56px | KDS table number |
| `kds-item` | 20-28px | KDS item quantity/name |

## 4. Core components
| Component | Props chính | Notes |
|---|---|---|
| `AppShell` | `variant`, `tableName`, `cartCount` | Customer shell mobile |
| `CategoryTabs` | `categories`, `activeId`, `onSelect` | Horizontal scroll |
| `MenuCard` | `item`, `onAdd`, `onOpen` | Handles ACTIVE/SOLD_OUT |
| `ItemDetailSheet` | `item`, `open`, `onAdd` | Bottom sheet mobile |
| `QuantityStepper` | `value`, `onChange` | Min 1 in cart |
| `CartBar` | `count`, `subtotal`, `onOpenCart` | Sticky bottom |
| `CartItemRow` | `cartItem`, `onQty`, `onRemove` | Shows option/note |
| `StatusTimeline` | `status` | Customer-friendly labels |
| `OrderCardKDS` | `order`, `onNext`, `onCancel` | Large hierarchy |
| `KDSBoard` | `ordersByStatus` | Columns |
| `AdminStatCard` | `label`, `value`, `tone` | Dashboard |
| `MenuAdminTable` | `items`, `onStatusChange` | Quick actions |
| `TableQRCodeRow` | `table`, `onReset` | Table/QR management |

## 5. Component behavior
### 5.1. MenuCard
| State | Behavior |
|---|---|
| `ACTIVE` | CTA `Thêm`, card clickable |
| `SOLD_OUT` | CTA disabled, badge `Tạm hết`, opacity nhẹ nhưng text vẫn rõ |
| `HIDDEN` | Không render trên customer app |

### 5.2. CartBar
| State | Behavior |
|---|---|
| Empty | Ẩn hoặc disabled nhẹ |
| Has items | Sticky bottom, subtotal visible |
| Submit pending | Không submit từ bar, chỉ cart page submit |

### 5.3. OrderCardKDS
| Status | Primary CTA |
|---|---|
| `NEW` | `Bắt đầu chuẩn bị` |
| `PREPARING` | `Sẵn sàng` |
| `READY` | `Đã phục vụ` |
| `SERVED` | No primary CTA |
| `CANCELLED` | No primary CTA |

## 6. Customer status mapping
| Internal | Customer label | Tone |
|---|---|---|
| `NEW` | `Đã tiếp nhận` | Turmeric |
| `PREPARING` | `Đang chuẩn bị` | Chili |
| `READY` | `Sẵn sàng / Đang mang ra` | Leaf |
| `SERVED` | `Đã phục vụ` | Leaf |
| `CANCELLED` | `Đơn đã hủy` | Soy/Chili |

## 7. Responsive specs
| Breakpoint | Target |
|---|---|
| 360-430px | Customer mobile primary |
| 768-1024px | KDS tablet usable |
| 1280px+ | Admin desktop/KDS board comfortable |

## 8. Motion specs
| Token | Duration | Use |
|---|---:|---|
| `fast` | 120ms | Button press |
| `base` | 220ms | Sheet open, tab switch |
| `slow` | 420ms | Menu stagger, timeline |

## 9. Icons
Use icons sparingly:

- Cart.
- Search.
- Clock/time.
- Check/status.
- QR/copy.
- Alert/sold out.

Icons should support text, not replace text.

## 10. Accessibility checklist
| Item | Requirement |
|---|---|
| Touch targets | Minimum 44px height |
| Contrast | CTA/text readable on warm backgrounds |
| Sold out | Text + color, not color only |
| Loading | Text feedback, not spinner only |
| KDS | Large text and high contrast |

## 11. Copy rules
| Situation | Copy |
|---|---|
| Primary order CTA | `Gửi order cho quán` |
| Add item | `Thêm vào giỏ` |
| Sold out | `Tạm hết` |
| Cart empty | `Bạn chưa chọn món nào.` |
| Tracking new | `Đơn đã được tiếp nhận` |
| Retry network | `Kết nối chưa ổn định. Thử lại sẽ không tạo trùng đơn.` |
| Reset table warning | `Reset bàn sẽ đóng phiên hiện tại nhưng không xóa lịch sử order.` |
