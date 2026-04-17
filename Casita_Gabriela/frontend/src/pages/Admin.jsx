import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import OfferAdminEdit from '../components/OfferAdminEdit'
import api from '../services/api'
import Sidebar from '../components/Sidebar'
import { useLocation } from 'react-router'

const Admin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data)
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClick = () => {
    navigate('/AdminKezeles')
  }

  return (
    <div className="flex min-h-screen w-dvw bg-[#f7faf7]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 ml-0 md:ml-64">

        {/* MOBILE HEADER */}
        <header className="flex items-center justify-between px-5 py-4 border-b bg-white md:hidden">
          <button
            onClick={() => setSidebarOpen((s) => !s)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200"
            aria-label="Menü"
          >
            <svg className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="text-lg font-semibold">Szobák kezelése</div>
          <div style={{ width: 36 }} />
        </header>

        {/* MAIN */}
        <main className="px-5 pt-5">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Szobák</h2>

          {/* GRID – teljesen balról indul */}
          <div
            className="grid gap-5 w-full items-start"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(18rem, 1fr))" }}
          >

            {/* ADD CARD – 1:1 animáció, plusz középen */}
            <button
              onClick={handleAddClick}
              className="
                bg-[#C0FF95]
                rounded-xl
                w-72 h-72
                shadow-md
                hover:cursor-pointer
                hover:rotate-1
                transition-all duration-300
                hover:shadow-2xl
                active:shadow-green-500
                flex flex-col items-center justify-center
                relative
                animate-fadein
              "
            >
              {/* FIXED WRAPPER – plusz pixelre középen */}
              <div className="relative flex items-center justify-center w-24 h-24">

                {/* ring – pontosan akkora mint a wrapper */}
                <div className="absolute w-24 h-24 rounded-full border-4 border-green-300 border-t-transparent animate-spin-slow"></div>

                {/* circle – tökéletes közép */}
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg z-10">
                  <span className="text-white text-4xl select-none">+</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h3 className="text-xl font-semibold text-gray-800">Új szoba</h3>
                <p className="text-sm text-gray-600 mt-1">Kattints ide egy új szoba létrehozásához</p>
              </div>
            </button>

            {/* ROOMS */}
            {loading ? (
              <p className="text-gray-500 col-span-full">Szobák betöltése...</p>
            ) : (
              rooms.map((room) => (
                <div key={room.id} className="animate-fadein w-full">
                  <OfferAdminEdit
                    id={room.id}
                    name={room.name}
                    price={room.price}
                    image={
                      Array.isArray(room.images)
                        ? room.images[0]
                        : room.images || 'https://via.placeholder.com/300?text=Nincs+kép'
                    }
                    reviews={room.reviews || []}
                  />
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* EXTRA CSS */}
      <style>{`
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-fadein {
          animation: fadein 0.4s ease-out;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Admin
