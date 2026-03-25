// src/components/Navigation.jsx

import React, { useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router';

const Navigation = () => {
  const navRef = useRef();
  const location = useLocation();

  // 🔥 user derived state – nincs több React warning
  const user = useMemo(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []); // ❗ nincs dependency → nincs warning

  const showSideBar = () => {
    if (navRef.current) navRef.current.classList.add('showSidebar');
  };

  const hideSideBar = () => {
    if (navRef.current) navRef.current.classList.remove('showSidebar');
  };

  const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
  };

  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  const handleLoginClick = () => {
    clearSession();
  };

  const routes = [
    { name: 'Főoldal', route: '/' },
    { name: 'Rólunk', route: '/about' },
    { name: 'Kapcsolat', route: '/contact' },
    { name: 'Bejelentkezés', route: '/login' },
  ];

  return (
    <div className="z-10 overflow-visible">
      {/* HEADER */}
      <nav className="bg-[#C0FF95] w-dvw h-[10dvh] flex items-center px-8 shadow-md z-40 border-b-2 border-gray-200 fixed top-0">

        {/* LOGO */}
        <Link to="/" className="h-full flex items-center">
          <img src="/C.png" alt="Home" className="h-7/10 w-auto" />
        </Link>

        {/* JOBB OLDAL */}
        <div className="ml-auto flex gap-6 items-center pr-4">

          {/* Menü linkek */}
          {routes.slice(1, 3).map((r) => (
            <Link
              to={r.route}
              key={r.route}
              className="text-[#1F1F1F] px-3 py-1 hidden sm:inline font-bold hover:text-[#515151] hover:-translate-y-px transition-all duration-200"
            >
              {r.name}
            </Link>
          ))}

          {/* Ha nincs bejelentkezve */}
          {!user && (
            <Link
              to="/login"
              onClick={handleLoginClick}
              className="bg-[#6FD98C] text-white px-6 py-2 rounded-xl hover:-translate-y-px hover:bg-[#5FCB80] transition-all duration-200 text-center font-bold flex items-center justify-center cursor-pointer"
              style={{ minWidth: 160, whiteSpace: 'nowrap' }}
            >
              Bejelentkezés
            </Link>
          )}

          {/* Ha be van jelentkezve */}
          {user && (
            <>
              {/* Avatar + név */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium">
                <span className="w-7 h-7 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </div>

              {/* Admin gomb */}
              {Number(user.isAdmin) === 1 && (
                <Link
                  to="/admin"
                  className="bg-[#2B6CB0] text-white px-4 py-2 rounded-xl hover:-translate-y-px hover:bg-[#245a94] transition-all duration-200 font-semibold cursor-pointer"
                >
                  Admin
                </Link>
              )}

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="px-6 py-2 rounded-xl text-white font-semibold cursor-pointer"
                style={{
                  backgroundColor: '#e53e3e',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  minWidth: 160,
                  whiteSpace: 'nowrap',
                }}
              >
                Kijelentkezés
              </button>
            </>
          )}

          {/* Sidebar ikon */}
          <div className="icon cursor-pointer" onClick={showSideBar} />
        </div>
      </nav>

      {/* SIDEBAR */}
      <nav
        ref={navRef}
        className="bg-[#C0FF95] sidebar w-60 h-dvh fixed right-0 top-0 items-center px-4 shadow-md z-50 border-b-2 border-gray-200"
      >
        <div className="ml-auto flex flex-col gap-6 items-center w-full">
          <div className="icon2 mt-10 cursor-pointer" onClick={hideSideBar} />

          {routes.slice(1, 3).map((r) => (
            <Link
              to={r.route}
              key={r.route}
              className="text-[#1F1F1F] px-3 py-2 font-bold hover:text-[#515151] hover:-translate-y-px transition-all duration-200 w-full text-center"
            >
              {r.name}
            </Link>
          ))}

          {!user && (
            <Link
              to="/login"
              onClick={handleLoginClick}
              className="bg-[#6FD98C] text-white px-4 py-2 rounded-xl hover:bg-[#5FCB80] transition-all duration-200 w-full text-center font-bold cursor-pointer"
            >
              Bejelentkezés
            </Link>
          )}

          {user && (
            <>
              {/* Avatar + név sidebarban */}
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium w-full justify-center">
                <span className="w-7 h-7 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                  {user.name?.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </div>

              {Number(user.isAdmin) === 1 && (
                <Link
                  to="/admin"
                  className="bg-[#2B6CB0] text-white px-4 py-2 rounded-xl hover:bg-[#245a94] transition-all duration-200 w-full text-center font-semibold cursor-pointer"
                >
                  Admin
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="mt-2 px-4 py-2 rounded-xl text-white font-semibold w-full cursor-pointer"
                style={{ backgroundColor: '#e53e3e' }}
              >
                Kijelentkezés
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navigation;
