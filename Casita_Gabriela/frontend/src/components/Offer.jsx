import React from 'react'

const Offer = () => {
  return (
    <div className='bg-white hover:cursor-pointer hover:rotate-1  transition-all duration-300 fade-in shadow-md hover:shadow-2xl active:shadow-green-500 rounded-xl w-48 h-72 flex flex-col items-center'>
      <div className='h-3/5 w-full bg-[#edf9f2] rounded-t-xl'>
        <img src="/blob.png" alt="Offer blob" className="w-full h-full object-cover rounded-t-xl" />
      </div>
      <div className='h-2/5 w-full bg-[#a4dfb9] rounded-b-xl flex flex-col'>
        <div className='w-full h-1/2'>
          <p className='font-bold text-lg mt-2 ml-1'>Példa 1</p>
        </div>
        <div className='w-full h-1/2 flex justify-end'>
          <p className='font-semibold text-md mt-2 mr-2'>50.000 Ft/éj</p>
        </div>
      </div>
    </div>
  )
}

export default Offer
