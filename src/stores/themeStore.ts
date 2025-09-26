/**
 * Theme Store
 * Global state management for theme preferences using Zustand
 * Properly integrates with PatternFly's theme system
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDarkTheme: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

// Apply theme to document
const applyTheme = (isDark: boolean) => {
  const htmlElement = document.documentElement;
  
  if (isDark) {
    htmlElement.classList.add('pf-v5-theme-dark');
    htmlElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.classList.remove('pf-v5-theme-dark');
    htmlElement.setAttribute('data-theme', 'light');
  }
  
  // Force a repaint to ensure theme is applied
  requestAnimationFrame(() => {
    htmlElement.style.display = 'none';
    htmlElement.offsetHeight; // Trigger reflow
    htmlElement.style.display = '';
  });
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkTheme: false, // Default to light theme
      
      toggleTheme: () => {
        const newTheme = !get().isDarkTheme;
        set({ isDarkTheme: newTheme });
        applyTheme(newTheme);
        // Store the timestamp of manual change to prevent auto-switching
        localStorage.setItem('openshift-monitor-theme-last-change', Date.now().toString());
      },
      
      setTheme: (isDark: boolean) => {
        set({ isDarkTheme: isDark });
        applyTheme(isDark);
        // Store the timestamp when theme is set programmatically too
        localStorage.setItem('openshift-monitor-theme-last-change', Date.now().toString());
      },
    }),
    {
      name: 'openshift-monitor-theme-v2',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately when store is rehydrated
        if (state) {
          applyTheme(state.isDarkTheme);
        }
      },
    }
  )
);

// Initialize theme on module load (only if not already applied)
if (typeof window !== 'undefined' && !document.documentElement.hasAttribute('data-theme')) {
  const store = useThemeStore.getState();
  applyTheme(store.isDarkTheme);
}

// Listen for system theme changes (optional - user preference takes precedence)
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Only apply system theme if user hasn't set a preference
  const hasUserPreference = localStorage.getItem('openshift-monitor-theme-v2');
  if (!hasUserPreference) {
    useThemeStore.getState().setTheme(mediaQuery.matches);
  }
  
  mediaQuery.addEventListener('change', (e) => {
    // Only auto-switch if user hasn't manually set a preference recently
    const lastChange = localStorage.getItem('openshift-monitor-theme-last-change');
    const now = Date.now();
    if (!lastChange || now - parseInt(lastChange) > 24 * 60 * 60 * 1000) { // 24 hours
      useThemeStore.getState().setTheme(e.matches);
    }
  });
}