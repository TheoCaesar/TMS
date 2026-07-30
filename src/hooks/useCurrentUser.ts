import { useEffect, useState } from 'react';
import { getTokens, usersApi, type UserProfile } from '@/lib/api';

export function useCurrentUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getTokens()) {
      setLoading(false);
      return;
    }
    const subscription = usersApi.getMe$().subscribe({
      next: (profile) => {
        setUser(profile);
        setLoading(false);
      },
      error: () => {
        setUser(null);
        setLoading(false);
      },
    });
    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
