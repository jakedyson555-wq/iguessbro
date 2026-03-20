// App.jsx

import { useEffect } from 'react';
import Nav from './components/Nav';
import './index.css';

export default function App({ children }) {
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = ''; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="main-content-skip-to">
        Skip to main content
      </a>

      <Nav />

      <main
        id="main-content"
        tabIndex={-1}
        style={{ paddingTop: 44 }}
        className="outline-none flex-1"
      >
        {children}
      </main>
    </div>
  );
}