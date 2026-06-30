import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { DesignSystemProvider } from './providers/design-system-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignSystemProvider>
      <App />
    </DesignSystemProvider>
  </StrictMode>,
);
