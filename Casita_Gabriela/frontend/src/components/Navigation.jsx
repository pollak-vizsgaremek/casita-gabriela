import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';

const Navigation = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Felhasználó állapot: helyi tárolóból töltjük be, UI frissítéshez
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Útvonalváltáskor bezárjuk az oldalsávot
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Eseménykezelők az azonnali UI frissítéshez (login/logout más tabokban)
    const onAuthChanged = (e) => {
      const detail = e?.detail;
      if (!detail) {
        setUser(null);
        return;
      }
      setUser(detail.user || null);
    };

    // Storage esemény: ha másik tab módosítja a sessiont, frissítjük
    const onStorage = (e) => {
      if (e.key === 'user' || e.key === 'token' || e.key === 'user_id') {
        try {
          const raw = localStorage.getItem('user');
          setUser(raw ? JSON.parse(raw) : null);
        } catch {
          setUser(null);
        }
      }
    };

    window.addEventListener('authChanged', onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('authChanged', onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // Session törlése és értesítés a komponenseknek
  const clearSession = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    window.dispatchEvent(new CustomEvent('authChanged', { detail: null }));
    setUser(null);
  };

  // Kijelentkezés: session törlése és átirányítás
  const handleLogout = () => {
    clearSession();
    window.location.href = '/login';
  };

  // Belépés gombra kattintás: előző session eltávolítása
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
    <div>
      <nav
        className="bg-[#C0FF95] w-dvw h-[10dvh] flex items-center px-4 sm:px-8 shadow-md border-b-2 border-gray-200 fixed top-0 left-0 right-0"
        style={{ zIndex: 200 }}
      >
        <Link to="/" className="h-full flex items-center flex-shrink-0">
          <img src="/C.png" alt="Home" className="site-logo h-10 sm:h-12 md:h-14 w-auto object-contain" />
        </Link>

        <div className="ml-auto hidden sm:flex items-center pr-4 gap-4 sm:gap-4 md:gap-6 lg:gap-8 nav-links">
          {routes.slice(1, 3).map((r) => (
            <Link
              to={r.route}
              key={r.route}
              className="text-[#1F1F1F] px-3 py-1 font-bold hover:text-[#515151] hover:-translate-y-px transition-all duration-200 flex-shrink-0"
            >
              {r.name}
            </Link>
          ))}

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

          {user && (
            <>
              {Number(user.isAdmin) === 1 ? (
                <>
                  <Link
                    to="/user/bookings"
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium hover:bg-green-100 transition"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="w-7 h-7 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden md:inline">{user.name}</span>
                  </Link>
                  <Link
                    to="/admin"
                    className="bg-[#2B6CB0] text-white px-4 py-2 rounded-xl hover:-translate-y-px hover:bg-[#245a94] transition-all duration-200 font-semibold cursor-pointer"
                  >
                    Admin
                  </Link>
                </>
              ) : (
                <Link
                  to="/user/bookings"
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium hover:bg-green-100 transition"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="w-7 h-7 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:inline">{user.name}</span>
                </Link>
              )}
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
        </div>

        <div className="ml-auto sm:hidden flex items-center pr-2">
          <button
            aria-label="Menü megnyitása"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md bg-white/90 hover:bg-white transition-shadow shadow"
            style={{ zIndex: 210 }}
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 transition-opacity duration-200 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-hidden={!sidebarOpen}
        onClick={() => setSidebarOpen(false)}
        style={{ backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 1050 }}
      />

      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-[86vw] bg-[#C0FF95] shadow-lg transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!sidebarOpen}
        role="dialog"
        aria-label="Oldalsó menü"
        style={{ zIndex: 1100 }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-end pl-4 pr-6 py-4 border-b border-gray-200">
            <button
              aria-label="Bezár"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md bg-white/90 hover:bg-white transition-shadow shadow"
            >
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-auto pl-4 pr-6 py-6">
            <nav className="flex flex-col gap-3">
              {routes.slice(1, 3).map((r) => (
                <Link
                  to={r.route}
                  key={r.route}
                  onClick={() => setSidebarOpen(false)}
                  className="text-[#1F1F1F] px-3 py-3 font-semibold rounded-lg hover:bg-white/60 text-center"
                >
                  {r.name}
                </Link>
              ))}

              <div className="mt-4 border-t border-gray-200 pt-4 flex flex-col gap-3">
                {!user && (
                  <Link
                    to="/login"
                    onClick={() => { handleLoginClick(); setSidebarOpen(false); }}
                    className="bg-[#6FD98C] text-white px-4 py-3 rounded-xl hover:bg-[#5FCB80] text-center font-bold"
                  >
                    Bejelentkezés
                  </Link>
                )}

                {user && (
                  <>
                    {Number(user.isAdmin) === 1 ? (
                      <Link
                        to="/user/bookings"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium hover:bg-green-100 transition"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="w-9 h-9 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-600">Felhasználó</div>
                        </div>
                      </Link>
                    ) : (
                      <Link
                        to="/user/bookings"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 bg-white/80 rounded-lg shadow-sm text-gray-800 font-medium hover:bg-green-100 transition"
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="w-9 h-9 bg-[#6FD98C] text-white rounded-full flex items-center justify-center font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-600">Felhasználó</div>
                        </div>
                      </Link>
                    )}

                    {Number(user.isAdmin) === 1 && (
                      <Link
                        to="/admin"
                        onClick={() => setSidebarOpen(false)}
                        className="bg-[#2B6CB0] text-white px-4 py-3 rounded-xl hover:bg-[#245a94] text-center font-semibold"
                      >
                        Admin
                      </Link>
                    )}

                    <button
                      onClick={() => { handleLogout(); setSidebarOpen(false); }}
                      className="mt-2 px-4 py-3 rounded-xl text-white font-semibold w-full"
                      style={{ backgroundColor: '#e53e3e' }}
                    >
                      Kijelentkezés
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 text-sm text-gray-700">
            <div className="flex justify-center gap-4">
              <Link to="/privacy" onClick={() => setSidebarOpen(false)} className="hover:underline">Adatvédelem</Link>
              <Link to="/terms" onClick={() => setSidebarOpen(false)} className="hover:underline">ÁSZF</Link>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Navigation;
