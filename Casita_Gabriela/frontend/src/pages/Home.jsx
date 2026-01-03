import React from 'react'
import Offer from '../components/Offer'

const Home = () => {
  return (
    <div className='flex flex-col items-center justify-center m-0 h-fill w-dvw spacer layerHome'>
      <div className='w-full h-[30dvh] flex items-end'>
          <h1 className='text-shadow-lg/10 font-mono tracking-wide  text-[#F1FBF4]  w-dvw text-4xl h-fill flex flex-col items-center text-center '>Kiemelt ajánlataink:</h1>
      </div>
    
      
      <div className=' w-dvw h-fill flex flex-wrap  items-center justify-center gap-8 p-4 pt-[20dvh]'>

     
        <Offer />
        <Offer />
        <Offer />
        <Offer />
        <Offer />
        <Offer />
        <Offer />
        <Offer />


      </div>
    </div>
  )
}

export default Home
