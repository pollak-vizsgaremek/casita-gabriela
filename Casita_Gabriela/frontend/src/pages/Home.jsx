
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
    <div className='flex flex-col items-center justify-center m-0 h-fill w-dvw spacer layerAdmin'>

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
          <h1 className='text-shadow-lg/10 font-mono text-[#4f4f4f] text-4xl text-center whitespace-nowrap'>KIEMELT AJÁNLATOK</h1> 
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' /> 
        </div> 
      </div>

   
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={loading ? "hidden" : "visible"}
        className='flex flex-wrap justify-center gap-8 p-4'
      >
        {loading ? (
          <p>Szobák betöltése...</p>
        ) : (
          rooms.map(room => (
            <OfferAdmin
              key={room.id}
              id={room.id}
              name={room.name}
              price={room.price}
              image={Array.isArray(room.images) ? room.images[0] : ''}
            />
          ))
        )}
      </motion.div>

      <Footer />
    </div>
  )
}

export default Home