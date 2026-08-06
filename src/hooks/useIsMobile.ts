import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint = 640) {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < breakpoint);
  useEffect(() => { const query = window.matchMedia(`(max-width: ${breakpoint - 1}px)`); const update = () => setMobile(query.matches); update(); query.addEventListener('change', update); return () => query.removeEventListener('change', update); }, [breakpoint]);
  return mobile;
}
