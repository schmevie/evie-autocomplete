import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './assets/ui-kit/css/ui-kit.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="App">
      <App />
    </div>
  </StrictMode>
);
