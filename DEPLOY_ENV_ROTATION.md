# Deploy Environment & Secret Rotation

> Cập nhật: 23/04/2026  
> Mục tiêu: chuẩn hóa biến môi trường cho deploy và tránh lộ secret thật trong báo cáo/source code.

## 1. Nguyên tắc

- Không commit `.env`, `.env.production`, `.env.local` hoặc bất kỳ file nào chứa secret thật.
- Chỉ commit file mẫu: `.env.example`, `.env.production.example`.
- Secret production phải cấu hình trực tiếp trên Railway/Vercel/Supabase, không copy vào tài liệu nộp GVHD.
- Sau khi nghi ngờ secret từng lộ hoặc từng được dùng trong môi trường không an toàn, cần rotate ngay.

## 2. Backend Env Bắt Buộc

Backend nằm trong `backend-api`.

| Biến | Môi trường | Ghi chú |
|---|---|---|
| `PORT` | local/deploy | Railway có thể inject port; local dùng `3001` |
| `NODE_ENV` | local/deploy/test | `development`, `production`, hoặc `test` |
| `APP_BASE_URL` | deploy | URL public của backend |
| `FRONTEND_URL` | deploy | URL public của frontend để CORS allowlist |
| `DATABASE_URL` | deploy | Supabase pooled connection cho runtime |
| `DIRECT_URL` | deploy/migrate | Supabase direct connection cho Prisma migrate |
| `SUPABASE_URL` | deploy | Project URL |
| `SUPABASE_ANON_KEY` | deploy | Dùng cho auth client phía backend |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy | Server-side only, cần bảo mật cao |
| `SUPABASE_JWT_SECRET` | deploy | JWT secret trong Supabase settings |
| `SUPABASE_STORAGE_BUCKET` | optional | Bucket ảnh menu, mặc định nên dùng `menu-images` |

## 3. Frontend Env Bắt Buộc

Frontend nằm trong `web-prototype-react`.

| Biến | Giá trị mẫu | Ghi chú |
|---|---|---|
| `VITE_API_URL` | `https://your-backend.example.com/api` | Không để fallback localhost khi build production |

## 4. Giá Trị Production Khuyến Nghị

```text
Backend APP_BASE_URL=https://your-backend.up.railway.app
Backend FRONTEND_URL=https://your-frontend.vercel.app
Frontend VITE_API_URL=https://your-backend.up.railway.app/api
```

## 5. Quy Trình Rotate Secret

1. Vào Supabase Dashboard.
2. Rotate database password.
3. Rotate hoặc tạo lại `SUPABASE_SERVICE_ROLE_KEY` nếu cần.
4. Kiểm tra lại `SUPABASE_JWT_SECRET` trong Supabase JWT settings.
5. Cập nhật secret mới trên Railway backend env vars.
6. Cập nhật `VITE_API_URL` trên Vercel nếu backend URL thay đổi.
7. Chạy lại Prisma migrate nếu cần:

```bash
cd backend-api
npm run db:migrate:deploy
```

8. Chạy smoke test sau deploy:

```bash
curl https://your-backend.up.railway.app/health
```

9. Chạy lại test local/staging nếu dùng cùng database staging:

```bash
cd backend-api && npm test
cd web-prototype-react && npm test
```

## 6. Trạng Thái Hiện Tại

- `backend-api/.env` là file local thật, không đưa nội dung vào báo cáo.
- `backend-api/.env.example` và `backend-api/.env.production.example` là file mẫu an toàn.
- Nếu deploy production, cần nhập secret thật trực tiếp trên Railway/Vercel, không commit lại vào repo.
- Sau đợt chuẩn hóa ngày 23/04/2026, test local mới nhất:
  - Backend: `99/99 passed`
  - Frontend E2E: `54 passed, 1 skipped, 0 failed`
