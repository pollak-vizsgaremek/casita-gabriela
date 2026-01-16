// src/pages/Home.jsx
import React from 'react'
import Offer from '../components/Offer'
import Footer from '../components/Footer'

const Home = () => {

  const rooms = [
    { id: 1, name: "Példa 1", price: 50000, image: "/blob.png" },
    { id: 2, name: "Példa 2", price: 42000, image: "/blob.png" },
    { id: 3, name: "Példa 3", price: 38000, image: "/blob.png" },
    { id: 4, name: "Példa 4", price: 60000, image: "/blob.png" }
  ];

  return (
    <div className='flex flex-col items-center justify-center m-0 h-fill w-dvw spacer layerHome'>
      <div className='w-full h-[30dvh] flex items-end'>
          <h1 className='text-shadow-lg/10 font-mono tracking-wide  text-[#F1FBF4]  w-dvw text-4xl h-fill flex flex-col items-center text-center '>Kiemelt ajánlataink:</h1>
      </div>
    
      <div className=' w-dvw h-fill flex flex-wrap  items-center justify-center gap-8 p-4 pt-[20dvh]'>

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

      {/* FOOTER HOZZÁADVA */}
      <Footer />
    </div>
  )
}

export default Home
