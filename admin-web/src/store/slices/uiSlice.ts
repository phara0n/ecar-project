import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface UiState {
  theme: 'light' | 'dark';
  isSidebarOpen: boolean;
}

const initialState: UiState = {
  // Check localStorage or system preference for initial theme
  theme: localStorage.getItem('theme') as 'light' | 'dark' || 'dark', 
  isSidebarOpen: true, 
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload); // Persist theme preference
      // Optional: Add logic to update <html> class here or in a useEffect hook
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(action.payload);
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
  },
});

export const { setTheme, toggleSidebar, setSidebarOpen } = uiSlice.actions;

// Selectors
export const selectTheme = (state: RootState) => state.ui.theme;
export const selectIsSidebarOpen = (state: RootState) => state.ui.isSidebarOpen;

export default uiSlice.reducer; 