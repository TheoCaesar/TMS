import { useEffect, useRef, useState } from 'react';

type Status = 'loading' | 'error' | 'ready';

// Small fetch-with-retry hook, runs `fetcher` once on mount — the live API
// (Render free tier) has shown intermittent 503s, so every list/detail
// screen needs a retry affordance rather than silently rendering empty.
// If a screen needs to refetch when some param changes (e.g. a slug from
// the URL), call `retry()` from a `useEffect` keyed on that param.
export function useApiResource<T>(fetcher: () => Promise<T>) {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<T | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  function load() {
    setStatus('loading');
    fetcherRef
      .current()
      .then((result) => {
        setData(result);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, []);

  return { data, status, retry: load };
}
