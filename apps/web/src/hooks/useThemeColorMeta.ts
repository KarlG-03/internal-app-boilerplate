import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const THEME_LIGHT = '#2563eb';
const THEME_DARK = '#1e3a8a';

export function useThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === 'dark' ? THEME_DARK : THEME_LIGHT;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', color);
    }
  }, [resolvedTheme]);
}
