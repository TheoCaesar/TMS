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
    usersApi
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
