'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'MODERATOR' | 'ADMIN';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (requiredRole && user) {
      const roleHierarchy = { USER: 0, MODERATOR: 1, ADMIN: 2 };
      const userLevel = roleHierarchy[user.role];
      const requiredLevel = roleHierarchy[requiredRole];

      if (userLevel < requiredLevel) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user) {
    const roleHierarchy = { USER: 0, MODERATOR: 1, ADMIN: 2 };
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requiredRole];

    if (userLevel < requiredLevel) {
      return null;
    }
  }

  return <>{children}</>;
}
