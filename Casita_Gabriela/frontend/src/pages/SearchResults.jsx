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
      <div className='w-dvw h-[200px] bg-[#FFFECE]/80 flex flex-col items-center justify-center shadow-md/20 bg-search bg-blend-multiply'>
      <h1 className='text-white text-4xl text-center p-4'>
          Találd meg a számodra megfelelő szobát!
        </h1>
        <form onSubmit={handleSearch} className='bg-gray-400/80 rounded-md shadow-md mb-4'>

          <input
            type="text"
            placeholder='Szoba típusa...'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='bg-gray-200 text-gray-900 p-2 m-1 rounded-md'
          />

          <input
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className='bg-gray-200 text-gray-900 p-2 m-1 rounded-md'
          />

          <input
            type="date"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className='bg-gray-200 text-gray-900 p-2 m-1 rounded-md'
          />

          <input
            type="number"
            placeholder='Létszám...'
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            className='bg-gray-200 text-gray-900 p-2 m-1 rounded-md'
          />

          <button className='bg-red-400 text-white p-2 m-1 rounded-md'>
            Keresés
          </button>
        </form>
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