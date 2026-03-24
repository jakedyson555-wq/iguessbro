import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Nav from './components/Nav';
import './index.css';

export default function App() {
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
        <Outlet />
      </main>
    </div>
  );
}