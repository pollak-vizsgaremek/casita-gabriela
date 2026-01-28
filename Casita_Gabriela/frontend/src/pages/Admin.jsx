import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import OfferAdminEdit from '../components/OfferAdminEdit'
import api from '../services/api'

const Admin = () => {
  const navigate = useNavigate()
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

  const handleAddClick = () => {
    navigate('/AdminKezeles')
  }

  return (
    <div className='flex items-center justify-center m-0 w-dvw spacer layerAdmin'>
      <div className='h-fill grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 justify-items-center items-center gap-12 p-4 pt-[20dvh]'>

        <div onClick={handleAddClick} className='bg-[#C0FF95] fade-in-Spin wrapper hover:cursor-pointer hover:rotate-1 transition-all duration-300 shadow-md/40 active:shadow-green-500 active:translate-y-3 rounded-xl w-72 h-72 flex flex-col items-center justify-center'>
           <p className='target text-green-800 text-[150px] pb-0 transition-all duration-500 h-fill w-full plus'></p>
           <p className='text-green-800 text-3xl pt-0 h-fill w-full text-center m-0 p-0'>Hozzáadás</p>
        </div>

        {loading ? (
          <p className='text-gray-500'>Szobák betöltése...</p>
        ) : (
          rooms.map(room => (
           <OfferAdminEdit
      key={room.id}
      id={room.id}
      name={room.name}
      price={room.price}
      image={Array.isArray(room.images) ? room.images[0] : room.images || 'https://via.placeholder.com/300?text=Nincs+kép'}
    />
          ))
        )}
      </div>
    </div>
  )
}

export default Admin
