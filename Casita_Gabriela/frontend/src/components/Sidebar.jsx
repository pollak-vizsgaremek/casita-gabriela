import React from 'react'
import { NavLink } from 'react-router'

const Sidebar = ({ isOpen, onClose }) => {
  const items = [
    { to: '/admin', label: 'Szobák kezelése', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    )},
    { to: '/admin/bookings', label: 'Foglalások kezelése', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V11H3v8a2 2 0 002 2z" />
      </svg>
    )},
    { to: '/admin/reviews', label: 'Értékelések', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 17l-5 3 1-6-4-4 6-1 3-6 3 6 6 1-4 4 1 6z" />
      </svg>
    )},
    { to: '/admin/users', label: 'Felhasználók kezelése', icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM8 11c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zM2 20c0-3.314 2.686-6 6-6h8c3.314 0 6 2.686 6 6" />
      </svg>
    )},
  ]

  return (
    <aside
      className={`bg-white text-black shadow-md z-40 transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:shadow-none w-64 fixed md:relative inset-y-0 left-0`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-4 border-b">
          <div className="text-lg font-semibold">Admin</div>
          <div className="text-xs text-gray-500 mt-1">Vezérlőpult</div>
        </div>

        <nav className="flex-1 overflow-auto p-2">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/admin'} // ensure /admin is active only on exact
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors
                 ${isActive ? 'bg-[#E6F9E9] text-green-800 font-medium' : 'text-gray-700 hover:bg-gray-100'}`
              }
              onClick={onClose}
            >
              <span className="flex-shrink-0 text-green-700">{it.icon}</span>
              <span className="text-sm">{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t text-xs text-gray-500">
          <div>Beállítások és statisztikák</div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
