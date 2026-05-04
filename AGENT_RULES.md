# AGENT_RULES.md — Luật bất biến cho tất cả AI Agent
> **⛔ KHÔNG ĐƯỢC VI PHẠM BẤT KỲ QUY TẮC NÀO DƯỚI ĐÂY.**
> Agent nào vi phạm sẽ bị dừng ngay lập tức và toàn bộ thay đổi sẽ bị revert.

---

## 🔴 TUYỆT ĐỐI CẤM — Zero Tolerance

### 1. KHÔNG bao giờ chạm vào `main` branch
```
git push origin main          ← CẤM
git merge ... main            ← CẤM
git checkout main             ← CẤM
```
`main` là Production. Chỉ owner mới được merge vào `main`, và phải thông báo rõ ràng trước.

### 2. KHÔNG bao giờ deploy lên Vercel hoặc Railway
```
vercel deploy                 ← CẤM
npx vercel                    ← CẤM
railway up                    ← CẤM
```
Mọi thao tác deploy phải được owner phê duyệt trước. Agent KHÔNG được tự ý deploy.

### 3. KHÔNG được sửa file `App.tsx` routing
Đặc biệt các dòng sau là **BẤT KHẢ XÂM PHẠM**:
```tsx
// Catch-all phải luôn là:
<Route path="/" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
<Route path="*" element={<Navigate to="/qr/qr-bnm-table-01" replace />} />
```
Phase 1 QR dine-in là hệ thống production đang hoạt động. Thay đổi redirect = phá vỡ production.

### 4. KHÔNG được sửa nhánh `main` dù dưới bất kỳ lý do gì
Kể cả khi agent nghĩ đó là "hotfix" hay "urgent fix".

---

## 🟡 PHẠM VI ĐƯỢC PHÉP — Design Agent

### Agent thiết kế (landing page, UI) CHỈ được sửa:
```
web-prototype-react/src/pages/OnlineLandingPage.tsx
web-prototype-react/src/pages/OnlineLandingPage.css
web-prototype-react/src/pages/OnlineOrderPage.css
web-prototype-react/src/pages/LandingPageV2*.tsx      (file mới, tạo mới OK)
web-prototype-react/src/pages/LandingPageV2*.css      (file mới, tạo mới OK)
web-prototype-react/public/                           (assets/ảnh)
```

### KHÔNG được sửa:
```
src/App.tsx                    ← CẤM (routing critical)
src/pages/OnlineOrderPage.tsx  ← Chỉ sửa nếu được yêu cầu rõ ràng
src/pages/QRMenuPage.tsx       ← Phase 1, không được đụng
src/pages/MenuPage.tsx         ← Phase 1, không được đụng
backend-api/                   ← Không được đụng
src/services/                  ← Không được đụng
src/store/                     ← Không được đụng
```

---

## 🟢 QUY TRÌNH ĐÚNG — Git Workflow

```
1. Làm việc trên nhánh: feature/phase2-ui-redesign HOẶC develop
2. Commit thường xuyên với message rõ ràng
3. Push lên: git push new-origin develop (hoặc feature/...)
4. Báo cáo owner: "Tôi đã push, bạn có muốn review không?"
5. Owner quyết định merge vào develop → main
```

### Khi gặp lỗi git push:
- **KHÔNG** tự ý thử `vercel deploy` thay thế
- **KHÔNG** hỏi owner đăng nhập GitHub để push hộ
- **BÁO CÁO** lỗi và dừng lại, chờ owner xử lý

---

## 📋 CHECKLIST trước khi commit bất kỳ thứ gì

- [ ] Tôi có đang ở đúng nhánh (`develop` hoặc `feature/...`) không?
- [ ] Tôi có sửa `App.tsx` routing không? → Nếu có: **DỪNG LẠI**
- [ ] Tôi có sửa Phase 1 files không? → Nếu có: **DỪNG LẠI**
- [ ] Tôi có tự ý deploy không? → Nếu có: **DỪNG LẠI**
- [ ] Owner đã được thông báo về thay đổi này chưa?

---

## 🏗️ Kiến trúc hiện tại — PHẢI NẮM RÕ

| Nhánh | Môi trường | Nội dung | Ai quản lý |
|---|---|---|---|
| `main` | **PRODUCTION** (Vercel + Railway) | Phase 1 QR dine-in | Owner ONLY |
| `develop` | Staging | Phase 1 + Phase 2 backend + UI | Team |
| `feature/phase2-ui-redesign` | Local / Preview | UI redesign landing page | Design agent |

### Route quan trọng KHÔNG được thay đổi:
| Route | Chức năng | Trạng thái |
|---|---|---|
| `/qr/:tableId` | QR dine-in (Phase 1) | ✅ Production đang dùng |
| `/order-online` | Landing Phase 2 | 🔧 Đang phát triển |
| `/order-online/menu` | Menu Phase 2 | 🔧 Đang phát triển |
| `/admin` | Trang quản trị | ✅ Production đang dùng |

---

## ⚠️ Các lỗi đã xảy ra — Không được lặp lại

| Ngày | Lỗi | Hậu quả |
|---|---|---|
| 2026-04-26 | Merge Phase 2 vào `main` trái phép | Production bị hỏng, phải revert |
| 2026-04-27 | Design agent sửa `App.tsx` catch-all redirect | Phase 1 QR dine-in bị vô hiệu hóa |
| 2026-04-27 | Design agent đề xuất `vercel deploy` khi push bị lỗi | Vi phạm quy trình deploy |

---

*File này được tạo ngày 2026-04-27. Mọi agent khi bắt đầu làm việc phải đọc file này trước.*
