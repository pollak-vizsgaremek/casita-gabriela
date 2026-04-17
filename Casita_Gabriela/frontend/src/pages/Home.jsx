import React, { useState, useEffect } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import Footer from '../components/Footer'
import api from '../services/api'
import { motion, useScroll, useTransform } from "framer-motion"
import { useNavigate } from "react-router"
import searchImg from '/search.jpg'

const Home = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [people, setPeople] = useState('')
  const [searchError, setSearchError] = useState('')

  const navigate = useNavigate()

  const currentUser = localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')) 
    : null;

  const isFirstTimeUser = currentUser?.isFirstTimeUser === true;

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 300], [0, 220]) 

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.18
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()

    setSearchError('')
    const todayStr = new Date().toISOString().slice(0,10)
    if (arrival && arrival < todayStr) {
      setSearchError('Az érkezési dátum nem lehet a múltban.')
      return
    }
    if (departure && departure < todayStr) {
      setSearchError('A távozási dátum nem lehet a múltban.')
      return
    }
    if (arrival && departure && departure <= arrival) {
      setSearchError('A távozási dátumnak később kell lennie, mint az érkezési dátumnak.')
      return
    }

    const params = new URLSearchParams()

    if (category) params.append("category", category)
    if (arrival) params.append("arrival", arrival)
    if (departure) params.append("departure", departure)
    if (people) params.append("people", people)

    navigate(`/search?${params.toString()}`)
  }

  return (
    <div className='flex flex-col items-center w-full min-h-screen 
      bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden'>

      {/* HERO */}
      <div className='w-full h-[300px] relative flex items-center justify-center overflow-hidden'>

        {/* IMAGE */}
        <motion.img
          src={searchImg}
          alt="search background"
          style={{ y }}
          className="absolute inset-0 w-full h-[120%] object-cover z-0"
        />

        {/* OVERLAY */}
        <div className='absolute inset-0 bg-black/40 z-10'></div>

        {/* CONTENT */}
        <div className='relative z-20 text-center text-white px-4'>
          <h1 className='text-4xl md:text-5xl font-bold mb-3'>
            Találd meg a tökéletes szobát
          </h1>

          <p className='text-sm md:text-lg opacity-90 mb-5'>
            Gyors, egyszerű és modern foglalás
          </p>

          {searchError && <div className="text-base md:text-lg text-white mb-3 font-medium">{searchError}</div>}
          <form 
            onSubmit={handleSearch}
            className='bg-white/80 backdrop-blur-md text-gray-800 rounded-xl shadow-xl p-4 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto'
          >
            <input
              type="text"
              placeholder='Szoba típusa'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <input
              type="number"
              min={1}
              placeholder='Létszám'
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              onKeyDown={(e) => { 
                if (e.key === '-' || e.key === 'e' || e.key === '+') 
                  e.preventDefault(); 
              }}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <button className='bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition font-semibold'>
              Keresés
            </button>
          </form>
        </div>
      </div>

      {/* CONTENT */}
      <div className='w-full max-w-6xl px-6 mt-12 mb-6 mx-auto'>
        {isFirstTimeUser && (
          <div className='m-6 p-6 bg-[#FFFECE] border border-gray-100 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <div className='flex items-start md:items-center gap-4'>
              <div className='bg-white text-red-600 p-3 rounded-lg text-2xl font-extrabold'>15%</div>
              <div>
                <div className='text-2xl font-semibold text-gray-900'>
                  15% kedvezmény az első foglalásodra
                </div>
                <div className='text-sm text-gray-600 mt-1'>
                  A kedvezmény automatikusan érvényesül a fizetésnél — nincs teendőd.
                </div>
              </div>
            </div>

            <div className="text-sm font-medium mt-2 md:mt-0 text-green-700">
              Automatikusan alkalmazva
            </div>
          </div>
        )}

        <h2 className='text-3xl font-semibold text-gray-800'>
          Kiemelt szobák
        </h2>
        <div className='w-20 h-1 bg-red-500 mt-2 rounded'></div>

        <div className='mt-6'>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            className='flex flex-wrap gap-8'
          >
            {loading ? (
              <p className='text-gray-600'>Szobák betöltése...</p>
            ) : (
              rooms
                .filter(r => r.isHighlighted)
                .map(room => (
                  <motion.div
                    key={`highlight-${room.id}`}
                    variants={cardVariants}
                    whileHover={{ scale: 1.05 }}
                    className='transition-shadow hover:shadow-2xl rounded-xl'
                  >
                    <OfferAdmin
                      id={room.id}
                      name={room.name}
                      price={room.price}
                      image={Array.isArray(room.images) ? room.images[0] : ''}
                      reviews={room.reviews || []}
                    />
                  </motion.div>
                ))
            )}
          </motion.div>
        </div>
      </div>

      <div className='w-full max-w-6xl px-6 mt-8 mb-12 mx-auto'>
        <h3 className='text-2xl font-semibold text-gray-700'>
          További szobák
        </h3>
        <div className='w-16 h-1 bg-gray-300 mt-2 rounded'></div>

        <div className='mt-6'>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={loading ? "hidden" : "visible"}
            className='flex flex-wrap gap-8'
          >
            {!loading && rooms
              .filter(r => !r.isHighlighted)
              .map(room => (
                <motion.div
                  key={`other-${room.id}`}
                  variants={cardVariants}
                  whileHover={{ scale: 1.03 }}
                  className='transition-shadow hover:shadow-lg rounded-xl'
                >
                  <OfferAdmin
                    id={room.id}
                    name={room.name}
                    price={room.price}
                    image={Array.isArray(room.images) ? room.images[0] : ''}
                    reviews={room.reviews || []}
                  />
                </motion.div>
              ))}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Home