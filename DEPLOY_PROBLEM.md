# 📋 DEPLOY_PROBLEM.md — Ghi chép vấn đề & quyết định Deploy
> Dự án: Bếp Nhà Mình | Cập nhật: 08/05/2026

Tài liệu này ghi lại các vấn đề đã gặp, nguyên nhân, và quyết định kỹ thuật đã được chốt
trong quá trình deploy lên Railway (Backend) + Vercel (Frontend) + Supabase (Database).

---

## 1. Kết nối Database — Port 5432 vs 6543

### Vấn đề
Có 3 loại kết nối Supabase với domain và port khác nhau, dễ nhầm lẫn:

| Domain | Port | Loại | IPv6 | Dùng khi |
|--------|------|------|------|----------|
| `db.<ref>.supabase.co` | `5432` | Direct (thẳng Postgres) | ❌ IPv4 only | Không dùng trên Railway |
| `pooler.supabase.com` | `5432` | Session Pooler | ✅ | Local dev, Prisma migrate |
| `pooler.supabase.com` | `6543` | Transaction Pooler | ✅ | Production serverless |

### Quyết định đã chốt
- `DATABASE_URL` và `DIRECT_URL` hiện tại đều trỏ vào **Session Pooler (port 5432)**
  qua domain `aws-1-ap-southeast-1.pooler.supabase.com` — **đây là hợp lệ**
- Railway đang chạy ổn với cấu hình này → **không cần đổi port**
- Port 5432 trên `pooler.supabase.com` hỗ trợ IPv6, Prisma migrate hoạt động bình thường
- Chỉ cần đổi sang port `6543` nếu gặp lỗi connection limit hoặc migrate timeout

### Giá trị hiện tại (Railway)
```
DATABASE_URL = postgresql://postgres.umufftukrejijatimotz:<password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
DIRECT_URL   = postgresql://postgres.umufftukrejijatimotz:<password>@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

> ⚠️ Nếu sau này muốn dùng DIRECT_URL đúng chuẩn (bypass pooler), dùng:
> `postgresql://postgres:<password>@db.umufftukrejijatimotz.supabase.co:5432/postgres`
> Lưu ý: direct host chỉ hoạt động nếu Railway có IPv4 support.

---

## 2. Email Service — Resend

### Vấn đề
Phase 2 thêm tính năng **gửi email mời nhân viên** (Staff Invite). Cần cấu hình Resend.

### Biến môi trường cần thêm
| Biến | Giá trị | Ghi chú |
|------|---------|---------|
| `RESEND_API_KEY` | `re_xxx...` | Lấy từ https://resend.com/api-keys |
| `EMAIL_FROM` | `onboarding@resend.dev` | Dùng khi chưa verify domain |

### Fallback behavior
Nếu `RESEND_API_KEY` hoặc `EMAIL_FROM` **không được set**, hệ thống sẽ:
- Không crash
- Trả về nội dung email dạng text để admin copy thủ công
- Hiển thị toast: *"Chưa cấu hình gửi email, nội dung mời đã được copy"*

### Nâng cấp sau này
Khi có domain riêng (`bepnhaminh.vn`):
1. Verify domain tại https://resend.com/domains
2. Đổi `EMAIL_FROM` thành `noreply@bepnhaminh.vn`
3. Redeploy Railway (tự động sau khi đổi env var)

---

## 3. Git Workflow & Branch Strategy

### Sơ đồ
```
feature/* ──PR──► develop ──PR──► main ──auto──► Deploy
                  (staging)        (production)
```

### Remote repositories
| Remote | URL | Nhánh chính |
|--------|-----|------------|
| `new-origin` | https://github.com/truonggiang22b/DATN-HTG-Bep-Nha-Minh.git | **Remote chính** |
| `origin` | https://github.com/GiangHoangTruong/DATN-HTG-Bep-Nha-Minh.git | Repo cũ |

### Quy tắc commit
```
feat(scope):   tính năng mới
fix(scope):    sửa lỗi
chore(scope):  công việc không ảnh hưởng logic (gitignore, scripts...)
docs(scope):   tài liệu
refactor:      tái cấu trúc code
```

### PR Phase 2 đã merge
- **PR #2**: `feat(phase2): staff management, KDS optimistic update, admin/KDS UI polish`
- Merge: `feature/phase2-integration-2026-05-04` → `develop` ✅ (08/05/2026)
- Commits: 11 commits, +4,651 / -688 lines

---

## 4. Railway — Cấu hình Service

### Thông tin project
- Project: `refreshing-perfection`
- Environment: `production`
- Service: `DATN-HTG-Bep-Nha-Minh`
- Builder: Dockerfile (multi-stage, Node 20 Alpine)
- Start command: `npx prisma migrate deploy && node dist/server.js`

### Danh sách env vars đã set (tính đến 08/05/2026)
```
APP_BASE_URL          = <Railway URL>
DATABASE_URL          = <Supabase pooler:5432>
DIRECT_URL            = <Supabase pooler:5432>
EMAIL_FROM            = onboarding@resend.dev
FRONTEND_URL          = <Vercel URL>
NODE_ENV              = production
PORT                  = 3001
RESEND_API_KEY        = re_xxx... (thêm 08/05/2026)
SUPABASE_ANON_KEY     = eyJ...
SUPABASE_JWT_SECRET   = qRJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
SUPABASE_STORAGE_BUCKET   = menu-images
SUPABASE_URL          = https://umufftukrejijatimotz.supabase.co
```

### Health check endpoint
```
GET https://<railway-url>/health
→ {"status":"ok","timestamp":"..."}
```

---

## 5. Vercel — Cấu hình Frontend

### Thông tin
- Root directory: `web-prototype-react`
- Framework: Vite (SPA)
- Branch: `main`

### Env vars cần set
```
VITE_API_URL = https://<railway-url>/api
```

### Lưu ý SPA routing
File `vite.config.ts` đã được cấu hình `appType: 'spa'` và `vercel.json` cần:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
→ Đảm bảo F5 trên các route như `/admin`, `/kds`, `/login` không bị 404.

---

## 6. Tài khoản test Production

| Role | Email | Password |
|------|-------|---------|
| Admin | `admin@bepnhaminh.vn` | `Admin@123456` |
| Kitchen (KDS) | `bep@bepnhaminh.vn` | `Kitchen@123456` |
| Shipper | Tạo thủ công qua `/admin/staff` | — |

> Chú ý: Không có shipper account được seed sẵn. Owner cần tạo thủ công sau khi deploy.

---

## 7. Các lỗi build đã fix

| Lỗi | File | Fix |
|-----|------|-----|
| `TS6133: 'vars' declared but never read` | `KDSPage.tsx` | Đổi thành `_vars` |
| `TS6133: 'idx' declared but never read` | `AdminStaffPage.tsx` | Xóa tham số `idx` khỏi `.map()` |

Production build hiện tại: `exit 0` ✅, không còn lỗi TypeScript.

---

## 8. Checklist Deploy lần sau (khi có feature mới)

```
[ ] Commit code đúng format trên feature/*
[ ] Push lên new-origin
[ ] Tạo PR → develop → review → merge
[ ] Kiểm tra Railway tự redeploy (hoặc trigger thủ công)
[ ] Test staging trên develop
[ ] Merge develop → main → auto-deploy production
[ ] Smoke test: /health + /login + /kds + /order-online
```
