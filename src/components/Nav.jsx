// Nav.jsx

import { useState } from 'react';
import { Search, Settings } from 'lucide-react';

function NavItem({ label, href, active }) {
  return (
    <a
      role="listitem"
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{ color: 'white', textDecoration: 'none', fontSize: 15, fontWeight: 400, padding: '0 20px', whiteSpace: 'nowrap', opacity: active ? 1 : 0.9, height: '100%', display: 'inline-flex', alignItems: 'center' }}
    >
      {label}
    </a>
  );
}

export default function Nav() {
  const path = window.location.pathname;
  const [query, setQuery] = useState('');

  const navLinks = [
    { label: 'Games',       href: '/' },
    { label: 'Explore',     href: '/explore' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Boibucks',    href: '/boibucks' },
  ];

  return (
    <nav
      aria-label="Main navigation"
      style={{ background: '#6d28d9', height: 44, display: 'flex', alignItems: 'center', paddingLeft: 8, paddingRight: 16, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 70 }}
    >
      {/* Logo */}
      <a href="/" aria-label="Boiby home" style={{ display: 'flex', alignItems: 'center', padding: '0 12px', height: '100%', flexShrink: 0 }}>
        <img src="/assets/boibylongdark.png" alt="Boiby" style={{ height: 28, filter: 'brightness(0) invert(1)' }} />
      </a>

      {/* Nav links */}
      <div role="list" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {navLinks.map((link) => (
          <NavItem key={link.href} label={link.label} href={link.href} active={path === link.href} />
        ))}
      </div>

      {/* Search bar — fixed width, white, icon on right */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', marginLeft: 16, height: 30, width: 260, paddingLeft: 10, paddingRight: 8, gap: 6, flexShrink: 0 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#333', fontSize: 14 }}
        />
        <Search size={16} style={{ color: '#888', flexShrink: 0 }} aria-hidden="true" />
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', flexShrink: 0 }}>
        <a
          href="/boibucks"
          aria-label="Boibucks"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', height: '100%', textDecoration: 'none' }}
        >
          <img src="/assets/Boibucks.png" alt="" aria-hidden="true" style={{ width: 18, height: 18, objectFit: 'contain' }} />
          <span style={{ color: 'white', fontSize: 15, fontWeight: 500 }}>0</span>
        </a>
        <a
          href="/settings"
          aria-label="Settings"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 10px', height: '100%', textDecoration: 'none' }}
        >
          <Settings size={18} style={{ color: 'white' }} aria-hidden="true" />
        </a>
      </div>
    </nav>
  );
}