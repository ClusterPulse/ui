/**
 * Theme Store - PatternFly 6 Compatible
 * Manages dark/light theme via pf-v6-theme-dark class on <html>
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const applyTheme = (isDark: boolean) => {
  if (isDark) {
    document.documentElement.classList.add('pf-v6-theme-dark');
  } else {
    document.documentElement.classList.remove('pf-v6-theme-dark');
  }
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
      name: 'clusterpulse-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.isDarkTheme);
        }
      },
    }
  )
);

// Initialize on load
if (typeof window !== 'undefined') {
  const store = useThemeStore.getState();
  applyTheme(store.isDarkTheme);
  
  // Listen for system preference changes (only if no saved preference)
  const hasPreference = localStorage.getItem('clusterpulse-theme');
  if (!hasPreference) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    store.setTheme(prefersDark);
  }
}
