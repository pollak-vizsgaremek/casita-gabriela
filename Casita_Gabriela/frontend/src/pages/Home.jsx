import React, { useState, useEffect } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import Footer from '../components/Footer'
import api from '../services/api'
import { motion } from "framer-motion"
import { useNavigate } from "react-router"

const Home = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [people, setPeople] = useState('')

  const navigate = useNavigate()

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
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

      <div className='w-full h-[280px] relative flex items-center justify-center bg-search bg-cover bg-center'>
        
        <div className='absolute inset-0 bg-black/40'></div>

        <div className='relative z-10 text-center text-white px-4'>
          <h1 className='text-4xl md:text-5xl font-bold mb-3'>
            Találd meg a tökéletes szobát
          </h1>

          <p className='text-sm md:text-lg opacity-90 mb-5'>
            Gyors, egyszerű és modern foglalás
          </p>

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
              placeholder='Létszám'
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <button className='bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition font-semibold'>
              Keresés
            </button>
          </form>
        </div>
      </div>


      <div className='w-full max-w-6xl px-6 mt-12 mb-6'>
        <h2 className='text-3xl font-semibold text-gray-800'>
          Kiemelt ajánlatok
        </h2>
        <div className='w-20 h-1 bg-red-500 mt-2 rounded'></div>
      </div>


      
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={loading ? "hidden" : "visible"}
          className='flex flex-wrap justify-center gap-8'
        >
          {loading ? (
            <p className='text-gray-600'>Szobák betöltése...</p>
          ) : (
            rooms.map(room => (
              <motion.div
                key={room.id}
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
                className='transition-shadow hover:shadow-2xl rounded-xl'
              >
                <OfferAdmin
                  id={room.id}
                  name={room.name}
                  price={room.price}
                  image={Array.isArray(room.images) ? room.images[0] : ''}
                />
              </motion.div>
            ))
          )}
        </motion.div>

      

      <Footer />
    </div>
  )
}

export default Home