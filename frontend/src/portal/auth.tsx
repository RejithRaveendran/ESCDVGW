import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, ApiError } from '@/lib/api';

export type Role = 'manufacturer' | 'consultant' | 'certification_manager' | 'admin';
export type User = { id: number; name: string; email: string; role: Role; designation?: string; organization_id?: number; organization_name?: string };

export const ROLE_LABEL: Record<Role, string> = {
  manufacturer: 'Manufacturer',
  consultant: 'Consultant',
  certification_manager: 'Certification Manager',
  admin: 'Administrator',
};
export const isStaff = (u?: User | null) => !!u && u.role !== 'manufacturer';
export const isManager = (u?: User | null) => !!u && (u.role === 'certification_manager' || u.role === 'admin');

type Ctx = { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> };
const AuthCtx = createContext<Ctx>(null as unknown as Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User | null }>('/auth/session')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User }>('/auth/login', { body: { email, password } });
    setUser(r.user);
  }, []);
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
  }, []);

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** Small data-loading hook with reload + 401 awareness. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    api<T>(path, { signal: ctrl.signal })
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => e.name !== 'AbortError' && setError(e));
    return () => ctrl.abort();
  }, [path, tick]);
  return { data, error, reload: () => setTick((t) => t + 1) };
}
