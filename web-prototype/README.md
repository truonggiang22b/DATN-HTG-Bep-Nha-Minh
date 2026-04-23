# 🗂️ Web Prototype — Hướng Dẫn Customize

## Cấu trúc thư mục

```
web-prototype/
├── index.html          ← Trang chính, chỉnh tất cả nội dung ở đây
├── css/
│   └── style.css       ← Toàn bộ styling — chỉnh :root để đổi màu
├── js/
│   └── main.js         ← Logic UI — scroll, counter, toast, buttons
├── assets/
│   ├── images/         ← Đặt ảnh vào đây
│   └── icons/          ← Đặt icon / favicon vào đây
└── README.md           ← File này
```

---

## ⚡ Bắt đầu nhanh

**Mở file và xem ngay:**
```
Mở index.html bằng trình duyệt (double-click)
```

**Hoặc chạy local server:**
```bash
# Nếu có Python:
python -m http.server 3000

# Nếu có Node.js:
npx serve .
```
Sau đó mở: `http://localhost:3000`

---

## 🎨 Đổi màu sắc

Mở `css/style.css`, tìm phần `:root` (dòng đầu tiên):

```css
:root {
  --primary-500: #6366f1;   /* ← Màu chính (tím) */
  --accent-500:  #10b981;   /* ← Màu accent (xanh lá) */
  --bg-900:      #0a0a0f;   /* ← Background tối nhất */
}
```

**Gợi ý bộ màu:**
- 🔵 Blue: `#3b82f6` + `#06b6d4`
- 🟢 Green: `#10b981` + `#84cc16`
- 🟠 Orange: `#f97316` + `#eab308`
- 🔴 Red: `#ef4444` + `#ec4899`

---

## 📝 Thay nội dung

### Logo & Brand
```html
<!-- index.html, tìm: -->
<span class="logo-text">BrandName</span>
<!-- Đổi thành tên dự án của bạn -->
```

### Hero Title
```html
<h1 class="hero-title">
  Tiêu Đề Chính<br />
  Của <span class="gradient-text">Bạn</span>
</h1>
```

### Features
```html
<h3 class="feature-title">Tên Tính Năng 1</h3>
<p class="feature-desc">Mô tả của bạn...</p>
```

### Pricing
Tìm phần `#pricing` và đổi số tiền, tên gói.

---

## 🔧 Thêm trang mới

Tạo file HTML mới, import cùng CSS/JS:
```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <!-- Nội dung trang mới -->
  <script src="js/main.js"></script>
</body>
</html>
```

---

## 📱 Responsive

Template đã hỗ trợ responsive. Breakpoints:
- `> 900px` — Desktop full
- `720px - 900px` — Tablet (footer 2 cột)
- `< 720px` — Mobile (hamburger menu, single column)

---

## 🔔 Dùng Toast Notification

Trong JS, có thể gọi từ bất kỳ đâu:
```javascript
showToast('Lưu thành công!', 'success');
showToast('Có lỗi xảy ra!', 'error');
showToast('Đang xử lý...', 'info');
showToast('Cảnh báo!', 'warning');
```

---

## 🚀 Bước tiếp theo

Nói với Antigravity:
- "Thêm trang đăng nhập / đăng ký"
- "Thêm form liên hệ với validation"
- "Tạo dashboard admin"
- "Thêm dark/light mode toggle"
- "Tích hợp API [tên API]"
- "Deploy lên Vercel / Netlify"
