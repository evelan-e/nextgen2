import { useState, useEffect, useCallback } from 'react';

/**
 * Tracks sidebar collapsed/expanded state.
 * Initialises as collapsed when the viewport is narrower than 768 px,
 * and updates on window resize.
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(
    () => window.innerWidth < 768
  );

  useEffect(() => {
    function handleResize() {
      setIsCollapsed(window.innerWidth < 768);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  return { isCollapsed, setIsCollapsed, toggle };
}
