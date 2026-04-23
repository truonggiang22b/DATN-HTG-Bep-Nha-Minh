# Deploy Environment Rotation

This workspace was updated to stop accidental re-commits of local `.env` files and to provide production env templates.

What was changed:
- `.env` and `.env.*` are now ignored at the workspace root and in both deployable apps.
- Safe example files are kept via `!.env.example` and `!.env.production.example`.
- Frontend now has a production env file so Vite does not fall back to `http://localhost:3001/api` during production builds.

What still must be done outside the codebase:
1. Rotate the current Supabase database password.
2. Rotate `SUPABASE_SERVICE_ROLE_KEY`.
3. Rotate the JWT secret or regenerate the project secret set used by the backend.
4. Update the new values in your deployment platform secrets:
   - Railway: backend env vars
   - Vercel: `VITE_API_URL`
   - Supabase dashboard: source of truth for rotated keys

Recommended production values:
- Backend `APP_BASE_URL`: `https://api.example.com`
- Backend `FRONTEND_URL`: `https://app.example.com`
- Frontend `VITE_API_URL`: `https://api.example.com/api`

Important:
- The current local file `backend-api/.env` was intentionally left untouched so your local app does not break before you rotate the real secrets.
- After rotating secrets, update local `backend-api/.env` manually or replace it from `backend-api/.env.production.example` as needed.
