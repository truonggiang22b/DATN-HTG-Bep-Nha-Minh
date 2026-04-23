import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        supabaseUserId: string;
        email: string;
        displayName: string;
        storeId: string;
        branchId: string | null;
        roles: UserRole[];
      };
    }
  }
}

/**
 * Fix Express 5 breaking change:
 * ParamsDictionary was changed to Record<string, string | string[]>.
 * Override back to Record<string, string> for Prisma/controller compatibility.
 */
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }
}

export {};
