import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// Opens a create form when the page is reached with ?new=1, then clears the param.
export function useAutoNew(onNew: () => void): void {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (params.get('new') === '1') {
      onNew();
      const next = new URLSearchParams(params);
      next.delete('new');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
