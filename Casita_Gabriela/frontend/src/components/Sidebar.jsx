import React, { useEffect, useState, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import api from '../services/api'

const SEEN_KEY = 'sidebar_seen_ids';

const getSeenIds = () => {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch { return {}; }
};
const setSeenId = (key, maxId) => {
  const seen = getSeenIds();
  seen[key] = maxId;
  localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
};

const Sidebar = ({ isOpen, onClose, userPanel }) => {
  const [counts, setCounts] = useState({});
  const [maxIds, setMaxIds] = useState({});
  const location = useLocation();

  const fetchCounts = useCallback(() => {
    const seen = getSeenIds();
    const prefix = userPanel ? '/user/counts' : '/admin/counts';
    const params = userPanel
      ? { sinceBooking: seen.bookings || 0, sinceReview: seen.reviews || 0 }
      : { sinceBooking: seen.bookings || 0, sinceReview: seen.reviews || 0, sinceUser: seen.users || 0 };
    api.get(prefix, { params })
      .then(res => {
        setCounts(res.data);
        setMaxIds(res.data.maxIds || {});
      })
      .catch(() => {});
  }, [userPanel]);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  // When navigating to a section, mark it as seen and refresh counts
  useEffect(() => {
    const path = location.pathname;
    const sectionMap = userPanel
      ? { '/user/bookings': 'bookings', '/user/reviews': 'reviews' }
      : { '/admin/bookings': 'bookings', '/admin/reviews': 'reviews', '/admin/users': 'users' };
    const key = sectionMap[path];
    if (key && maxIds[key]) {
      setSeenId(key, maxIds[key]);
      fetchCounts();
    }
  }, [location.pathname, maxIds, userPanel, fetchCounts]);

  const adminItems = [
    { to: '/admin', label: 'Szobák kezelése', countKey: null, icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    )},
    { to: '/admin/categories', label: 'Kategóriák kezelése', countKey: null, icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h10M7 15h10" />
      </svg>
    )},
    { to: '/admin/bookings', label: 'Foglalások kezelése', countKey: 'bookings', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
      </svg>
    )},
    { to: '/admin/reviews', label: 'Értékelések', countKey: 'reviews', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 17l-5 3 1-6-4-4 6-1 3-6 3 6 6 1-4 4 1 6z" />
      </svg>
    )},
    { to: '/admin/users', label: 'Felhasználók kezelése', countKey: 'users', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM2 20c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6" />
      </svg>
    )},
  ];
  const userItems = [
    { to: '/user/bookings', label: 'Foglalásaim', countKey: 'bookings', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
      </svg>
    )},
    { to: '/user/data', label: 'Adataim', countKey: null, icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM2 20c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6" />
      </svg>
    )},
    { to: '/user/reviews', label: 'Értékeléseim', countKey: 'reviews', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 17l-5 3 1-6-4-4 6-1 3-6 3 6 6 1-4 4 1 6z" />
      </svg>
    )},
  ];
  const items = userPanel ? userItems : adminItems;

  return (
    <aside
      className={`
        bg-white text-black shadow-md z-40 transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:shadow-none md:fixed
        w-64 fixed
      `}
      style={{
        top: '10dvh',                 // NAVBAR ALATTI KEZDÉS
        left: 0,
        height: 'calc(100dvh - 10dvh)' // TELJES MAGASSÁG NAVBAR NÉLKÜL
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-full flex flex-col">

        {/* HEADER + X ICON */}
        <div className="px-4 py-4 border-b flex items-center justify-between bg-white">
          <div>
            <div className="text-lg font-semibold">{userPanel ? (() => { try { const u = JSON.parse(localStorage.getItem('user')); return u?.name || 'Felhasználó'; } catch { return 'Felhasználó'; } })() : 'Admin'}</div>
            <div className="text-xs text-gray-500 mt-1">{userPanel ? 'Saját fiók' : 'Vezérlőpult'}</div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-2 rounded hover:bg-gray-100 transition"
            aria-label="Sidebar bezárása"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-700"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-auto p-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors
                 ${isActive ? 'bg-[#E6F9E9] text-green-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`
              }
              onClick={onClose}
            >
              <span className="shrink-0 text-green-700">{it.icon}</span>
              <span className="text-sm flex-1">{it.label}</span>
              {it.countKey && counts[it.countKey] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                  {counts[it.countKey]}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

      </div>
    </aside>
  )
}

export default Sidebar
