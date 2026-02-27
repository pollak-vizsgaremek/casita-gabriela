// src/pages/Home.jsx
import React, { useState, useEffect } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import Footer from '../components/Footer'
import api from '../services/api'
import { motion } from "framer-motion"

const Home = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)


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
      console.log('Fetched rooms:', response.data)
      setRooms(response.data)
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex flex-col items-center justify-center m-0 h-fill w-dvw spacer layerAdmin'>
      <div className='w-dvw h-[200px] bg-[#FFFECE]/80 flex flex-col items-center  justify-center shadow-md/20 bg-search bg-blend-multiply'>
      <h1 className='text-shadow-lg/10 font-mono tracking-wide  text-white text-4xl text-center p-4'>Találd meg a számodra megfelelő szobát!</h1>
        <form action="" className='bg-gray-400/80 rounded-md shadow-md mb-4'>
          <input type="text" placeholder='Szoba típusa...' className='bg-gray-200 hover:bg-gray-100 duration-300 rounded-md p-2 m-1  text-gray-800' />
          <input type="date" className='bg-gray-200 hover:bg-gray-100 duration-300 rounded-md p-2 m-1 text-gray-800'/>
          <input type="date" className='bg-gray-200 hover:bg-gray-100 duration-300 rounded-md p-2 m-1 text-gray-800'/>
          <input type="number" placeholder='Létszám...' className='bg-gray-200 hover:bg-gray-100 duration-300 rounded-md p-2 m-1 text-gray-800'/>
          <button className='bg-red-400 text-white rounded-md p-2 m-1 hover:cursor-pointer hover:bg-red-500 duration-300'>Keresés</button>
        </form>
      </div>
      <div className='w-full h-[180px] flex items-end'>
        <div className='w-dvw flex items-center justify-center gap-4 px-6'>
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' />
          <h1 className='text-shadow-lg/10 font-mono  text-[#4f4f4f] text-4xl text-center whitespace-nowrap'>KIEMELT AJÁNLATOK</h1>
          <hr className='flex-1 border-t-2 border-[#4f4f4f]/70' />
        </div>
      </div>
    
      <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={loading ? "hidden" : "visible"}
          className='w-dvw h-fill flex flex-wrap items-center justify-center gap-8 p-4 pt-4'
      >

        {loading ? (
          <p className='text-gray-500'>Szobák betöltése...</p>
        ) : (
          rooms.map(room => (
            <OfferAdmin
              key={room.id}
              id={room.id}
              name={room.name}
              price={room.price}
              image={Array.isArray(room.images) ? room.images[0] : room.images || 'https://via.placeholder.com/300?text=Nincs+kép'}
            />
          ))
        )}
      </motion.div>

      {/* FOOTER HOZZÁADVA */}
      <Footer />
    </div>
  )
}

export default Home
