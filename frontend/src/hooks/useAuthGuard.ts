import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMagneto } from '../context/MagnetoContext';

export function useAuthGuard() {
  const router = useRouter();
  const { state } = useMagneto();

  useEffect(() => {
    if (!state.isAuthenticated) {
      router.replace('/');
    }
  }, [state.isAuthenticated, router]);

  return state.isAuthenticated;
}
