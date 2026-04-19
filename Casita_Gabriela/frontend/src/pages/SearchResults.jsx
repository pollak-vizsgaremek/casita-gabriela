import React, { useEffect, useState } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import { useLocation, useNavigate } from 'react-router'
import Footer from '../components/Footer'
import api from '../services/api'
import { motion } from "framer-motion"

const SearchResults = () => {
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(true)

  const [animationKey, setAnimationKey] = useState(0)

  const location = useLocation()
  const navigate = useNavigate()

  // search state
  const [category, setCategory] = useState('')
  const [arrival, setArrival] = useState('')
  const [departure, setDeparture] = useState('')
  const [people, setPeople] = useState('')

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  // sync inputs with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)

    setCategory(params.get("category") || '')
    setArrival(params.get("arrival") || '')
    setDeparture(params.get("departure") || '')
    setPeople(params.get("people") || '')
  }, [location.search])

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    if (rooms.length > 0) {
      filterRooms()
    }
  }, [rooms, location.search])

  // 🔥 trigger animation replay when results change
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
  }, [filteredRooms])

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await api.get('/rooms')
      setRooms(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    const params = new URLSearchParams(location.search)

    const categoryParam = params.get("category")
    const peopleParam = params.get("people")
    const arrivalParam = params.get("arrival")
    const departureParam = params.get("departure")

    let results = [...rooms]

    if (categoryParam) {
      results = results.filter(room =>
        room.category.toLowerCase().includes(categoryParam.toLowerCase())
      )
    }

    if (peopleParam) {
      results = results.filter(room =>
        room.space >= parseInt(peopleParam)
      )
    }

    if (arrivalParam && departureParam) {
      results = results.filter(room => {
        return true // booking logic later
      })
    }

    setFilteredRooms(results)
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
    <div className='flex flex-col items-center spacer layerAdmin'>

      {/* SEARCH BAR */}
      <div className='w-full h-[300px] relative flex items-center justify-center overflow-hidden'>
        <img
          src="/search.jpg"
          alt="search background"
          className="absolute inset-0 w-full h-[120%] object-cover z-0"
        />
        <div className='absolute inset-0 bg-black/40 z-10'></div>

        <div className='relative z-20 text-center text-white px-4'>
          <h1 className='text-4xl md:text-5xl font-bold mb-3'>
            Találd meg a számodra megfelelő szobát!
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
              min={1}
              placeholder='Létszám'
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              onKeyDown={(e) => { if (e.key === '-' || e.key === 'e' || e.key === '+') e.preventDefault(); }}
              className='p-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-red-400'
            />

            <button className='bg-red-500 hover:bg-red-600 text-white rounded-md px-4 py-2 transition font-semibold'>
              Keresés
            </button>
          </form>
        </div>
      </div>

      <div className='w-full h-[180px] flex items-end'> 
        <div className='w-dvw flex items-center justify-center gap-4 px-6'> 
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' /> 
          <h1 className='text-shadow-lg/10 font-mono text-[#4f4f4f] text-4xl text-center whitespace-nowrap'>KERESÉSI TALÁLATOK</h1> 
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' /> 
        </div> 
      </div>

      <h1 className='text-3xl mt-2 text-[#4f4f4f]'>
         {filteredRooms.length}
      </h1>

      <motion.div
        key={animationKey} // 🔥 THIS forces stagger replay
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className='flex flex-wrap justify-center gap-8 p-4'
      >
        {loading ? (
          <p>Betöltés...</p>
        ) : filteredRooms.length === 0 ? (
          <p>Nincs találat.</p>
        ) : (
          filteredRooms.map(room => (
            <motion.div key={room.id} variants={itemVariants}>
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

      <Footer />
    </div>
  )
}

export default SearchResults