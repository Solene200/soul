'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_UNAUTHORIZED_EVENT, hasAccessToken } from '@/lib/auth';

export function useRequireAuth() {
  const router = useRouter();

  useEffect(() => {
    const redirectToLogin = () => {
      router.replace('/login');
    };

    if (!hasAccessToken()) {
      redirectToLogin();
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, redirectToLogin);

    return () => {
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, redirectToLogin);
    };
  }, [router]);
}
