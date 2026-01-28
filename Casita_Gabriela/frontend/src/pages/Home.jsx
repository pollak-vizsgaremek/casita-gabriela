// src/pages/Home.jsx
import React, { useState, useEffect } from 'react'
import OfferAdmin from '../components/OfferAdmin'
import Footer from '../components/Footer'
import api from '../services/api'

const Home = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

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
    <div className='flex flex-col items-center justify-center m-0 h-fill w-dvw spacer layerHome'>
      <div className='w-full h-[30dvh] flex items-end'>
          <h1 className='text-shadow-lg/10 font-mono tracking-wide  text-[#F1FBF4]  w-dvw text-4xl h-fill flex flex-col items-center text-center '>Kiemelt ajánlataink:</h1>
      </div>
    
      <div className='w-dvw h-fill flex flex-wrap items-center justify-center gap-8 p-4 pt-[20dvh]'>

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
      </div>

      {/* FOOTER HOZZÁADVA */}
      <Footer />
    </div>
  )
}

export default Home
