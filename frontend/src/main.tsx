import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'material-symbols';
import { AuthProvider } from './features/auth/AuthProvider.tsx';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
