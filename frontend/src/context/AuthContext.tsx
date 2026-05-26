import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { authService } from '../api/services/authService';
import type { AuthResponse, Role } from '../types';

export interface AuthContextValue {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  /**
   * True until the initial /me probe resolves. Route guards block rendering
   * while this is true to prevent a flash of the login page on refresh.
   */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  role: Role | null;
  /** True for SUPER_ADMIN or ADMIN — anyone with write access. */
  isAdmin: boolean;
  /** True only for SUPER_ADMIN. Gates company-management UI. */
  isSuperAdmin: boolean;
  companyId: number | null;
  companyName: string | null;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Initial probe — are we already logged in (cookie still valid)?
  useEffect(() => {
    let cancelled = false;
    authService
      .me()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await authService.login(email, password);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      role: user?.role ?? null,
      isAdmin: user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN',
      isSuperAdmin: user?.isSuperAdmin ?? false,
      companyId: user?.companyId ?? null,
      companyName: user?.companyName ?? null,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
