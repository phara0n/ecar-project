import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import App from './App.tsx'
import './i18n' // Import the i18n configuration

// Initial theme setup based on store/localStorage
const initialTheme = store.getState().ui.theme;
document.documentElement.classList.add(initialTheme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <React.Suspense fallback={<div>Loading translations...</div>}>
        <App />
      </React.Suspense>
    </Provider>
  </React.StrictMode>,
)
