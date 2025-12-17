/**
 * Theme Store - PatternFly v6
 * Uses pf-v6-theme-dark class; semantic tokens auto-handle dark mode
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const applyTheme = (isDark: boolean) => {
  const html = document.documentElement;
  if (isDark) {
    html.classList.add('pf-v6-theme-dark');
  } else {
    html.classList.remove('pf-v6-theme-dark');
  }
  html.setAttribute('data-theme', isDark ? 'dark' : 'light');
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkTheme: false,
      toggleTheme: () => {
        const newTheme = !get().isDarkTheme;
        set({ isDarkTheme: newTheme });
        applyTheme(newTheme);
      },
      setTheme: (isDark: boolean) => {
        set({ isDarkTheme: isDark });
        applyTheme(isDark);
      },
    }),
    {
      name: 'openshift-monitor-theme-v2',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.isDarkTheme);
      },
    }
  )
);

// Initialize on load
if (typeof window !== 'undefined' && !document.documentElement.hasAttribute('data-theme')) {
  applyTheme(useThemeStore.getState().isDarkTheme);
}

// System preference listener
if (typeof window !== 'undefined') {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (!localStorage.getItem('openshift-monitor-theme-v2')) {
    useThemeStore.getState().setTheme(mq.matches);
  }
  mq.addEventListener('change', (e) => {
    const last = localStorage.getItem('openshift-monitor-theme-last-change');
    if (!last || Date.now() - parseInt(last) > 86400000) {
      useThemeStore.getState().setTheme(e.matches);
    }
  });
}
