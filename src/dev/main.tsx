/**
 * The lab page's entry point. lab.html is served by the dev server (npm run dev, then /lab.html)
 * and left out of the build, so it never reaches the live site.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../style.css';
import './lab.css';
import { Lab } from './Lab';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
