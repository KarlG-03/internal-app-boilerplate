export type AdminUser = {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
  activeSessionCount: number;
};

export type AdminSession = {
  id: string;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
};

export type AdminStats = {
  userCount: number;
  activeSessionCount: number;
};
