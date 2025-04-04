import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

// Import fontsource
import '@fontsource/public-sans';
import '@fontsource/roboto';
import '@fontsource/poppins';
import '@fontsource/inter';

import App from './App';
import { store } from './store';
import './index.css';

// Render the application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
