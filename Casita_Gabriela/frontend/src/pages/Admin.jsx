import React from 'react'
import { useNavigate } from 'react-router'
import Offer from '../components/Offer'

const rooms = [
    { id: 1, name: "Példa 1", price: 50000, image: "/peldaRoom1.jpg" },
    { id: 2, name: "Példa 2", price: 42000, image: "/peldaRoom2.jpg" },
    { id: 3, name: "Példa 3", price: 38000, image: "/peldaRoom3.jpg" },
    { id: 1, name: "Példa 4", price: 67000, image: "/peldaRoom1.jpg" },
    { id: 2, name: "Példa 5", price: 425000, image: "/peldaRoom2.jpg" },
    { id: 3, name: "Példa 6", price: 3843000, image: "/peldaRoom3.jpg" },
    
  ];

const Admin = () => {
  const navigate = useNavigate()

  const handleAddClick = () => {
    navigate('/AdminKezeles')
  }

  return (
    <div className='flex items-center justify-center m-0 w-dvw spacer layerAdmin'>
      <div className='h-fill grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 justify-items-center items-center gap-12 p-4 pt-[20dvh]'>


        <div onClick={handleAddClick} className='bg-[#C0FF95] wrapper hover:cursor-pointer hover:rotate-1 transition-all duration-300 fade-in shadow-md/40 hover:shadow-2xl active:shadow-green-500 active:translate-y-3 rounded-xl w-72 h-72 flex flex-col items-center justify-center'>
           <p className='target text-green-800 text-[150px] pb-0 transition-all duration-500 h-fill w-full plus'></p>
           <p className='text-green-800 text-3xl pt-0 h-fill w-full text-center m-0 p-0'>Hozzáadás</p>
        </div>

         {rooms.map(room => (
          <Offer
            key={room.id}
            id={room.id}
            name={room.name}
            price={room.price}
            image={room.image}
          />
        ))}

        

      </div>
    </div>
  )
}

export default Admin
