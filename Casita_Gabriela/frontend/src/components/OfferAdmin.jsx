import React from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const OfferAdmin = ({ id, name, price, image }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(`/room/${id}`)
  }

  return (
    <motion.div
      variants={cardVariants}
      onClick={handleClick}
      whileHover={{ scale: 1.03, rotate: 1 }}
      whileTap={{ scale: 0.98 }}
      className='bg-white cursor-pointer shadow-md hover:shadow-2xl active:shadow-green-500 rounded-xl w-72 h-72 flex flex-col items-center'
    >
      <div className='h-3/5 w-full bg-[#edf9f2] rounded-t-xl'>
        <img src={image} alt={name} className="w-full h-full object-cover rounded-t-xl" />
      </div>

      <div className='h-2/5 w-full bg-[#FFFECE] rounded-b-xl flex flex-col'>
        <div className='w-full h-1/2'>
          <p className='font-bold text-lg mt-2 ml-1 text-black'>{name}</p>
        </div>

        <div className='w-full h-1/2 flex flex-col items-end justify-end'>
          <p className='font-semibold text-lg mt-2 mr-2 text-red-500'>
            {price} Ft/fő/éj
          </p>
          <p className='font-semibold text-xs mb-2 mr-2 text-black'>
            ÁFÁ-t tartalmazza
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default OfferAdmin