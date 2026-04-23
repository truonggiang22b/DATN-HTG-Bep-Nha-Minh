# Sprint A + B + C - Test Evaluation (2026-04-23)

## Scope da kiem

- Backend:
  - soft delete / restore cho `menu-items`, `categories`, `tables`
  - guard nghiep vu khi ngung su dung ban
  - staff management `list/create/update/status`
- Frontend:
  - admin tables cleanup flow
  - admin staff page load
  - admin staff create flow

## File test da them

- `backend-api/__tests__/admin_cleanup_staff.test.ts`
- `web-prototype-react/e2e/admin-cleanup-staff.spec.ts`

## Ket qua da chay

### Backend

Lenh:

```bash
cd backend-api
npx vitest run __tests__/admin_cleanup_staff.test.ts
```

Ket qua:

```txt
10 passed, 0 failed
```

Nhan xet:

- Backend implementation cho Sprint A + B dang hoat dong dung theo business rule da mo ta.
- API staff create/update/lock da chay duoc voi Supabase Auth + DB that.
- Guard `TABLE_HAS_OPEN_SESSION` va `TABLE_HAS_ACTIVE_ORDER` da duoc xac nhan.

### Frontend

Lenh:

```bash
cd web-prototype-react
npx playwright test e2e/admin-cleanup-staff.spec.ts
```

Ket qua:

```txt
2 passed, 1 failed
```

Pass:

- `TC-ACS-01`: them ban -> ngung su dung -> bat lai
- `TC-ACS-02`: admin staff page load

Fail:

- `TC-ACS-03`: create staff qua UI khong them duoc row moi va modal khong dong dung nhu ky vong

## Loi / diem can sua tiep

### 1. Frontend staff page dang dung sai toast API

- `web-prototype-react/src/pages/AdminStaffPage.tsx` dang goi `addToast`
- `web-prototype-react/src/store/useStore.ts` chi expose `showToast`

Tac dong:

- flow tao staff / update role / lock-unlock tren UI co nguy co bi vo runtime sau khi API tra ve thanh cong

### 2. Admin menu page chua noi UI vao delete/restore endpoints moi

Da co service:

- `deleteMenuItem`
- `restoreMenuItem`
- `deleteCategory`
- `restoreCategory`

Nhung `AdminMenuPage.tsx` hien tai van chi dung flow:

- `updateItemStatus`
- `createCategory`
- `updateCategory`

Tac dong:

- backend da co endpoint cleanup moi, nhung admin UI menu/category chua khai thac het

### 3. Role mismatch cho KDS

- `web-prototype-react/src/App.tsx` hien chi cho `['KITCHEN', 'ADMIN']` vao `/kds`
- Trong backend/business rule, `MANAGER` da duoc phep o nhieu internal flows lien quan

Tac dong:

- nghiep vu MANAGER co the bi lech giua FE va BE

## Ket luan

- Backend Sprint A + B: dat muc chay duoc bang test.
- Frontend Sprint C: tables cleanup on, staff page co, nhung create staff UI chua on vi bug runtime.
- Truoc khi coi Sprint C xanh, can sua `AdminStaffPage` va chay lai Playwright spec moi.
