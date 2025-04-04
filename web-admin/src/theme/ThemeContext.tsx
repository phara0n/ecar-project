import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Define the theme mode type
type ThemeMode = 'light' | 'dark';

// Define the context shape
interface ThemeContextType {
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  toggleThemeMode: () => {},
  setThemeMode: () => {},
});

// Custom hook for using the theme context
export const useThemeContext = () => useContext(ThemeContext);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Local storage key for theme mode
const THEME_MODE_KEY = 'ecar-theme-mode';

// Provider component
export function ThemeContextProvider({ children }: ThemeProviderProps) {
  // Initialize theme state from localStorage or system preference
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    // Check if user has previously selected a theme
    const storedTheme = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    
    if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
      return storedTheme;
    }
    
    // If no stored preference, use system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    // Default to light mode
    return 'light';
  });

  // Update localStorage when theme changes
  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, themeMode);
    
    // Apply theme-specific class to body for global CSS
    document.body.classList.remove('light-mode', 'dark-mode');
    document.body.classList.add(`${themeMode}-mode`);
  }, [themeMode]);

  // Toggle between light and dark modes
  const toggleThemeMode = () => {
    setThemeModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Set a specific theme mode
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  // Create the context value object
  const contextValue: ThemeContextType = {
    themeMode,
    toggleThemeMode,
    setThemeMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeContext; 